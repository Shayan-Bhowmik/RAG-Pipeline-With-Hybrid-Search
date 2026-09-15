from fastapi import APIRouter

from app.db.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/documents")
def list_documents():
    """Return id/title for every ingested document.

    Retrieval results only carry doc_id, so the frontend uses this to label
    source chunks with the document they came from.
    """
    sb = get_supabase_client()
    result = sb.table("documents").select("id, title, source_path, uploaded_at").order("uploaded_at").execute()

    return {
        "documents": [
            {
                "doc_id": row["id"],
                "title": row["title"],
            }
            for row in result.data
        ]
    }
