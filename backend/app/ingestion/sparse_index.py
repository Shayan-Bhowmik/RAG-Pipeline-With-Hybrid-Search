from __future__ import annotations 
import re
from rank_bm25 import BM25Okapi

from app.db.supabase_client import get_supabase_client

_bm25: BM25Okapi | None = None
_chunk_ids: list[str]=[]

def tokenize(text: str)->list[str]:
    text=text.lower()
    text=re.sub(r"[^\w\s]"," ", text)

    return [t for t in text.split() if len(t)>1]


def build_bm25_index()->tuple[BM25Okapi, list[str]]:
    global _bm25, _chunk_ids
    sb=get_supabase_client()

    result=sb.table("chunks").select("id, text").order("created_at").execute()

    if not result.data:
        raise RuntimeError("No chunks found in database. Run ingestion first")

    _chunk_ids=[row["id"] for row in result.data]
    corpus=[tokenize(row["text"]) for row in result.data]

    _bm25=BM25Okapi(corpus)
    print(f"BM25 index built: {len(_chunk_ids)} chunks indexed")

    return _bm25, _chunk_ids


def get_bm25_index()->tuple[BM25Okapi, list[str]]:
    if _bm25 is None:
        return build_bm25_index()
    
    return _bm25, _chunk_ids