/**
 * Types for the HybridRAG FastAPI contract.
 *
 * These mirror what the backend actually returns, verified against live
 * responses from backend/app/routes/{query,retrieve,documents}.py. Note that
 * they differ from the Frontend Specification document, which describes a
 * `sources` array with `doc_title` and `score` that the backend does not send.
 *
 * Known shape caveats, all handled in the UI rather than papered over:
 *   - `page_or_section` is present on every chunk but is null for the whole
 *     corpus, because the chunker never populates it.
 *   - `chunks_used[].text` is truncated to 200 characters by the backend.
 *     `citations[].text` carries the full chunk text, but only for chunks the
 *     model actually cited.
 *   - `doc_id` is a UUID. Titles come from the separate /documents endpoint.
 */

/** A chunk as returned by any of the /retrieve/* endpoints. */
export interface RetrievedChunk {
  chunk_id: string;
  doc_id: string;
  text: string;
  page_or_section: string | null;
  /**
   * Cosine similarity for dense, BM25 for sparse. On hybrid and reranked
   * responses this field is carried over from whichever list first supplied
   * the chunk, so it is not comparable across modes and is not displayed
   * outside the mode that produced it.
   */
  score: number;
  /** Present on /retrieve/hybrid and /retrieve/reranked. */
  rrf_score?: number;
  /** 1-based position in the dense list, or null when dense did not return it. */
  dense_rank?: number | null;
  /** 1-based position in the sparse list, or null when sparse did not return it. */
  sparse_rank?: number | null;
  /** Cross-encoder score. Present on /retrieve/reranked only. */
  reranker_score?: number;
}

export type RetrievalMethod = "dense" | "sparse" | "hybrid" | "reranked";

export interface RetrieveResponse {
  query: string;
  method: RetrievalMethod;
  results: RetrievedChunk[];
}

/** One entry of `citations` on a /query response. */
export interface QueryCitation {
  /** 1-based index matching the `[n]` markers inside `answer`. */
  citation_index: number;
  chunk_id: string;
  doc_id: string;
  /** Full chunk text. */
  text: string;
  page_or_section: string | null;
  reranker_score: number;
}

/** One entry of `chunks_used` on a /query response. */
export interface QueryChunkUsed {
  chunk_id: string;
  doc_id: string;
  /** Truncated to 200 characters by the backend. */
  text: string;
  reranker_score: number;
}

export interface QueryResponse {
  query: string;
  answer: string;
  retrieval_mode: string;
  citations: QueryCitation[];
  chunks_used: QueryChunkUsed[];
  model: string;
}

export interface DocumentSummary {
  doc_id: string;
  title: string;
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
}

export interface HealthResponse {
  status: string;
}

/**
 * A single evidence card in the workspace: one of the top-k reranked chunks
 * the generator was given, merged from `chunks_used` and `citations`.
 */
export interface AnswerSource {
  /** 1-based position in the reranked context window, matching `[n]`. */
  index: number;
  chunkId: string;
  docId: string;
  text: string;
  /** False when `text` is the backend's 200-character preview. */
  isFullText: boolean;
  /** True when the generated answer actually cites this chunk. */
  isCited: boolean;
  pageOrSection: string | null;
  rerankerScore: number;
}
