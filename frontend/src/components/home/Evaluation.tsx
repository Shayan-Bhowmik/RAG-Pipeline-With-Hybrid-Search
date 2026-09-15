"use client";

import { useState } from "react";

import { Section } from "@/components/site/Section";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/cn";
import {
  METRIC_COLUMNS,
  evaluationResults,
  formatMetric,
  formatPercent,
} from "@/lib/evaluation";

function EmptyState() {
  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h3 className="text-base font-semibold tracking-tight text-fg">
        No evaluation run is available in this build
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted">
        This section reports two retrieval metrics, measured against a set of questions
        with known correct chunks.
      </p>
      <dl className="mt-4 max-w-2xl space-y-3 text-sm leading-7 text-fg-muted">
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-fg-faint">Recall@k</dt>
          <dd>
            The share of questions where the correct chunk appears somewhere in the top k
            results. Recall@5 matters most in practice, because the top five chunks are
            what the generator actually receives.
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-fg-faint">MRR</dt>
          <dd>
            Mean reciprocal rank. The average of 1 divided by the position of the correct
            chunk, so it rewards ranking the right chunk first rather than merely
            including it.
          </dd>
        </div>
      </dl>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-muted">
        Numbers will appear here once the eval harness has been run and its results
        synced into the build.
      </p>
    </div>
  );
}

export function Evaluation() {
  const results = evaluationResults;
  const [activeTableId, setActiveTableId] = useState(results?.tables[0]?.id ?? "");

  if (!results) {
    return (
      <Section
        id="evaluation"
        eyebrow="Evaluation"
        title="Measured, not asserted"
        lead="Retrieval claims are only worth what the measurements behind them are worth."
      >
        <EmptyState />
      </Section>
    );
  }

  const active = results.tables.find((table) => table.id === activeTableId) ?? results.tables[0];
  const overall = results.tables.find((table) => table.id === "overall");
  const hybrid = overall?.rows.find((row) => row.mode.startsWith("Hybrid (RRF)"));
  const dense = overall?.rows.find((row) => row.mode.startsWith("Dense"));
  const reranked = overall?.rows.find((row) => row.mode.startsWith("Hybrid + Reranker"));

  return (
    <Section
      id="evaluation"
      eyebrow="Evaluation"
      title="Measured, not asserted"
      lead={`Every retrieval mode was run against the same ${results.evalSetSize ?? ""} question eval set, split evenly between queries containing exact terms and paraphrased queries. The numbers below come straight from that run.`}
    >
      <div
        role="radiogroup"
        aria-label="Query subset"
        className="inline-flex flex-wrap gap-1 rounded-card border border-border bg-surface-sunken p-1"
      >
        {results.tables.map((table) => {
          const isActive = table.id === active.id;
          return (
            <button
              key={table.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setActiveTableId(table.id)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-accent/15 text-accent ring-1 ring-accent/50"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {table.label}
              {table.queryCount ? (
                <span className="ml-1.5 font-mono text-[0.68rem] text-fg-faint">
                  {table.queryCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 overflow-x-auto rounded-card border border-border bg-surface scrollbar-thin">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <caption className="sr-only">
            {`Recall and mean reciprocal rank by retrieval mode, ${active.label.toLowerCase()}. Values marked as best are the highest in their column.`}
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-left font-medium text-fg-muted">
                Retrieval mode
              </th>
              {METRIC_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-right font-mono text-xs font-medium text-fg-muted"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.rows.map((row) => (
              <tr key={row.mode} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-normal text-fg">
                  {row.mode}
                </th>
                {METRIC_COLUMNS.map((column) => {
                  const isBest = row.best[column.key];
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-right font-mono tabular-nums",
                        isBest ? "font-semibold text-fg" : "text-fg-muted",
                      )}
                    >
                      {formatMetric(row.metrics[column.key])}
                      {isBest ? <span className="sr-only"> (best in column)</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-xs text-fg-faint">
        Generated from {results.generatedFrom}. Bold values are the highest in their column.
      </p>

      {hybrid && dense && reranked ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold tracking-tight text-fg">
              Fusion lifts the context window
            </h3>
            <p className="mt-2.5 text-sm leading-7 text-fg-muted">
              The generator receives the top five chunks. Dense-only retrieval puts the
              correct chunk in that window {formatPercent(dense.metrics.recall5)} of the
              time. Fusion raises it to {formatPercent(hybrid.metrics.recall5)}.
            </p>
          </article>

          <article className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold tracking-tight text-fg">
              And it ranks better, not just wider
            </h3>
            <p className="mt-2.5 text-sm leading-7 text-fg-muted">
              MRR moves from {formatMetric(dense.metrics.mrr)} to{" "}
              {formatMetric(hybrid.metrics.mrr)}, so the correct chunk is not merely
              present, it sits nearer the top of the context the model reads first.
            </p>
          </article>

          <article className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold tracking-tight text-fg">
              Reranking did not help here
            </h3>
            <p className="mt-2.5 text-sm leading-7 text-fg-muted">
              The cross-encoder scored {formatMetric(reranked.metrics.mrr)} MRR, below
              plain fusion at {formatMetric(hybrid.metrics.mrr)}, while adding seconds of
              CPU inference per query. On a small technical corpus, fusion has already
              done the work.
            </p>
          </article>
        </div>
      ) : null}

      <p className="mt-6 max-w-3xl text-sm leading-7 text-fg-muted">
        The full writeup, including the exact-term and paraphrase breakdowns and the
        reasoning behind each choice, lives in the repository at{" "}
        <a
          href={`${SITE.repoUrl}/blob/main/backend/eval/results.md`}
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-xs text-accent underline underline-offset-4"
        >
          backend/eval/results.md
        </a>
        .
      </p>
    </Section>
  );
}
