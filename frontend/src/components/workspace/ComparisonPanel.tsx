"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { postRetrieve, toApiError, type ApiError } from "@/lib/api";
import { buttonPrimary, cn } from "@/lib/cn";
import { documentLabel, formatScore, shortId } from "@/lib/sources";
import type { RetrievalMethod, RetrievedChunk } from "@/lib/types";

import { StateMessage } from "./StateMessage";

/**
 * Only modes the backend exposes as separately callable routes appear here.
 * All four exist in backend/app/routes/retrieve.py.
 */
const MODES: Record<
  RetrievalMethod,
  { label: string; endpoint: string; scoreLabel: string; description: string }
> = {
  dense: {
    label: "Dense",
    endpoint: "POST /retrieve/dense",
    scoreLabel: "cosine",
    description: "Embedding similarity over pgvector. Strong on paraphrase, weak on exact terms.",
  },
  sparse: {
    label: "Sparse",
    endpoint: "POST /retrieve/sparse",
    scoreLabel: "bm25",
    description: "BM25 keyword match. Strong on identifiers and acronyms, weak on paraphrase.",
  },
  hybrid: {
    label: "Hybrid",
    endpoint: "POST /retrieve/hybrid",
    scoreLabel: "rrf",
    description: "Dense and sparse lists fused by reciprocal rank fusion.",
  },
  reranked: {
    label: "Hybrid + rerank",
    endpoint: "POST /retrieve/reranked",
    scoreLabel: "cross-encoder",
    description: "Fused list rescored by a cross-encoder, then cut to top k.",
  },
};

const MODE_ORDER: RetrievalMethod[] = ["dense", "sparse", "hybrid", "reranked"];
const TOP_N = 10;

interface ComparisonPanelProps {
  query: string;
  documentTitles: Map<string, string>;
}

interface ComparisonResult {
  query: string;
  left: { mode: RetrievalMethod; results: RetrievedChunk[] };
  right: { mode: RetrievalMethod; results: RetrievedChunk[] };
}

function scoreFor(chunk: RetrievedChunk, mode: RetrievalMethod): number | undefined {
  switch (mode) {
    case "hybrid":
      return chunk.rrf_score;
    case "reranked":
      return chunk.reranker_score ?? chunk.rrf_score;
    default:
      return chunk.score;
  }
}

interface ModeSelectProps {
  side: "left" | "right";
  value: RetrievalMethod;
  onChange: (mode: RetrievalMethod) => void;
  disabled: boolean;
}

function ModeSelect({ side, value, onChange, disabled }: ModeSelectProps) {
  return (
    <div
      role="radiogroup"
      aria-label={`${side === "left" ? "First" : "Second"} retrieval mode`}
      className="inline-flex flex-wrap gap-1 rounded-card border border-border bg-surface-sunken p-1"
    >
      {MODE_ORDER.map((mode) => {
        const isSelected = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              isSelected
                ? "bg-accent/15 text-accent ring-1 ring-accent/50"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {MODES[mode].label}
          </button>
        );
      })}
    </div>
  );
}

interface ResultColumnProps {
  mode: RetrievalMethod;
  results: RetrievedChunk[];
  otherIds: Set<string>;
  documentTitles: Map<string, string>;
}

function ResultColumn({ mode, results, otherIds, documentTitles }: ResultColumnProps) {
  const meta = MODES[mode];

  return (
    <section aria-label={`${meta.label} results`} className="min-w-0">
      <header className="border-b border-border pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold tracking-tight text-fg">{meta.label}</h3>
          <code className="font-mono text-[0.7rem] text-fg-faint">{meta.endpoint}</code>
        </div>
        <p className="mt-1.5 text-xs text-fg-faint">{meta.description}</p>
      </header>

      {results.length === 0 ? (
        <p className="py-6 text-sm text-fg-muted">
          This mode returned no chunks for the query.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {results.map((chunk, position) => {
            const inBoth = otherIds.has(chunk.chunk_id);
            const score = scoreFor(chunk, mode);

            return (
              <li
                key={chunk.chunk_id}
                className={cn(
                  "rounded-card border bg-surface p-3",
                  inBoth ? "border-both/40" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border-strong px-1 font-mono text-xs text-fg-muted">
                    {position + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">
                    {documentLabel(chunk.doc_id, documentTitles)}
                  </span>
                  <span
                    className={cn(
                      "rounded-sm border px-1.5 py-0.5 font-mono text-[0.68rem]",
                      inBoth
                        ? "border-both/40 text-both"
                        : "border-border text-fg-faint",
                    )}
                  >
                    {inBoth ? "in both" : "only here"}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-fg-muted">
                  {chunk.text}
                </p>

                <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.68rem] text-fg-faint">
                  <div className="flex gap-1.5">
                    <dt>chunk</dt>
                    <dd className="text-fg-muted" title={chunk.chunk_id}>
                      {shortId(chunk.chunk_id)}
                    </dd>
                  </div>
                  {score !== undefined ? (
                    <div className="flex gap-1.5">
                      <dt>{meta.scoreLabel}</dt>
                      <dd className="text-fg-muted">{formatScore(score)}</dd>
                    </div>
                  ) : null}
                  {(mode === "hybrid" || mode === "reranked") && chunk.dense_rank ? (
                    <div className="flex gap-1.5">
                      <dt>dense rank</dt>
                      <dd className="text-fg-muted">{chunk.dense_rank}</dd>
                    </div>
                  ) : null}
                  {(mode === "hybrid" || mode === "reranked") && chunk.sparse_rank ? (
                    <div className="flex gap-1.5">
                      <dt>sparse rank</dt>
                      <dd className="text-fg-muted">{chunk.sparse_rank}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function ComparisonPanel({ query, documentTitles }: ComparisonPanelProps) {
  const [leftMode, setLeftMode] = useState<RetrievalMethod>("dense");
  const [rightMode, setRightMode] = useState<RetrievalMethod>("hybrid");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // A comparison belongs to the query that produced it. Adjusting during
  // render rather than in an effect avoids a pass that shows a stale result.
  const [comparedQuery, setComparedQuery] = useState(query);
  if (comparedQuery !== query) {
    setComparedQuery(query);
    setResult(null);
    setError(null);
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setError(null);

    try {
      const [left, right] = await Promise.all([
        postRetrieve(leftMode, query, TOP_N, controller.signal),
        postRetrieve(rightMode, query, TOP_N, controller.signal),
      ]);
      setResult({
        query,
        left: { mode: leftMode, results: left.results },
        right: { mode: rightMode, results: right.results },
      });
    } catch (caught) {
      const apiError = toApiError(caught);
      if (apiError.detail === "cancelled") return;
      setError(apiError);
      setResult(null);
    } finally {
      if (abortRef.current === controller) setIsRunning(false);
    }
  }, [leftMode, rightMode, query]);

  const leftIds = new Set(result?.left.results.map((chunk) => chunk.chunk_id) ?? []);
  const rightIds = new Set(result?.right.results.map((chunk) => chunk.chunk_id) ?? []);
  const overlap = [...leftIds].filter((id) => rightIds.has(id)).length;
  const sameMode = leftMode === rightMode;

  return (
    <section
      aria-labelledby="comparison-heading"
      className="rounded-card border border-border bg-surface-sunken p-5 sm:p-6"
    >
      <header>
        <h2 id="comparison-heading" className="text-sm font-semibold tracking-tight text-fg">
          Retrieval comparison
        </h2>
        <p className="mt-1.5 max-w-2xl text-xs text-fg-faint">
          Runs the same question against two retrieval routes and lists what each one
          returns. Scores are shown exactly as the backend reports them, so they are
          comparable within a column but not across columns.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ModeSelect side="left" value={leftMode} onChange={setLeftMode} disabled={isRunning} />
          <span aria-hidden="true" className="font-mono text-xs text-fg-faint sm:px-1">
            vs
          </span>
          <ModeSelect
            side="right"
            value={rightMode}
            onChange={setRightMode}
            disabled={isRunning}
          />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={isRunning || sameMode}
          className={cn(buttonPrimary, "shrink-0")}
        >
          {isRunning ? "Running comparison" : "Run comparison"}
        </button>
      </div>

      {sameMode ? (
        <p className="mt-3 text-xs text-fg-muted">
          Pick two different modes to compare.
        </p>
      ) : null}

      <div aria-live="polite" className="mt-5">
        {error ? (
          <StateMessage
            tone="error"
            title={error.copy.title}
            description={error.copy.description}
            actionLabel={error.copy.action}
            onAction={run}
          />
        ) : isRunning ? (
          <p className="py-6 font-mono text-xs text-fg-muted">
            Querying {MODES[leftMode].endpoint} and {MODES[rightMode].endpoint}
          </p>
        ) : result ? (
          <>
            <p className="pb-4 text-xs text-fg-muted">
              {overlap === 0
                ? `No overlap: the two modes returned entirely different chunks for this query.`
                : `${overlap} chunk${overlap === 1 ? "" : "s"} appear in both lists. Chunks marked "only here" were surfaced by one mode and missed by the other.`}
            </p>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <ResultColumn
                mode={result.left.mode}
                results={result.left.results}
                otherIds={rightIds}
                documentTitles={documentTitles}
              />
              <ResultColumn
                mode={result.right.mode}
                results={result.right.results}
                otherIds={leftIds}
                documentTitles={documentTitles}
              />
            </div>
          </>
        ) : (
          <p className="py-2 text-sm text-fg-muted">
            Run the comparison to see which chunks each retrieval mode surfaces for this
            question.
          </p>
        )}
      </div>
    </section>
  );
}
