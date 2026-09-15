"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { isRefusal, parseAnswer, type AnswerBlock, type AnswerInline } from "@/lib/answer";
import { sourceDomId } from "@/lib/sources";
import type { AnswerSource } from "@/lib/types";

import { StateMessage } from "./StateMessage";

interface AnswerPanelProps {
  answer: string;
  sources: AnswerSource[];
  model: string;
  activeIndex: number | null;
  onCitationActivate: (index: number) => void;
}

interface CitationMarkerProps {
  index: number;
  resolved: boolean;
  isActive: boolean;
  onActivate: (index: number) => void;
}

function CitationMarker({ index, resolved, isActive, onActivate }: CitationMarkerProps) {
  if (!resolved) {
    // The model cited a chunk number that is not in the context window it was
    // given. Show it as text, flagged, rather than as a link to nothing.
    return (
      <sup
        className="mx-0.5 rounded-sm border border-danger/50 px-1 font-mono text-[0.65em] text-danger"
        title={`Citation ${index} has no matching source chunk`}
      >
        {index}
        <span className="sr-only"> (unmatched citation)</span>
      </sup>
    );
  }

  return (
    <sup className="mx-0.5 inline-block align-super leading-none">
      <button
        type="button"
        onClick={() => onActivate(index)}
        aria-controls={sourceDomId(index)}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "rounded-sm border px-1 font-mono text-[0.7rem] leading-normal transition-colors",
          isActive
            ? "border-citation bg-citation text-bg"
            : "border-citation/50 text-citation hover:border-citation hover:bg-citation/15",
        )}
      >
        {index}
        <span className="sr-only">
          {isActive ? ` (source ${index}, currently shown)` : ` (show source ${index})`}
        </span>
      </button>
    </sup>
  );
}

function renderInline(
  tokens: AnswerInline[],
  activeIndex: number | null,
  onCitationActivate: (index: number) => void,
) {
  return tokens.map((token, position) => {
    const key = `${token.kind}-${position}`;
    switch (token.kind) {
      case "strong":
        return (
          <strong key={key} className="font-semibold text-fg">
            {token.value}
          </strong>
        );
      case "emphasis":
        return (
          <em key={key} className="italic">
            {token.value}
          </em>
        );
      case "code":
        return (
          <code
            key={key}
            className="rounded-sm border border-border bg-surface-sunken px-1 py-0.5 font-mono text-[0.85em] text-fg"
          >
            {token.value}
          </code>
        );
      case "citation":
        return (
          <CitationMarker
            key={key}
            index={token.index}
            resolved={token.resolved}
            isActive={activeIndex === token.index}
            onActivate={onCitationActivate}
          />
        );
      default:
        return <span key={key}>{token.value}</span>;
    }
  });
}

function renderBlock(
  block: AnswerBlock,
  position: number,
  activeIndex: number | null,
  onCitationActivate: (index: number) => void,
) {
  const key = `${block.kind}-${position}`;
  const inline = (tokens: AnswerInline[]) =>
    renderInline(tokens, activeIndex, onCitationActivate);

  if (block.kind === "heading") {
    return (
      <h3 key={key} className="mt-6 text-base font-semibold tracking-tight text-fg first:mt-0">
        {inline(block.content)}
      </h3>
    );
  }

  if (block.kind === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag
        key={key}
        className={cn(
          "mt-4 space-y-2 pl-5 first:mt-0",
          block.ordered ? "list-decimal" : "list-disc",
          "marker:text-fg-faint",
        )}
      >
        {block.items.map((item, itemPosition) => (
          <li key={itemPosition} className="pl-1">
            {inline(item)}
          </li>
        ))}
      </ListTag>
    );
  }

  return (
    <p key={key} className="mt-4 first:mt-0">
      {inline(block.content)}
    </p>
  );
}

export function AnswerPanel({
  answer,
  sources,
  model,
  activeIndex,
  onCitationActivate,
}: AnswerPanelProps) {
  const parsed = useMemo(
    () => parseAnswer(answer, sources.map((source) => source.index)),
    [answer, sources],
  );

  if (isRefusal(answer)) {
    return (
      <StateMessage
        tone="neutral"
        title="No grounded answer for this question"
        description="The retrieved chunks did not contain enough information to answer, so the model declined rather than guessing. The chunks it considered are listed as evidence. Try wording the question with terms that appear in the corpus."
      />
    );
  }

  return (
    <section
      aria-labelledby="answer-heading"
      className="rounded-card border border-border bg-surface"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3 sm:px-6">
        <h2 id="answer-heading" className="text-sm font-semibold tracking-tight text-fg">
          Answer
        </h2>
        <p className="font-mono text-xs text-fg-faint">
          <span className="sr-only">Generated by model </span>
          {model || "model not reported"}
        </p>
      </header>

      <div className="px-5 py-5 text-[0.95rem] leading-7 text-fg-muted sm:px-6">
        {parsed.blocks.map((block, position) =>
          renderBlock(block, position, activeIndex, onCitationActivate),
        )}
      </div>

      <footer className="border-t border-border px-5 py-3 text-xs text-fg-faint sm:px-6">
        {parsed.unresolvedIndices.length > 0 ? (
          <p role="alert" className="text-danger">
            {parsed.unresolvedIndices.length === 1
              ? `Citation ${parsed.unresolvedIndices[0]} does not match any chunk in the context window, so it is shown unlinked.`
              : `Citations ${parsed.unresolvedIndices.join(", ")} do not match any chunk in the context window, so they are shown unlinked.`}
          </p>
        ) : parsed.citedIndices.length === 0 ? (
          <p>
            The model returned an answer without citation markers. Every chunk it was
            given is listed as evidence, but nothing in the text points at a specific one.
          </p>
        ) : (
          <p>
            {parsed.citedIndices.length} of {sources.length} retrieved chunks cited. Select
            a marker to open the matching chunk.
          </p>
        )}
      </footer>
    </section>
  );
}
