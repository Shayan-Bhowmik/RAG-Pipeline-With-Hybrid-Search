import { cn } from "@/lib/cn";

interface PipelineDiagramProps {
  className?: string;
  /** Rendered as the accessible description of the diagram. */
  title?: string;
}

const LANE_DENSE = 96;
const LANE_SPARSE = 244;
const SPINE = 170;

function Node({
  x,
  y,
  width,
  label,
  detail,
  tone = "default",
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  detail?: string;
  tone?: "default" | "dense" | "sparse" | "accent";
}) {
  const stroke =
    tone === "dense"
      ? "var(--color-dense)"
      : tone === "sparse"
        ? "var(--color-sparse)"
        : tone === "accent"
          ? "var(--color-accent)"
          : "var(--color-border-strong)";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={detail ? 44 : 32}
        rx="4"
        fill="var(--color-surface)"
        stroke={stroke}
        strokeWidth="1"
      />
      <text
        x={x + width / 2}
        y={detail ? y + 19 : y + 20}
        textAnchor="middle"
        fill="var(--color-fg)"
        fontSize="11"
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>
      {detail ? (
        <text
          x={x + width / 2}
          y={y + 33}
          textAnchor="middle"
          fill="var(--color-fg-faint)"
          fontSize="9"
          fontFamily="var(--font-mono)"
        >
          {detail}
        </text>
      ) : null}
    </g>
  );
}

function Edge({ d, tone = "default" }: { d: string; tone?: "default" | "dense" | "sparse" | "citation" }) {
  const stroke =
    tone === "dense"
      ? "var(--color-dense)"
      : tone === "sparse"
        ? "var(--color-sparse)"
        : tone === "citation"
          ? "var(--color-citation)"
          : "var(--color-border-strong)";

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="1"
      strokeDasharray={tone === "citation" ? "3 3" : undefined}
      opacity={tone === "default" ? 0.8 : 0.65}
    />
  );
}

/**
 * The real HybridRAG pipeline, drawn once and reused as the architecture
 * figure and as the static fallback for the animated hero.
 */
export function PipelineDiagram({ className, title }: PipelineDiagramProps) {
  return (
    <svg
      viewBox="0 0 880 320"
      role="img"
      aria-label={
        title ??
        "Documents are chunked and embedded, then a query runs through dense vector search and sparse BM25 search in parallel. Both ranked lists are fused by reciprocal rank fusion, reranked by a cross-encoder, and the top chunks are passed to the language model, which returns an answer whose citations map back to those chunks."
      }
      className={cn("w-full", className)}
    >
      <Node x={8} y={154} width={92} label="Documents" detail="pdf, md, txt" />
      <Node x={128} y={154} width={92} label="Chunks" detail="sentence window" />

      <Edge d={`M100 ${SPINE} H128`} />
      <Edge d={`M220 ${SPINE} C 252 ${SPINE}, 252 ${LANE_DENSE + 16}, 284 ${LANE_DENSE + 16}`} tone="dense" />
      <Edge d={`M220 ${SPINE} C 252 ${SPINE}, 252 ${LANE_SPARSE + 16}, 284 ${LANE_SPARSE + 16}`} tone="sparse" />

      <Node
        x={284}
        y={LANE_DENSE}
        width={140}
        label="Dense retrieval"
        detail="pgvector cosine"
        tone="dense"
      />
      <Node
        x={284}
        y={LANE_SPARSE}
        width={140}
        label="Sparse retrieval"
        detail="BM25"
        tone="sparse"
      />

      <Edge d={`M424 ${LANE_DENSE + 16} C 460 ${LANE_DENSE + 16}, 460 ${SPINE}, 496 ${SPINE}`} tone="dense" />
      <Edge d={`M424 ${LANE_SPARSE + 16} C 460 ${LANE_SPARSE + 16}, 460 ${SPINE}, 496 ${SPINE}`} tone="sparse" />

      <Node x={496} y={154} width={104} label="RRF fusion" detail="1 / (k + rank)" />
      <Edge d="M600 170 H628" />

      <Node x={628} y={154} width={104} label="Rerank" detail="cross-encoder" />
      <Edge d="M732 170 H760" />

      <Node x={760} y={154} width={112} label="Answer" detail="with citations" tone="accent" />

      {/* Citations resolve back to the chunk each claim came from. */}
      <Edge d="M816 198 C 816 280, 300 300, 174 264 C 174 240, 174 220, 174 198" tone="citation" />
      <text
        x={480}
        y={300}
        textAnchor="middle"
        fill="var(--color-citation)"
        fontSize="9"
        fontFamily="var(--font-mono)"
        opacity="0.9"
      >
        citations map back to source chunks
      </text>
    </svg>
  );
}
