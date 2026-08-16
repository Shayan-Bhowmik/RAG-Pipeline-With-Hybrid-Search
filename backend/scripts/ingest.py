import sys 
from pathlib import Path 
from app.ingestion.pipeline import ingest_file, ingest_folder

def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.ingest <file-or-folder-path>")
        sys.exit(1)

    target = Path(sys.argv[1])

    if target.is_dir():
        result = ingest_folder(target)
    elif target.is_file():
        result = ingest_file(target)
    else:
        print(f"Error: '{target}' is not a valid file or directory.")
        sys.exit(1)

    print(f"\nResult: {result}")

if __name__ == "__main__":
    main()