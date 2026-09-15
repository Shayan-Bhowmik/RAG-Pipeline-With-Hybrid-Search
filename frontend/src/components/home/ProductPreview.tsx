import Link from "next/link";

import { Section } from "@/components/site/Section";
import { buttonSecondary, cn } from "@/lib/cn";

/**
 * A captured response, not a mockup. The question, answer text, chunk id and
 * reranker score below are copied verbatim from a real /query call against the
 * indexed corpus, so nothing here shows behaviour the system does not have.
 */
export function ProductPreview() {
  return (
    <Section
      id="workspace"
      eyebrow="The product"
      title="Answer on the left, evidence on the right"
      lead="The workspace puts the generated answer next to the exact chunks the model was given. Citation markers are interactive: selecting one highlights the chunk it refers to and expands its full text."
    >
      <div className="rounded-card border border-border bg-surface-sunken p-4 sm:p-6">
        <p className="font-mono text-xs text-fg-faint">
          Captured from a live query against the demo corpus
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2.5">
              <span className="text-xs font-semibold tracking-tight text-fg">Answer</span>
              <span className="font-mono text-[0.68rem] text-fg-faint">
                nvidia/nemotron-3-ultra-550b-a55b:free
              </span>
            </div>
            <div className="px-4 py-4 text-sm leading-6 text-fg-muted">
              <p>
                Reciprocal Rank Fusion (RRF) is a hand-built method for fusing dense and
                sparse retrieval ranked lists. The score for each chunk is calculated as:
              </p>
              <p className="mt-3 font-semibold text-fg">
                score = sum of 1 / (k + rank) across both ranked lists
              </p>
              <p className="mt-3">
                After computing scores for all chunks, the results are merged and
                re-sorted by this combined score
                <sup className="mx-0.5 inline-block align-super leading-none">
                  <span className="rounded-sm border border-citation bg-citation px-1 font-mono text-[0.7rem] leading-normal text-bg">
                    1
                  </span>
                </sup>
                .
              </p>
            </div>
            <div className="border-t border-border px-4 py-2.5 text-[0.7rem] text-fg-faint">
              1 of 5 retrieved chunks cited
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 pb-2.5">
              <span className="text-xs font-semibold tracking-tight text-fg">Evidence</span>
              <span className="font-mono text-[0.68rem] text-fg-faint">1 cited / 5 retrieved</span>
            </div>

            <div className="rounded-card border-y border-r border-l-2 border-y-citation/40 border-r-citation/40 border-l-citation bg-surface-raised p-3.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-citation bg-citation px-1 font-mono text-xs text-bg">
                  1
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-fg">
                  05_Feature_Ticket_List
                </span>
                <span className="rounded-sm border border-citation/40 px-1.5 py-0.5 font-mono text-[0.62rem] text-citation">
                  cited
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-5 text-fg-muted">
                T10. Reciprocal Rank Fusion (Hand-Built) Description: Implement RRF
                yourself: for each chunk, score = sum of 1 / (k + rank) across both ranked
                lists, then merge and re-sort.
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2.5 font-mono text-[0.65rem] text-fg-faint">
                <div className="flex gap-1.5">
                  <dt>chunk</dt>
                  <dd className="text-fg-muted">1fbb0489</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>rerank</dt>
                  <dd className="text-fg-muted">0.9942</dd>
                </div>
              </dl>
            </div>

            <Link href="/query" className={cn(buttonSecondary, "mt-4 w-full justify-center")}>
              Run your own query
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
