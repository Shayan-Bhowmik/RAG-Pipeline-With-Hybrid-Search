"use client";

import { animate } from "animejs";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/motion";

interface PipelineStage {
  id: string;
  label: string;
  detail: string;
}

/** The five stages backend/app/generation/generator.py runs, in order. */
const STAGES: PipelineStage[] = [
  { id: "dense", label: "Dense retrieval", detail: "pgvector cosine similarity" },
  { id: "sparse", label: "Sparse retrieval", detail: "BM25 over the same chunks" },
  { id: "fusion", label: "Reciprocal rank fusion", detail: "1 / (k + rank), k = 60" },
  { id: "rerank", label: "Cross-encoder rerank", detail: "bge-reranker-base, top k" },
  { id: "generate", label: "Grounded generation", detail: "answer with chunk citations" },
];

/**
 * Advance cadence for the highlight. These are display pacing values, not
 * measurements: the backend returns one response at the end of the pipeline
 * and reports no per-stage progress, so nothing here is presented as a timing.
 */
const ADVANCE_MS = 1100;

interface PipelineIndicatorProps {
  /** Milliseconds since the request left the browser. Genuinely measured. */
  elapsedMs: number;
}

export function PipelineIndicator({ elapsedMs }: PipelineIndicatorProps) {
  const [activeStage, setActiveStage] = useState(0);
  const reducedMotion = useReducedMotion();
  const trackRefs = useRef<Array<HTMLSpanElement | null>>([]);

  // Hold on the final stage, which is where the real wait happens.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const track = trackRefs.current[activeStage];
    if (!track) return;

    if (reducedMotion) {
      track.style.transform = "scaleX(1)";
      return;
    }

    const animation = animate(track, {
      scaleX: [0, 1],
      opacity: [0.35, 1],
      duration: ADVANCE_MS,
      ease: "outQuad",
    });

    return () => {
      animation.pause();
    };
  }, [activeStage, reducedMotion]);

  return (
    <section
      aria-label="Query in progress"
      className="rounded-card border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-fg">
          Running the retrieval pipeline
        </h2>
        <p className="font-mono text-xs text-fg-muted">
          elapsed {(elapsedMs / 1000).toFixed(1)}s
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {STAGES.map((stage, index) => {
          const isActive = index === activeStage;
          const isDone = index < activeStage;

          return (
            <li key={stage.id} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                  isActive && "bg-accent",
                  isDone && "bg-fg-faint",
                  !isActive && !isDone && "bg-border-strong",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={cn(
                      "text-sm",
                      isActive ? "text-fg" : isDone ? "text-fg-muted" : "text-fg-faint",
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="font-mono text-xs text-fg-faint">{stage.detail}</span>
                </div>
                <span className="mt-2 block h-px w-full overflow-hidden bg-border">
                  <span
                    ref={(element) => {
                      trackRefs.current[index] = element;
                    }}
                    className={cn(
                      "block h-px w-full origin-left",
                      isActive ? "bg-accent" : isDone ? "bg-border-strong" : "bg-transparent",
                    )}
                    style={{ transform: isDone ? "scaleX(1)" : undefined }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 border-t border-border pt-4 text-xs text-fg-faint">
        Visual indicator only. The backend returns a single response when the whole
        pipeline finishes and does not report per-stage progress, so the highlight
        above shows the stages a query passes through, not measured timings.
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {`Stage ${activeStage + 1} of ${STAGES.length}: ${STAGES[activeStage].label}`}
      </p>
    </section>
  );
}
