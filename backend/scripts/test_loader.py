import sys
from app.ingestion.loader import load_document

def main() -> None:
    if len(sys.argv) !=2:
        print("Usage: python -m scripts.test_loader <file-path")
        sys.exit(1)

    file_path = sys.argv[1]

    print(f"Loading: {file_path}\n")
    print("=" * 60)

    text = load_document(file_path)

    print(text)
    print("=" * 60)
    print(f"\nCharacters extracted:{len(text)}")

if __name__ == "__main__":
    main()