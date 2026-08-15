from pathlib import Path

from app.ingestion.loader import load_document
from app.ingestion.chunker import chunk_document
from app.ingestion.embedder import embed_texts
from app.db.supabase_client import get_supabase_client

def ingest_file(file_path: str | Path) -> dict:
    path = Path(file_path)
    sb = get_supabase_client()

    print(f"\n[1/4] Loading: {path.name}")
    text = load_document(path)
    print(f" Extracted {len(text)} characters.")

    print("[2/4] Creating document record...")
    doc_row = (
        sb.table("documents")
        .insert({"title": path.stem, "source_path": str(path)})
        .execute()
    )
    doc_id = doc_row.data[0]["id"]
    print(f" Document ID: {doc_id}")

    print("[3/4] Chunking...")
    chunks = chunk_document(text, doc_id=doc_id)
    print(f" {len(chunks)} chunks created.")

    if not chunks:
        print(" No chunks produced - skipping embedding and storage")
        return {"doc_id": doc_id, "chunks_stored": 0}

    print("[4/4] Embedding chunks...")
    chunk_texts = [c.text for c in chunks]
    vectors = embed_texts(chunk_texts)

    print(" Storing chunks in Supabase...")
    rows = [
        {
            "doc_id": doc_id,
            "chunk_index": c.chunk_index,
            "text": c.text,
            "page_or_section": c.page_or_section,
            "embedding": vec,
        }
        for c, vec in zip(chunks, vectors)
    ]
    sb.table("chunks").insert(rows).execute()

    print(f"\nDone - {len(rows)} chunks embedded and stored")
    return {"doc_id": doc_id, "chunks_stored": len(rows)}

