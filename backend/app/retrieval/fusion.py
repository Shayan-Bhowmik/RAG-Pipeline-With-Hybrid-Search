# rrf score = Σ  1 / (k + rank_i)

from __future__ import annotations
from app.config import settings

def reciprocal_rank_fusion(
    dense_results: list[dict],
    sparse_results: list[dict],
    k: int | None = None,
    top_n: int=10,
)-> list[dict]:
    if k is None:
        k=settings.rrf_k
    
    scores: dict[str, float]={}
    chunk_data: dict[str, dict]={}
    dense_ranks: dict[str, int]={}
    sparse_ranks: dict[str, int]={}

    for rank, result in enumerate(dense_results, 1):
        cid=result["chunk_id"]
        scores[cid]=scores.get(cid, 0.0)+1.0/(k+rank)
        chunk_data[cid]=result
        dense_ranks[cid]=rank

    
    for rank, result in enumerate(sparse_results, 1):
        cid=result["chunk_id"]
        scores[cid]=scores.get(cid, 0.0)+1.0/(k+rank)
        if cid not in chunk_data:
            chunk_data[cid]=result
        sparse_ranks[cid]=rank



    fused=sorted(scores.items(), key=lambda x:x[1], reverse=True)

    return[
        {
            **chunk_data[cid],
            "rrf_score": round(score, 6),
            "dense_rank": dense_ranks.get(cid),
            "sparse_rank": sparse_ranks.get(cid),
        }
        for cid, score in fused[:top_n]
    ]