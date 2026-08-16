from pathlib import Path

from app.ingestion.loader import load_document, SUPPORTED_EXTENSIONS
from app.ingestion.chunker import chunk_document
from app.ingestion.embedder import embed_texts
from app.ingestion.sparse_index import build_bm25_index
from app.db.supabase_client import get_supabase_client


def ingest_file(file_path: str | Path) -> dict:

    path = Path(file_path)
    sb = get_supabase_client()

    print(f"\n[1/4] Loading: {path.name}")
    text = load_document(path)
    print(f"  Extracted {len(text)} characters.")

    print("[2/4] Creating document record...")
    doc_row = (
        sb.table("documents")
        .insert({"title": path.stem, "source_path": str(path)})
        .execute()
    )
    doc_id = doc_row.data[0]["id"]
    print(f"  Document ID: {doc_id}")

    print("[3/4] Chunking...")
    chunks = chunk_document(text, doc_id=doc_id)
    print(f"  {len(chunks)} chunks created.")

    if not chunks:
        print("  No chunks produced — skipping embedding and storage.")
        return {"doc_id": doc_id, "chunks_stored": 0}

    print("[4/4] Embedding chunks...")
    chunk_texts = [c.text for c in chunks]
    vectors = embed_texts(chunk_texts)

    print("  Storing chunks in Supabase...")
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

    print(f"  Done — {len(rows)} chunks embedded and stored.")
    return {"doc_id": doc_id, "chunks_stored": len(rows)}


def ingest_folder(folder_path: str | Path) -> dict:

    folder = Path(folder_path)
    if not folder.is_dir():
        raise NotADirectoryError(f"Not a directory: {folder}")

    files = sorted(
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not files:
        print(f"No supported files found in {folder}")
        return {"docs_processed": 0, "total_chunks": 0, "skipped": []}

    print(f"Found {len(files)} supported file(s) in {folder.name}/\n")

    results = []
    skipped = []

    for i, f in enumerate(files, 1):
        print(f"\n{'='*60}")
        print(f"[{i}/{len(files)}] {f.name}")
        print("=" * 60)
        try:
            result = ingest_file(f)
            results.append(result)
        except Exception as e:
            print(f"  ERROR: {e} — skipping this file.")
            skipped.append({"file": f.name, "error": str(e)})

    print(f"\n{'='*60}")
    print("Rebuilding BM25 index...")
    build_bm25_index()

    total_chunks = sum(r["chunks_stored"] for r in results)
    print(f"\nIngestion complete: {len(results)} docs, {total_chunks} chunks.")
    if skipped:
        print(f"Skipped {len(skipped)} file(s): {skipped}")

    return {
        "docs_processed": len(results),
        "total_chunks": total_chunks,
        "skipped": skipped,
    }
