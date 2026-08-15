import sys 
from app.ingestion.pipeline import ingest_file

def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.ingest <file-path>")
        sys.exit(1)

    file_path = sys.argv[1]
    result = ingest_file(file_path)

    print(f"\nResult: {result}")

if __name__ == "__main__":
    main()