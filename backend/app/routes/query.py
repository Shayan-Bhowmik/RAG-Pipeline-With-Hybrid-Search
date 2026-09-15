import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.generation.generator import GenerationError, generate_answer

logger = logging.getLogger("hybridrag.query")

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    top_n: int = 10
    top_k: int = 5


@router.post("/query")
def query(req: QueryRequest):
    """Full RAG pipeline: retrieve -> fuse -> rerank -> generate with citations."""
    if not req.question.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "Query cannot be empty.", "code": "empty_query"},
        )

    try:
        return generate_answer(req.question, top_n=req.top_n, top_k=req.top_k)
    except GenerationError as exc:
        # Retrieval worked, the model call did not. Log the real cause, return
        # a status the frontend can distinguish from an unreachable backend.
        logger.warning("Generation failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail={
                "error": "The answer could not be generated. Please try again.",
                "code": "generation_failed",
            },
        ) from exc
