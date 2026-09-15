import rawResults from "@/data/eval-results.json";

/**
 * Evaluation numbers shown on the site.
 *
 * The data is generated from backend/eval/results.md by `npm run sync:eval`,
 * never typed by hand. If the generated file is missing or empty, the
 * Evaluation section renders an explanatory empty state rather than anything
 * invented.
 */

export type MetricKey = "recall1" | "recall3" | "recall5" | "recall10" | "mrr";

export interface EvaluationRow {
  mode: string;
  metrics: Record<MetricKey, number>;
  /** True where the writeup marks this value as the best in its column. */
  best: Record<MetricKey, boolean>;
}

export interface EvaluationTable {
  id: string;
  label: string;
  queryCount: number | null;
  rows: EvaluationRow[];
}

export interface EvaluationResults {
  generatedFrom: string;
  generatedAt: string;
  evalSetSize: number | null;
  tables: EvaluationTable[];
}

export const METRIC_COLUMNS: Array<{ key: MetricKey; label: string }> = [
  { key: "recall1", label: "Recall@1" },
  { key: "recall3", label: "Recall@3" },
  { key: "recall5", label: "Recall@5" },
  { key: "recall10", label: "Recall@10" },
  { key: "mrr", label: "MRR" },
];

const results = rawResults as EvaluationResults;

export const evaluationResults: EvaluationResults | null =
  results.tables?.length > 0 ? results : null;

export function formatMetric(value: number): string {
  return value.toFixed(4);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
