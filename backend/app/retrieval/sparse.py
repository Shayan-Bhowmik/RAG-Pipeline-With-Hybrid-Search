from app.ingestion.sparse_index import get_bm25_index, tokenize

def sparse_search(query: str, top_n: int=20)->list[dict]:
    bm25, chunk_ids=get_bm25_index()
    query_tokens=tokenize(query)

    scores=bm25.get_scores(query_tokens)

    scored=[{"chunk_id": cid, "score": float(score)} 
        for cid, score in zip(chunk_ids, scores) 
            if score > 0
        ]

    scored.sort(key=lambda x: x["score"], reverse=True)

    return scored[:top_n]