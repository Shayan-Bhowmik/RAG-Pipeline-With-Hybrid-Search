import { cn } from "@/lib/cn";

interface PipelineDiagramProps {
  className?: string;
  /** Rendered as the accessible description of the diagram. */
  title?: string;
}

/*
  Two bands, because the system has two distinct phases that the old single
  chain conflated: indexing runs once per document, retrieval runs per query.
  The dashed link between them is the one thing they share, the chunk index.

  Every sub-label is a real value from the backend: window and overlap from
  chunker.py, model names from config.py, k from fusion.py.
*/
const INGEST_Y = 56;
const QUERY_Y = 268;
const DENSE_Y = 196;
const SPARSE_Y = 340;
const NODE_H = 46;
const JUNCTION_X = 150;

type Tone = "default" | "muted" | "dense" | "sparse" | "answer";

const STROKE: Record<Tone, string> = {
  default: "var(--color-border-strong)",
  muted: "var(--color-border)",
  dense: "var(--color-dense)",
  sparse: "var(--color-sparse)",
  answer: "var(--color-citation)",
};

function Node({
  x,
  width,
  centerY,
  label,
  detail,
  tone = "default",
}: {
  x: number;
  width: number;
  centerY: number;
  label: string;
  detail: string;
  tone?: Tone;
}) {
  const y = centerY - NODE_H / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={NODE_H}
        rx="5"
        fill="var(--color-surface)"
        stroke={STROKE[tone]}
        strokeWidth="1"
      />
      <text
        x={x + width / 2}
        y={y + 19}
        textAnchor="middle"
        fill={tone === "muted" ? "var(--color-fg-muted)" : "var(--color-fg)"}
        fontSize="11.5"
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>
      <text
        x={x + width / 2}
        y={y + 34}
        textAnchor="middle"
        fill="var(--color-fg-faint)"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        {detail}
      </text>
    </g>
  );
}

function Edge({
  d,
  tone = "default",
  dashed = false,
}: {
  d: string;
  tone?: Tone | "citation";
  dashed?: boolean;
}) {
  const stroke = tone === "citation" ? "var(--color-citation)" : STROKE[tone as Tone];

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="1.25"
      strokeDasharray={dashed ? "4 4" : undefined}
      markerEnd={`url(#arrow-${tone})`}
      opacity={tone === "muted" ? 0.75 : 0.85}
    />
  );
}

function LaneLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-fg-faint)"
      fontSize="8.5"
      letterSpacing="1.2"
      fontFamily="var(--font-mono)"
    >
      {children}
    </text>
  );
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 8 8"
      refX="6.5"
      refY="4"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0 1.5 L6.5 4 L0 6.5 z" fill={color} />
    </marker>
  );
}

/**
 * The real HybridRAG pipeline, drawn once and reused as the architecture
 * figure and as the static fallback for the animated hero.
 */
export function PipelineDiagram({ className, title }: PipelineDiagramProps) {
  return (
    <svg
      viewBox="0 0 980 396"
      role="img"
      aria-label={
        title ??
        "Two phases. Ingest, run once per document: documents are split into overlapping eight sentence windows, embedded with bge-base-en-v1.5 into 768 dimensions, and stored in Postgres with an HNSW vector index and a BM25 keyword index. Query, run per request: a natural language question is searched against that same index by dense vector similarity and by BM25 keyword match in parallel. The two ranked lists are fused by reciprocal rank fusion with k of 60, reranked by the bge-reranker-base cross encoder, and the surviving top chunks are passed to the language model, which returns a grounded answer whose citation markers resolve back to those reranked chunks."
      }
      className={cn("w-full", className)}
    >
      <defs>
        <ArrowMarker id="arrow-default" color="var(--color-border-strong)" />
        <ArrowMarker id="arrow-muted" color="var(--color-border)" />
        <ArrowMarker id="arrow-dense" color="var(--color-dense)" />
        <ArrowMarker id="arrow-sparse" color="var(--color-sparse)" />
        <ArrowMarker id="arrow-answer" color="var(--color-citation)" />
        <ArrowMarker id="arrow-citation" color="var(--color-citation)" />
      </defs>

      {/* Phase one: building the index. */}
      <LaneLabel x={14} y={20}>
        INGEST, ONCE PER DOCUMENT
      </LaneLabel>

      <Node x={14} width={116} centerY={INGEST_Y} label="Documents" detail="pdf, md, txt" tone="muted" />
      <Edge d={`M130 ${INGEST_Y} H162`} tone="muted" />
      <Node x={166} width={180} centerY={INGEST_Y} label="Chunk" detail="8 sentences, 3 overlap" tone="muted" />
      <Edge d={`M346 ${INGEST_Y} H378`} tone="muted" />
      <Node x={382} width={164} centerY={INGEST_Y} label="Embed" detail="bge-base-en-v1.5, 768d" tone="muted" />
      <Edge d={`M546 ${INGEST_Y} H578`} tone="muted" />
      <Node x={582} width={186} centerY={INGEST_Y} label="Index" detail="pgvector HNSW + BM25" tone="muted" />

      {/* The two phases meet at the index, and nowhere else. */}
      <path
        d={`M14 142 H966`}
        stroke="var(--color-border)"
        strokeWidth="1"
        strokeDasharray="2 6"
        opacity="0.5"
      />

      <Edge
        d={`M675 79 C 675 106, 666 124, 610 124 H 200 C 168 124, ${JUNCTION_X} 146, ${JUNCTION_X} 258`}
        tone="muted"
        dashed
      />

      {/* Phase two: answering a question against that index. */}
      <LaneLabel x={14} y={162}>
        QUERY, PER REQUEST
      </LaneLabel>

      <Node x={14} width={120} centerY={QUERY_Y} label="Question" detail="natural language" />
      <Edge d={`M134 ${QUERY_Y} H144`} />

      {/* Where the question meets the index: both retrieval routes start here. */}
      <circle cx={JUNCTION_X} cy={QUERY_Y} r="3.5" fill="var(--color-border-strong)" />

      <Edge d={`M${JUNCTION_X} 262 C ${JUNCTION_X} 222, ${JUNCTION_X} ${DENSE_Y}, 164 ${DENSE_Y}`} tone="dense" />
      <Edge d={`M${JUNCTION_X} 274 C ${JUNCTION_X} 314, ${JUNCTION_X} ${SPARSE_Y}, 164 ${SPARSE_Y}`} tone="sparse" />

      <Node
        x={170}
        width={168}
        centerY={DENSE_Y}
        label="Dense retrieval"
        detail="cosine similarity"
        tone="dense"
      />
      <Node
        x={170}
        width={168}
        centerY={SPARSE_Y}
        label="Sparse retrieval"
        detail="BM25 keyword match"
        tone="sparse"
      />

      <Edge d={`M338 ${DENSE_Y} C 358 ${DENSE_Y}, 352 ${QUERY_Y}, 370 ${QUERY_Y}`} tone="dense" />
      <Edge d={`M338 ${SPARSE_Y} C 358 ${SPARSE_Y}, 352 ${QUERY_Y}, 370 ${QUERY_Y}`} tone="sparse" />

      <Node x={374} width={156} centerY={QUERY_Y} label="RRF fusion" detail="1 / (k + rank), k = 60" />
      <Edge d={`M530 ${QUERY_Y} H562`} />

      <Node x={566} width={172} centerY={QUERY_Y} label="Rerank" detail="bge-reranker-base, top k" />
      <Edge d={`M738 ${QUERY_Y} H770`} />

      <Node
        x={774}
        width={192}
        centerY={QUERY_Y}
        label="Answer"
        detail="grounded generation"
        tone="answer"
      />

      {/*
        Citation markers resolve to the chunks the model was actually given,
        which is the rerank output. Routed below the sparse lane so it crosses
        nothing.
      */}
      <Edge
        d={`M870 291 C 870 336, 860 358, 802 358 H 690 C 652 358, 652 330, 652 293`}
        tone="citation"
        dashed
      />
      <text
        x={746}
        y={378}
        textAnchor="middle"
        fill="var(--color-citation)"
        fontSize="9"
        fontFamily="var(--font-mono)"
        opacity="0.85"
      >
        every [n] resolves to one of these chunks
      </text>
    </svg>
  );
}
