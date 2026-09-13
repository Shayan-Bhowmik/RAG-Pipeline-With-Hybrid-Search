import json
import sys
import time
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.retrieval.dense import dense_search
from app.retrieval.sparse import sparse_search
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.reranker import rerank

EVAL_SET_PATH = Path(__file__).resolve().parent / "eval_set.json"
RESULTS_PATH = Path(__file__).resolve().parent / "results.md"
TOP_N = 20
K_VALS = [1, 3, 5, 10]


def compute_metrics(eval_records: list[dict], k_values: list[int] = K_VALS) -> dict[str, float]:
    n = len(eval_records)
    if n == 0:
        return {}

    recalls = {k: 0.0 for k in k_values}
    mrr_total = 0.0

    for rec in eval_records:
        expected = rec["expected_chunk_id"]
        retrieved = rec["retrieved_ids"]

        # Hit Rate / Recall@k
        for k in k_values:
            if expected in retrieved[:k]:
                recalls[k] += 1.0

        # Reciprocal Rank (MRR)
        if expected in retrieved:
            rank = retrieved.index(expected) + 1
            mrr_total += 1.0 / rank

    results = {f"Recall@{k}": recalls[k] / n for k in k_values}
    results["MRR"] = mrr_total / n
    return results


def format_table(title: str, metrics_by_mode: dict[str, dict[str, float]]) -> str:
    headers = ["Retrieval Mode", "Recall@1", "Recall@3", "Recall@5", "Recall@10", "MRR"]
    col_widths = [22, 10, 10, 10, 10, 10]

    header_line = " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths))
    sep_line = "-|-".join("-" * w for w in col_widths)

    rows = [f"\n### {title}\n", f"| {header_line} |", f"| {sep_line} |"]

    for mode, m in metrics_by_mode.items():
        row_values = [
            f"{mode:<22}",
            f"{m.get('Recall@1', 0.0):>10.4f}",
            f"{m.get('Recall@3', 0.0):>10.4f}",
            f"{m.get('Recall@5', 0.0):>10.4f}",
            f"{m.get('Recall@10', 0.0):>10.4f}",
            f"{m.get('MRR', 0.0):>10.4f}",
        ]
        rows.append(f"| {' | '.join(row_values)} |")

    return "\n".join(rows) + "\n"


def main():
    if not EVAL_SET_PATH.exists():
        print(f"Error: eval_set.json not found at {EVAL_SET_PATH}")
        sys.exit(1)

    with open(EVAL_SET_PATH, "r", encoding="utf-8") as f:
        eval_set = json.load(f)

    total_queries = len(eval_set)
    print(f"\nLoaded {total_queries} evaluation queries from {EVAL_SET_PATH.name}")
    print(f"Retrieving top {TOP_N} candidates across all 4 modes...\n")

    modes = ["Dense (pgvector)", "Sparse (BM25)", "Hybrid (RRF)", "Hybrid + Rerank"]
    records_by_mode = {m: [] for m in modes}

    start_time = time.time()

    for idx, item in enumerate(eval_set, 1):
        query = item["query"]
        expected_id = item["expected_chunk_id"]
        q_type = item.get("query_type", "unspecified")

        print(f"[{idx:>2}/{total_queries}] ({q_type}) {query[:60]}...")

        # 1. Dense Search
        dense_res = dense_search(query, top_n=TOP_N)
        dense_ids = [r["chunk_id"] for r in dense_res]

        # 2. Sparse Search
        sparse_res = sparse_search(query, top_n=TOP_N)
        sparse_ids = [r["chunk_id"] for r in sparse_res]

        # 3. Hybrid (RRF) Search
        hybrid_res = reciprocal_rank_fusion(dense_res, sparse_res, top_n=TOP_N)
        hybrid_ids = [r["chunk_id"] for r in hybrid_res]

        # 4. Hybrid + Cross-Encoder Rerank
        reranked_res = rerank(query, [dict(c) for c in hybrid_res], top_k=TOP_N)
        reranked_ids = [r["chunk_id"] for r in reranked_res]

        for mode, ids in zip(modes, [dense_ids, sparse_ids, hybrid_ids, reranked_ids]):
            records_by_mode[mode].append({
                "expected_chunk_id": expected_id,
                "retrieved_ids": ids,
                "query_type": q_type,
            })

    elapsed = round(time.time() - start_time, 2)
    print(f"\nEvaluation completed in {elapsed}s\n")

    # Compute overall metrics
    overall_metrics = {m: compute_metrics(records_by_mode[m]) for m in modes}
    overall_table = format_table("Overall Results (All Queries)", overall_metrics)

    # Compute exact-term breakdown
    exact_metrics = {
        m: compute_metrics([r for r in records_by_mode[m] if r["query_type"] == "exact_term"])
        for m in modes
    }
    exact_table = format_table("Exact-Term Queries Breakdown", exact_metrics)

    # Compute paraphrase breakdown
    paraphrase_metrics = {
        m: compute_metrics([r for r in records_by_mode[m] if r["query_type"] == "paraphrase"])
        for m in modes
    }
    paraphrase_table = format_table("Paraphrase Queries Breakdown", paraphrase_metrics)

    # Print to console
    full_report = f"# Retrieval Evaluation Report\n\n- Queries: {total_queries}\n- Execution Time: {elapsed}s\n"
    full_report += overall_table + exact_table + paraphrase_table

    print(full_report)

    # Save to eval/results.md
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        f.write(full_report)
    print(f"Results saved to {RESULTS_PATH}")


if __name__ == "__main__":
    main()