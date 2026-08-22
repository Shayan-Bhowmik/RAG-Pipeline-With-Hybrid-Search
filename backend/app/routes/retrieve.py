from fastapi import APIRouter
from pydantic import BaseModel

from app.retrieval.dense import dense_search
from app.retrieval.sparse import sparse_search

from app.retrieval.fusion import reciprocal_rank_fusion

router = APIRouter()


class RetrieveRequest(BaseModel):
    query: str
    top_n: int = 10


@router.post("/retrieve/dense")
def retrieve_dense(req: RetrieveRequest):
    """Return the top-N chunks most similar to the query (dense/semantic)."""
    results = dense_search(req.query, top_n=req.top_n)
    return {"query": req.query, "method": "dense", "results": results}


@router.post("/retrieve/sparse")
def retrieve_sparse(req: RetrieveRequest):
    """Return the top-N chunks matching the query by BM25 keyword score."""
    results = sparse_search(req.query, top_n=req.top_n)
    return {"query": req.query, "method": "sparse", "results": results}

@router.post("/retrieve/hybrid")
def retrieve_hybrid(req: RetrieveRequest):
    dense_results=dense_search(req.query, top_n=req.top_n)
    sparse_results=sparse_search(req.query, top_n=req.top_n)
    fused=reciprocal_rank_fusion(dense_results, sparse_results, top_n=req.top_n)
    return {"query":req.query, "method":"hybrid", "results":fused}
