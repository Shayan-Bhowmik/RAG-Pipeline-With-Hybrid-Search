import { PipelineDiagram } from "@/components/site/PipelineDiagram";
import { Section } from "@/components/site/Section";

const STACK: Array<{ layer: string; choice: string; note: string }> = [
  {
    layer: "Frontend",
    choice: "Next.js, TypeScript, Tailwind CSS",
    note: "Talks to the FastAPI backend and nothing else.",
  },
  {
    layer: "API",
    choice: "FastAPI",
    note: "Holds every key. The browser never sees a database or model credential.",
  },
  {
    layer: "Storage",
    choice: "Supabase Postgres with pgvector",
    note: "Documents, chunks and 768 dimension embeddings, with an HNSW cosine index.",
  },
  {
    layer: "Embeddings",
    choice: "BAAI/bge-base-en-v1.5",
    note: "Runs locally, so indexing and querying cost no embedding API fees.",
  },
  {
    layer: "Sparse index",
    choice: "rank_bm25 BM25Okapi",
    note: "Built in memory over the same chunk set that was embedded.",
  },
  {
    layer: "Reranker",
    choice: "BAAI/bge-reranker-base",
    note: "A local cross-encoder. CPU inference is the slowest step in the pipeline.",
  },
  {
    layer: "Generation",
    choice: "Chat completions over OpenRouter",
    note: "The only paid call in a query, and the only step that leaves the host.",
  },
];

const ENDPOINTS: Array<{ method: string; path: string; note: string }> = [
  { method: "POST", path: "/query", note: "Full pipeline. Returns the answer, its citations and the chunks used." },
  { method: "POST", path: "/retrieve/dense", note: "Vector search only." },
  { method: "POST", path: "/retrieve/sparse", note: "BM25 only." },
  { method: "POST", path: "/retrieve/hybrid", note: "Both lists, fused by RRF." },
  { method: "POST", path: "/retrieve/reranked", note: "Fused, then cross-encoder reranked." },
  { method: "GET", path: "/documents", note: "Document ids and titles, used to label source chunks." },
  { method: "GET", path: "/health", note: "Liveness check." },
  { method: "POST", path: "/ingest", note: "Operator only. Not exposed to the public frontend." },
];

export function Architecture() {
  return (
    <Section
      id="architecture"
      eyebrow="Architecture"
      title="One API, one database, two local models"
      lead="The infrastructure is deliberately small. A single Postgres instance holds both the vectors and the chunk text, the embedding and reranking models run on the host, and the language model call is the only external dependency at query time."
      tone="sunken"
    >
      <div className="overflow-x-auto rounded-card border border-border bg-surface p-4 sm:p-6 scrollbar-thin">
        <div className="min-w-[680px]">
          <PipelineDiagram />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-fg">Stack</h3>
          <dl className="mt-4 divide-y divide-border border-y border-border">
            {STACK.map((entry) => (
              <div key={entry.layer} className="grid gap-1 py-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                <dt className="font-mono text-xs text-fg-faint">{entry.layer}</dt>
                <dd className="min-w-0">
                  <span className="block text-sm text-fg">{entry.choice}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-fg-muted">{entry.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-fg">Endpoints</h3>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {ENDPOINTS.map((endpoint) => (
              <li key={endpoint.path} className="py-3">
                <code className="font-mono text-xs text-fg">
                  <span className="text-accent">{endpoint.method}</span> {endpoint.path}
                </code>
                <p className="mt-1 text-xs leading-5 text-fg-muted">{endpoint.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
