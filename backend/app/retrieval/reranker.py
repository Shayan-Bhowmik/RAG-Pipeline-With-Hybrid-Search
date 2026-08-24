from __future__ import annotations
from sentence_transformers import CrossEncoder
from app.config import settings

_reranker: CrossEncoder | None = None

def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        print(f"Loading reranker model: {settings.reranker_model_name}")
        _reranker = CrossEncoder(settings.reranker_model_name)
        print("Reranker model loaded.")
    return _reranker
    
def rerank(
    query: str,
    candidates: list[dict],
    top_k: int | None = None,
) -> list[dict]:
    if top_k is None:
        top_k=settings.top_k_reranked

    if not candidates:
        return []

    reranker = _get_reranker()

    pairs = [(query, c["text"]) for c in candidates]
    scores = reranker.predict(pairs)

    for i, candidate in enumerate(candidates):
        candidate["reranker_score"]=round(float(scores[i]), 6)

    reranked=sorted(candidates, key=lambda x: x["reranker_score"], reverse=True)
    return reranked[:top_k]