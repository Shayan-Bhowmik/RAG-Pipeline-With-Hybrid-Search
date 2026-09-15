/**
 * Runtime configuration.
 *
 * The frontend talks to exactly one service: the FastAPI backend. Its origin
 * comes from the environment so the same build works on localhost and on a
 * custom domain. `NEXT_PUBLIC_BACKEND_URL` is the name already used by
 * `.env.local.example`; `NEXT_PUBLIC_API_URL` is accepted as an alias.
 */

const DEV_FALLBACK_ORIGIN = "http://localhost:8000";

function readApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

  const trimmed = configured.trim().replace(/\/+$/, "");
  if (trimmed) return trimmed;

  // Development convenience only. A production build with no configured
  // origin reports a configuration error in the UI instead of guessing.
  if (process.env.NODE_ENV === "development") return DEV_FALLBACK_ORIGIN;

  return "";
}

export const API_BASE_URL = readApiBaseUrl();

export const IS_API_CONFIGURED = API_BASE_URL.length > 0;

/**
 * True when we fell back to the local dev origin rather than reading a
 * configured value. The workspace surfaces this so nobody mistakes a local
 * backend for a deployed one.
 */
export const IS_USING_DEV_FALLBACK =
  process.env.NODE_ENV === "development" &&
  !process.env.NEXT_PUBLIC_BACKEND_URL &&
  !process.env.NEXT_PUBLIC_API_URL;

/**
 * Client-side abort threshold.
 *
 * Retrieval and reranking finish in well under a second. Generation is the
 * long pole: the configured model has measured between 60 and 120 seconds per
 * query, so a shorter limit cancels requests that would have succeeded. Lower
 * this once a faster generation model is in use.
 */
export const REQUEST_TIMEOUT_MS = 180_000;

/** Matches the Security and Access document's stated query ceiling. */
export const MAX_QUERY_LENGTH = 2000;

export const SITE = {
  name: "HybridRAG",
  repoUrl: "https://github.com/Shayan-Bhowmik/RAG-Pipeline-With-Hybrid-Search",
} as const;
