from openai import OpenAI
from app.config import settings
from app.retrieval.dense import dense_search
from app.retrieval.sparse import sparse_search
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.reranker import rerank
from app.generation.prompt import SYSTEM_PROMPT, build_user_message
from app.generation.citations import extract_citations


class GenerationError(RuntimeError):
    """Raised when the language model call does not produce a usable answer.

    Retrieval has already succeeded at this point, so callers can report the
    failure as generation-specific rather than as a general server fault.
    """


_client: OpenAI | None = None


def _get_client() -> OpenAI:
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
    try:
        response = client.chat.completions.create(
            model=settings.llm_model_name,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )
    except Exception as exc:
        raise GenerationError(f"LLM request failed: {exc}") from exc

    # Providers can return an error payload with no choices at all, which the
    # SDK surfaces as choices=None. Catch that here so it reads as a generation
    # failure rather than an unrelated TypeError further down.
    if not response.choices:
        raise GenerationError(
            f"LLM provider returned no choices (model={settings.llm_model_name})"
        )

    answer = response.choices[0].message.content
    if not answer:
        raise GenerationError("LLM provider returned an empty message")

    # 5. Extract citations from the answer
    citations = extract_citations(answer, reranked)

    return {
        "query": query,
        "answer": answer,
        "retrieval_mode": "hybrid",
        "citations": citations,
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
