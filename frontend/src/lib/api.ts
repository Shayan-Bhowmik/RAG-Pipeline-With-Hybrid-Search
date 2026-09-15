import {
  API_BASE_URL,
  IS_API_CONFIGURED,
  MAX_QUERY_LENGTH,
  REQUEST_TIMEOUT_MS,
} from "@/lib/config";
import type {
  DocumentSummary,
  DocumentsResponse,
  QueryResponse,
  RetrievalMethod,
  RetrieveResponse,
  RetrievedChunk,
} from "@/lib/types";

/**
 * Every way a request can fail, mapped to a state the UI knows how to render.
 * Raw backend text never reaches the user; `detail` is kept for the console.
 */
export type ApiErrorKind =
  | "not-configured"
  | "network"
  | "timeout"
  | "invalid-query"
  | "generation-failed"
  | "service-unavailable"
  | "malformed-response";

export interface ApiErrorCopy {
  title: string;
  description: string;
  /** Label for the recovery control, or null when there is nothing to retry. */
  action: string | null;
}

const ERROR_COPY: Record<ApiErrorKind, ApiErrorCopy> = {
  "not-configured": {
    title: "Query service address is not set",
    description:
      "This build has no backend origin configured, so it cannot reach the retrieval API. Set NEXT_PUBLIC_BACKEND_URL and redeploy.",
    action: null,
  },
  network: {
    title: "Unable to reach the query service",
    description:
      "The request did not complete. The backend may be offline, it may not accept requests from this origin, or it failed before it could answer.",
    action: "Try again",
  },
  timeout: {
    title: "The query took too long",
    description:
      "Retrieval and reranking run on CPU, so cold starts are slow. The request was cancelled rather than left hanging.",
    action: "Try again",
  },
  "invalid-query": {
    title: "That query could not be processed",
    description:
      "The backend rejected the request as malformed. Rephrase the question and submit it again.",
    action: "Edit query",
  },
  "generation-failed": {
    title: "Retrieval succeeded, generation did not",
    description:
      "The pipeline reached the language model and the call failed. Your query was not lost.",
    action: "Try again",
  },
  "service-unavailable": {
    title: "The query service is not responding correctly",
    description:
      "The backend returned an error instead of a result. This usually clears on its own.",
    action: "Try again",
  },
  "malformed-response": {
    title: "Unexpected response from the query service",
    description:
      "The backend replied with a shape this interface does not recognise, so nothing was rendered rather than showing a partial result.",
    action: "Try again",
  },
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(kind: ApiErrorKind, detail?: string | null, status?: number | null) {
    super(`${kind}${detail ? `: ${detail}` : ""}`);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status ?? null;
    this.detail = detail ?? null;
  }

  get copy(): ApiErrorCopy {
    return ERROR_COPY[this.kind];
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("timeout");
  }
  return new ApiError("network", error instanceof Error ? error.message : String(error));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (body: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  if (!IS_API_CONFIGURED) throw new ApiError("not-configured");

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => timeout.abort();
  signal?.addEventListener("abort", onCallerAbort);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: timeout.signal,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // A caller-initiated abort is a cancellation, not a timeout.
      throw signal?.aborted ? new ApiError("network", "cancelled") : new ApiError("timeout");
    }
    throw new ApiError("network", error instanceof Error ? error.message : null);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => null);
    if (process.env.NODE_ENV === "development") {
      console.warn(`[hybridrag] ${path} responded ${response.status}`, detail);
    }
    if (response.status === 400 || response.status === 422) {
      throw new ApiError("invalid-query", detail, response.status);
    }
    if (response.status >= 500 && path === "/query") {
      throw new ApiError("generation-failed", detail, response.status);
    }
    throw new ApiError("service-unavailable", detail, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("malformed-response", "response body was not JSON");
  }

  try {
    return parse(body);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[hybridrag] ${path} failed shape validation`, body);
    }
    throw new ApiError(
      "malformed-response",
      error instanceof Error ? error.message : null,
    );
  }
}

function parseChunk(raw: unknown): RetrievedChunk {
  if (!isRecord(raw)) throw new Error("chunk is not an object");
  if (!isString(raw.chunk_id)) throw new Error("chunk_id missing");
  if (!isString(raw.doc_id)) throw new Error("doc_id missing");
  if (!isString(raw.text)) throw new Error("text missing");

  return {
    chunk_id: raw.chunk_id,
    doc_id: raw.doc_id,
    text: raw.text,
    page_or_section: isString(raw.page_or_section) ? raw.page_or_section : null,
    score: isFiniteNumber(raw.score) ? raw.score : 0,
    rrf_score: isFiniteNumber(raw.rrf_score) ? raw.rrf_score : undefined,
    dense_rank: isFiniteNumber(raw.dense_rank) ? raw.dense_rank : null,
    sparse_rank: isFiniteNumber(raw.sparse_rank) ? raw.sparse_rank : null,
    reranker_score: isFiniteNumber(raw.reranker_score) ? raw.reranker_score : undefined,
  };
}

function parseQueryResponse(raw: unknown): QueryResponse {
  if (!isRecord(raw)) throw new Error("response is not an object");
  if (!isString(raw.answer)) throw new Error("answer missing");
  if (!Array.isArray(raw.citations)) throw new Error("citations missing");
  if (!Array.isArray(raw.chunks_used)) throw new Error("chunks_used missing");

  const citations = raw.citations.map((entry) => {
    if (!isRecord(entry)) throw new Error("citation is not an object");
    if (!isFiniteNumber(entry.citation_index)) throw new Error("citation_index missing");
    if (!isString(entry.chunk_id)) throw new Error("citation chunk_id missing");
    return {
      citation_index: entry.citation_index,
      chunk_id: entry.chunk_id,
      doc_id: isString(entry.doc_id) ? entry.doc_id : "",
      text: isString(entry.text) ? entry.text : "",
      page_or_section: isString(entry.page_or_section) ? entry.page_or_section : null,
      reranker_score: isFiniteNumber(entry.reranker_score) ? entry.reranker_score : 0,
    };
  });

  const chunksUsed = raw.chunks_used.map((entry) => {
    if (!isRecord(entry)) throw new Error("chunk_used is not an object");
    if (!isString(entry.chunk_id)) throw new Error("chunks_used chunk_id missing");
    return {
      chunk_id: entry.chunk_id,
      doc_id: isString(entry.doc_id) ? entry.doc_id : "",
      text: isString(entry.text) ? entry.text : "",
      reranker_score: isFiniteNumber(entry.reranker_score) ? entry.reranker_score : 0,
    };
  });

  return {
    query: isString(raw.query) ? raw.query : "",
    answer: raw.answer,
    retrieval_mode: isString(raw.retrieval_mode) ? raw.retrieval_mode : "hybrid",
    citations,
    chunks_used: chunksUsed,
    model: isString(raw.model) ? raw.model : "",
  };
}

function parseRetrieveResponse(raw: unknown): RetrieveResponse {
  if (!isRecord(raw)) throw new Error("response is not an object");
  if (!Array.isArray(raw.results)) throw new Error("results missing");
  if (!isString(raw.method)) throw new Error("method missing");

  return {
    query: isString(raw.query) ? raw.query : "",
    method: raw.method as RetrievalMethod,
    results: raw.results.map(parseChunk),
  };
}

function parseDocumentsResponse(raw: unknown): DocumentsResponse {
  if (!isRecord(raw)) throw new Error("response is not an object");
  if (!Array.isArray(raw.documents)) throw new Error("documents missing");

  const documents: DocumentSummary[] = raw.documents.flatMap((entry) => {
    if (!isRecord(entry) || !isString(entry.doc_id) || !isString(entry.title)) return [];
    return [{ doc_id: entry.doc_id, title: entry.title }];
  });

  return { documents };
}

/** Rejects a query client-side before it costs a round trip. */
export function validateQuery(question: string): ApiErrorKind | null {
  const trimmed = question.trim();
  if (!trimmed) return "invalid-query";
  if (trimmed.length > MAX_QUERY_LENGTH) return "invalid-query";
  return null;
}

export function postQuery(question: string, signal?: AbortSignal): Promise<QueryResponse> {
  return request(
    "/query",
    { method: "POST", body: JSON.stringify({ question: question.trim() }) },
    parseQueryResponse,
    signal,
  );
}

export function postRetrieve(
  method: RetrievalMethod,
  query: string,
  topN: number,
  signal?: AbortSignal,
): Promise<RetrieveResponse> {
  return request(
    `/retrieve/${method}`,
    { method: "POST", body: JSON.stringify({ query: query.trim(), top_n: topN }) },
    parseRetrieveResponse,
    signal,
  );
}

export function getDocuments(signal?: AbortSignal): Promise<DocumentsResponse> {
  return request("/documents", { method: "GET" }, parseDocumentsResponse, signal);
}
