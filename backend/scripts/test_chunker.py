import sys 
from app.ingestion.loader import load_document
from app.ingestion.chunker import chunk_document

def main()->None:
    if len(sys.argv)!=2:
        print("Usage: python -m scripts.test_chunker <file-path>")
        sys.exit(1)
    file_path=sys.argv[1]
    doc_id="test-doc-00000000"

    print(f"Loading: {file_path}\n")
    text=load_document(file_path)
    chunks=chunk_document(text, doc_id=doc_id)

    print(f"Total chunks: {len(chunks)}\n")
    print("="*60)


    for chunk in chunks:
        print(f"\n--- Chunk{chunk.chunk_index}({len(chunk.text)} chars) ---")

        preview=chunk.text[:200]
        if len(chunk.text)>200:
            preview+="..."

        print(preview)
    
    print("\n"+"="*60)
    print(f"Chunks: {len(chunks)} | Avg Chars: {sum(len(c.text) for c in chunks) // max(len(chunks), 1)}")

if __name__ == "__main__":
    main()