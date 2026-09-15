import type { AnswerSource, QueryResponse } from "@/lib/types";

/**
 * Builds the evidence list shown beside an answer.
 *
 * `chunks_used` is the authoritative list: it is every chunk the generator was
 * given, in reranked order, so position + 1 is the `[n]` a citation marker
 * refers to. `citations` covers only the subset the model cited, but carries
 * full chunk text where `chunks_used` carries a 200 character preview. We take
 * the list from the former and the text from the latter wherever possible.
 */
export function buildAnswerSources(response: QueryResponse): AnswerSource[] {
  const byIndex = new Map(response.citations.map((c) => [c.citation_index, c]));
  const byChunkId = new Map(response.citations.map((c) => [c.chunk_id, c]));

  return response.chunks_used.map((chunk, position) => {
    const index = position + 1;
    const fromIndex = byIndex.get(index);
    // Trust the index only when it agrees with the chunk it should point at.
    const citation =
      fromIndex && fromIndex.chunk_id === chunk.chunk_id
        ? fromIndex
        : byChunkId.get(chunk.chunk_id);

    const hasFullText = Boolean(citation && citation.text.length > chunk.text.length);

    return {
      index,
      chunkId: chunk.chunk_id,
      docId: chunk.doc_id,
      text: hasFullText && citation ? citation.text : chunk.text,
      isFullText: hasFullText,
      isCited: Boolean(citation),
      pageOrSection: citation?.page_or_section ?? null,
      rerankerScore: chunk.reranker_score,
    };
  });
}

/** DOM id shared by a citation marker and the source card it points at. */
export function sourceDomId(index: number): string {
  return `hybridrag-source-${index}`;
}

/** Short, stable label for a UUID. Full value stays available on hover. */
export function shortId(id: string): string {
  return id.slice(0, 8);
}

/**
 * Document titles come from /documents. When the lookup has not resolved, or
 * the id is not in it, we fall back to the shortened UUID rather than an
 * invented name.
 */
export function documentLabel(docId: string, titles: Map<string, string>): string {
  return titles.get(docId) ?? `doc ${shortId(docId)}`;
}

export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 100) return value.toFixed(1);
  return value.toFixed(4);
}
