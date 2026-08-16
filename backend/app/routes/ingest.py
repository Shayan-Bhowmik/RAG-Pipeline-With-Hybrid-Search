from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ingestion.pipeline import ingest_file, ingest_folder

router = APIRouter()

class IngestRequest(BaseModel):
    path: str

@router.post("/ingest")
def ingest(req: IngestRequest):
    target = Path(req.path)

    if target.is_dir():
        result = ingest_folder(target)
    elif target.is_file():
        result = ingest_file(target)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"'{req.path}' is not a valid file or directory.",
        )

    return result