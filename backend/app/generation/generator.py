from openai import OpenAI
from app.config import settings
from app.retrieval.dense import dense_search
from app.retrieval.sparse import sparse_search
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.reranker import rerank
from app.generation.prompt import SYSTEM_PROMPT, build_user_message


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Lazy-init the OpenRouter client (OpenAI-compatible)."""
    global _client
    if _client is None:
        if not settings.openrouter_api_key:
            raise RuntimeError("OPENROUTER_API_KEY must be set in .env")
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
    return _client


def generate_answer(query: str, top_n: int = 10, top_k: int = 5) -> dict:
    """Full RAG pipeline: retrieve → fuse → rerank → generate."""

    # 1. Retrieve from both methods
    dense_results = dense_search(query, top_n=top_n)
    sparse_results = sparse_search(query, top_n=top_n)

    # 2. Fuse with RRF
    fused = reciprocal_rank_fusion(dense_results, sparse_results, top_n=top_n)

    # 3. Rerank
    reranked = rerank(query, fused, top_k=top_k)

    # 4. Build prompt and call LLM via OpenRouter
    user_message = build_user_message(query, reranked)

    client = _get_client()
    response = client.chat.completions.create(
        model=settings.llm_model_name,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )

    answer = response.choices[0].message.content

    return {
        "query": query,
        "answer": answer,
        "chunks_used": [
            {
                "chunk_id": c.get("chunk_id"),
                "doc_id": c.get("doc_id"),
                "text": c.get("text", "")[:200],
                "reranker_score": c.get("reranker_score"),
            }
            for c in reranked
        ],
        "model": response.model,
    }
