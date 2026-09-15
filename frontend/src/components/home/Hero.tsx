import Link from "next/link";

import { HeroVisual } from "@/components/site/HeroVisual";
import { buttonPrimary, buttonSecondary, cn } from "@/lib/cn";
import { evaluationResults, formatPercent } from "@/lib/evaluation";

function findMetric(mode: string) {
  const overall = evaluationResults?.tables.find((table) => table.id === "overall");
  return overall?.rows.find((row) => row.mode.startsWith(mode));
}

export function Hero() {
  const hybrid = findMetric("Hybrid (RRF)");
  const dense = findMetric("Dense");
  const evalSize = evaluationResults?.evalSetSize;

  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Retrieval-augmented generation
          </p>

          <h1 className="mt-4 text-[2rem] font-semibold leading-[1.15] tracking-tight text-fg sm:text-[2.6rem]">
            Hybrid retrieval for grounded answers
          </h1>

          <p className="mt-5 max-w-xl text-[1rem] leading-7 text-fg-muted">
            HybridRAG answers questions from a private document corpus. Each query runs
            through dense vector search and BM25 keyword search in parallel. The two
            ranked lists are fused with reciprocal rank fusion, reranked by a
            cross-encoder, and only then passed to a language model, which answers from
            that context alone and cites the chunks it used.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/query" className={cn(buttonPrimary, "px-5 py-2.5")}>
              Open the query workspace
            </Link>
            <Link href="/#architecture" className={cn(buttonSecondary, "px-5 py-2.5")}>
              Read the architecture
            </Link>
          </div>

          {hybrid && dense && evalSize ? (
            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-xs text-fg-faint">Hybrid recall@5</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-fg">
                  {formatPercent(hybrid.metrics.recall5)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-fg-faint">Dense-only recall@5</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-fg-muted">
                  {formatPercent(dense.metrics.recall5)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-fg-faint">Eval set</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-fg-muted">
                  {evalSize} queries
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="min-w-0">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
