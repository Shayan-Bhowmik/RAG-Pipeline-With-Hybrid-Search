"use client";

import { animate } from "animejs";
import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/site/Section";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

interface Stage {
  id: string;
  label: string;
  source: string;
  summary: string;
  detail: string[];
}

/** Each stage describes what the code in that module actually does. */
const STAGES: Stage[] = [
  {
    id: "ingestion",
    label: "Ingestion",
    source: "app/ingestion/pipeline.py",
    summary: "Read a folder of documents and record one row per file.",
    detail: [
      "POST /ingest walks a directory, extracts raw text from PDF, markdown and plain text files, and inserts a document row holding the title and source path.",
      "A file that fails to parse is logged and skipped so one bad document cannot abort the batch.",
    ],
  },
  {
    id: "chunking",
    label: "Chunking",
    source: "app/ingestion/chunker.py",
    summary: "Sentence-window chunks, not fixed-character slices.",
    detail: [
      "Text is split on sentence boundaries, then grouped into overlapping windows of eight sentences with three sentences of overlap.",
      "Overlap means a fact that straddles a boundary still appears whole in at least one chunk, which fixed-width splitting cannot guarantee.",
    ],
  },
  {
    id: "embedding",
    label: "Embedding",
    source: "app/ingestion/embedder.py",
    summary: "Local embeddings, stored in Postgres.",
    detail: [
      "Every chunk is embedded locally with BAAI/bge-base-en-v1.5 and written to a 768 dimension pgvector column.",
      "Running the model locally means indexing and querying cost no per-token embedding fees, and the corpus never leaves the database.",
    ],
  },
  {
    id: "dense",
    label: "Dense retrieval",
    source: "app/retrieval/dense.py",
    summary: "Cosine similarity over chunk embeddings.",
    detail: [
      "The incoming query is embedded with the same model and matched against chunk vectors through a Postgres function, backed by an HNSW index on cosine distance.",
      "This is what makes paraphrased questions work: the query and the chunk need to mean the same thing, not share words.",
    ],
  },
  {
    id: "sparse",
    label: "Sparse retrieval",
    source: "app/retrieval/sparse.py",
    summary: "BM25 over the same chunk set.",
    detail: [
      "The chunk texts are tokenised into a lowercase, punctuation-stripped stream and scored with BM25.",
      "Rare exact tokens such as model names, column names and acronyms score highly here. Dense embeddings tend to smear those into their neighbourhood and lose them.",
    ],
  },
  {
    id: "fusion",
    label: "Reciprocal rank fusion",
    source: "app/retrieval/fusion.py",
    summary: "Combine both rankings without normalising scores.",
    detail: [
      "Each chunk scores the sum of 1 / (k + rank) across both ranked lists, with k = 60.",
      "Fusion works on positions rather than scores, which matters because cosine similarity is bounded between zero and one while BM25 is unbounded and shifts with query length. Rank-based fusion sidesteps that entirely.",
    ],
  },
  {
    id: "rerank",
    label: "Cross-encoder rerank",
    source: "app/retrieval/reranker.py",
    summary: "Re-score the fused candidates jointly.",
    detail: [
      "The fused shortlist is re-scored by BAAI/bge-reranker-base, which reads the query and the chunk together in one pass instead of comparing two independently computed vectors.",
      "The top k survive and become the context window. On this corpus reranking did not beat plain fusion, which the evaluation section covers with numbers.",
    ],
  },
  {
    id: "generation",
    label: "Grounded generation",
    source: "app/generation/prompt.py",
    summary: "Answer from the retrieved context alone.",
    detail: [
      "Surviving chunks are numbered and injected into a prompt that instructs the model to answer only from them and to cite chunk numbers in square brackets.",
      "A question the corpus does not cover produces an explicit statement that there is not enough information, rather than a plausible guess.",
    ],
  },
  {
    id: "citations",
    label: "Citation mapping",
    source: "app/generation/citations.py",
    summary: "Resolve every marker back to real text.",
    detail: [
      "Markers are parsed out of the answer and mapped to the chunk at that position in the context window, along with its id and reranker score.",
      "The response carries both the answer and the chunks behind it, so the interface can make every claim traceable instead of asking you to trust it.",
    ],
  },
];

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) return;

    const animation = animate(panel, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 320,
      ease: "out(2)",
    });

    return () => {
      animation.pause();
    };
  }, [activeIndex]);

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const lastIndex = STAGES.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = activeIndex === lastIndex ? 0 : activeIndex + 1;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = activeIndex === 0 ? lastIndex : activeIndex - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = lastIndex;

    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  }

  const active = STAGES[activeIndex];

  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Nine stages, from a folder of documents to a cited answer"
      lead="Each step below maps to a module in the backend. Select one to read what it does and why it is there."
      tone="sunken"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-10">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Pipeline stages"
          className="flex min-w-0 gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 scrollbar-thin"
        >
          {STAGES.map((stage, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={stage.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                role="tab"
                type="button"
                id={`stage-tab-${stage.id}`}
                aria-selected={isActive}
                aria-controls={`stage-panel-${stage.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "shrink-0 rounded-card border px-3 py-2.5 text-left text-sm transition-colors lg:w-full",
                  isActive
                    ? "border-accent/50 bg-accent/10 text-fg"
                    : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isActive ? "text-accent" : "text-fg-faint",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{stage.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={panelRef}
          role="tabpanel"
          id={`stage-panel-${active.id}`}
          aria-labelledby={`stage-tab-${active.id}`}
          tabIndex={0}
          className="min-w-0 rounded-card border border-border bg-surface p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-fg">{active.label}</h3>
            <code className="font-mono text-xs text-fg-faint">{active.source}</code>
          </div>

          <p className="mt-2 text-sm text-accent">{active.summary}</p>

          <div className="mt-5 space-y-3 border-t border-border pt-5">
            {active.detail.map((paragraph) => (
              <p key={paragraph} className="text-[0.95rem] leading-7 text-fg-muted">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="mt-6 font-mono text-xs text-fg-faint">
            Stage {activeIndex + 1} of {STAGES.length}
          </p>
        </div>
      </div>
    </Section>
  );
}
