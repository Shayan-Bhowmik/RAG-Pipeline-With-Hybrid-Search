"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import { documentLabel, formatScore, shortId, sourceDomId } from "@/lib/sources";
import type { AnswerSource } from "@/lib/types";

interface SourcePanelProps {
  sources: AnswerSource[];
  activeIndex: number | null;
  onSelect: (index: number | null) => void;
  documentTitles: Map<string, string>;
}

interface SourceCardProps {
  source: AnswerSource;
  isActive: boolean;
  documentTitles: Map<string, string>;
  registerRef: (index: number, element: HTMLElement | null) => void;
}

/** Roughly six lines of chunk text before the card offers to expand. */
const PREVIEW_CHARS = 320;

function SourceCard({ source, isActive, documentTitles, registerRef }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isTruncatable = source.text.length > PREVIEW_CHARS;

  // Selecting a citation should reveal the whole chunk it points at. Adjusted
  // during render so the card never paints collapsed for a frame first.
  const [wasActive, setWasActive] = useState(isActive);
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (isActive) setIsExpanded(true);
  }

  const shown =
    isTruncatable && !isExpanded ? `${source.text.slice(0, PREVIEW_CHARS).trimEnd()}` : source.text;

  return (
    <article
      id={sourceDomId(source.index)}
      ref={(element) => registerRef(source.index, element)}
      aria-current={isActive ? "true" : undefined}
      aria-label={`Source ${source.index}, from ${documentLabel(source.docId, documentTitles)}`}
      className={cn(
        "rounded-card border-l-2 border-y border-r bg-surface transition-colors",
        isActive
          ? "border-y-citation/40 border-r-citation/40 border-l-citation bg-surface-raised"
          : "border-y-border border-r-border border-l-transparent hover:border-y-border-strong hover:border-r-border-strong",
      )}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border px-1 font-mono text-xs",
              isActive
                ? "border-citation bg-citation text-bg"
                : "border-border-strong text-fg-muted",
            )}
          >
            {source.index}
          </span>

          <span className="min-w-0 flex-1 truncate text-sm text-fg">
            {documentLabel(source.docId, documentTitles)}
          </span>

          {source.isCited ? (
            <span className="rounded-sm border border-citation/40 px-1.5 py-0.5 font-mono text-[0.68rem] text-citation">
              cited
            </span>
          ) : (
            <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.68rem] text-fg-faint">
              not cited
            </span>
          )}

          {isActive ? (
            <span className="font-mono text-[0.68rem] text-citation">selected</span>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-6 text-fg-muted">
          {shown}
          {(isTruncatable && !isExpanded) || !source.isFullText ? (
            <span className="text-fg-faint"> ...</span>
          ) : null}
        </p>

        {isTruncatable ? (
          <button
            type="button"
            onClick={() => setIsExpanded((open) => !open)}
            aria-expanded={isExpanded}
            className="mt-2 font-mono text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            {isExpanded ? "Show less" : "Show full chunk"}
          </button>
        ) : null}

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 font-mono text-[0.7rem] text-fg-faint">
          <div className="flex gap-1.5">
            <dt>chunk</dt>
            <dd className="text-fg-muted" title={source.chunkId}>
              {shortId(source.chunkId)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>rerank</dt>
            <dd className="text-fg-muted">{formatScore(source.rerankerScore)}</dd>
          </div>
          {source.pageOrSection ? (
            <div className="flex gap-1.5">
              <dt>section</dt>
              <dd className="text-fg-muted">{source.pageOrSection}</dd>
            </div>
          ) : null}
          {!source.isFullText ? (
            <div className="flex gap-1.5">
              <dt>text</dt>
              <dd className="text-fg-muted">preview, 200 chars</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}

export function SourcePanel({
  sources,
  activeIndex,
  onSelect,
  documentTitles,
}: SourcePanelProps) {
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Bring the cited chunk into view when a citation marker is activated.
  useEffect(() => {
    if (activeIndex === null) return;
    const card = cardRefs.current.get(activeIndex);
    if (!card) return;
    card.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [activeIndex]);

  const citedCount = sources.filter((source) => source.isCited).length;

  return (
    <section aria-labelledby="sources-heading" className="min-w-0">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3">
        <h2 id="sources-heading" className="text-sm font-semibold tracking-tight text-fg">
          Evidence
        </h2>
        <p className="font-mono text-xs text-fg-faint">
          {citedCount} cited / {sources.length} retrieved
        </p>
      </header>

      <p className="pb-4 text-xs text-fg-faint">
        Every chunk the generator was given, in reranked order. The number on each card is
        the citation marker that refers to it.
      </p>

      <ol className="space-y-3">
        {sources.map((source) => (
          <li key={source.chunkId}>
            <SourceCard
              source={source}
              isActive={activeIndex === source.index}
              documentTitles={documentTitles}
              registerRef={(index, element) => {
                if (element) cardRefs.current.set(index, element);
                else cardRefs.current.delete(index);
              }}
            />
          </li>
        ))}
      </ol>

      {activeIndex !== null ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-4 font-mono text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
        >
          Clear selection
        </button>
      ) : null}
    </section>
  );
}
