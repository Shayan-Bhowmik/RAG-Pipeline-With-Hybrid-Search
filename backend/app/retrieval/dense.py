from app.ingestion.embedder import embed_texts
from app.db.supabase_client import get_supabase_client


def dense_search(query: str, top_n: int = 20) -> list[dict]:
    """Embed a query and return the top-N most similar chunks."""

    # Embed the query (returns a list of vectors; we only have one query)
    query_vector = embed_texts([query])[0]

    sb = get_supabase_client()
    result = sb.rpc(
        "match_chunks",
        {"query_embedding": query_vector, "match_count": top_n},
    ).execute()

    return [
        {
            "chunk_id": row["id"],
            "doc_id": row["doc_id"],
            "text": row["text"],
            "page_or_section": row["page_or_section"],
            "score": row["similarity"],
        }
        for row in result.data
    ]
