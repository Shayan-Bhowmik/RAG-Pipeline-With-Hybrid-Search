"use client";

import dynamic from "next/dynamic";

import { useMediaQuery, useReducedMotion } from "@/lib/motion";

import { PipelineDiagram } from "./PipelineDiagram";

// Three.js is a heavy dependency and is never needed on the server, so it is
// split into its own chunk and fetched only when the animated view is used.
const PipelineCanvas = dynamic(
  () => import("./PipelineCanvas").then((module) => module.PipelineCanvas),
  { ssr: false },
);

/**
 * Chooses between the animated pipeline and the static diagram. Narrow
 * viewports and reduced-motion visitors get the diagram, which carries exactly
 * the same information and costs nothing to render.
 */
export function HeroVisual() {
  const isWideViewport = useMediaQuery("(min-width: 768px)");
  const reducedMotion = useReducedMotion();
  const showCanvas = isWideViewport && !reducedMotion;

  return (
    <div className="relative">
      <div className="rounded-card border border-border bg-surface-sunken">
        {showCanvas ? (
          <div className="h-[300px] w-full lg:h-[380px]">
            <PipelineCanvas />
          </div>
        ) : (
          <div className="px-4 py-6">
            <PipelineDiagram />
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-xs text-fg-faint">
        {showCanvas
          ? "Documents to chunks, dense and sparse retrieval, fusion, rerank, generation, citations back to source."
          : "Static view of the same pipeline."}
      </p>
    </div>
  );
}
