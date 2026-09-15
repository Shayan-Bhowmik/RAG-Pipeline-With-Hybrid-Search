import { Section } from "@/components/site/Section";
import { cn } from "@/lib/cn";
import { evaluationResults, formatMetric } from "@/lib/evaluation";

interface ModeCard {
  id: string;
  label: string;
  endpoint: string;
  evalMode: string;
  tone: string;
  strength: string;
  weakness: string;
}

const MODES: ModeCard[] = [
  {
    id: "dense",
    label: "Dense",
    endpoint: "POST /retrieve/dense",
    evalMode: "Dense (pgvector)",
    tone: "text-dense",
    strength:
      "Matches meaning. A question worded nothing like the document still finds the right chunk.",
    weakness:
      "Blurs rare exact tokens. Identifiers, column names and acronyms get pulled toward their neighbourhood in vector space and stop being distinctive.",
  },
  {
    id: "sparse",
    label: "Sparse",
    endpoint: "POST /retrieve/sparse",
    evalMode: "Sparse (BM25)",
    tone: "text-sparse",
    strength:
      "Matches tokens. A query containing an exact term reliably surfaces the chunk containing that term.",
    weakness:
      "Needs shared vocabulary. Ask the same question in different words and the score collapses.",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    endpoint: "POST /retrieve/hybrid",
    evalMode: "Hybrid (RRF)",
    tone: "text-accent",
    strength:
      "Takes the top of both lists. A chunk ranked well by either method reaches the context window.",
    weakness:
      "Costs both searches per query, and fusion cannot rescue a chunk that neither method ranked at all.",
  },
];

function metricFor(tableId: string, evalMode: string) {
  const table = evaluationResults?.tables.find((entry) => entry.id === tableId);
  return table?.rows.find((row) => row.mode === evalMode)?.metrics.mrr ?? null;
}

export function RetrievalModes() {
  return (
    <Section
      id="retrieval"
      eyebrow="Why hybrid"
      title="Two retrieval methods that fail in opposite directions"
      lead="Dense search and keyword search break on different queries. Picking one means accepting its blind spot. Fusing them means a chunk only has to be found by one of the two."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((mode) => {
          const exact = metricFor("exact", mode.evalMode);
          const paraphrase = metricFor("paraphrase", mode.evalMode);

          return (
            <article
              key={mode.id}
              className="flex flex-col rounded-card border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className={cn("text-base font-semibold tracking-tight", mode.tone)}>
                  {mode.label}
                </h3>
              </div>
              <code className="mt-1 font-mono text-[0.7rem] text-fg-faint">{mode.endpoint}</code>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-fg-faint">
                    Strength
                  </dt>
                  <dd className="mt-1 leading-6 text-fg-muted">{mode.strength}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-fg-faint">
                    Limit
                  </dt>
                  <dd className="mt-1 leading-6 text-fg-muted">{mode.weakness}</dd>
                </div>
              </dl>

              {exact !== null && paraphrase !== null ? (
                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-4 font-mono text-xs">
                  <div>
                    <dt className="text-fg-faint">MRR, exact term</dt>
                    <dd className="mt-1 text-sm tabular-nums text-fg">{formatMetric(exact)}</dd>
                  </div>
                  <div>
                    <dt className="text-fg-faint">MRR, paraphrase</dt>
                    <dd className="mt-1 text-sm tabular-nums text-fg">
                      {formatMetric(paraphrase)}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-7 text-fg-muted">
        The gap is visible in the numbers above, measured on the project eval set. Keyword
        search is far ahead on queries containing exact terms and roughly level with dense
        search on paraphrased ones. Fusion inherits the keyword advantage on exact terms
        while scoring highest of the three on paraphrases.
      </p>
    </Section>
  );
}
