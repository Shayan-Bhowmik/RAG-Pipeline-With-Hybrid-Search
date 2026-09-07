from fastapi import APIRouter
from pydantic import BaseModel

from app.generation.generator import generate_answer

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    top_n: int = 10
    top_k: int = 5


@router.post("/query")
def query(req: QueryRequest):
    """Full RAG pipeline: retrieve -> fuse -> rerank -> generate with citations."""
    result = generate_answer(req.question, top_n=req.top_n, top_k=req.top_k)
    return result
