import sys
from app.generation.generator import generate_answer


def main() -> None:
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is the capital of France?"

    print(f"Query: '{query}'\n")
    print("Running RAG pipeline (retrieve -> fuse -> rerank -> generate)...\n")

    result = generate_answer(query)

    print("=" * 60)
    print(f"Model: {result['model']}")
    print("=" * 60)
    print(f"\nAnswer:\n{result['answer']}")
    print(f"\n{'=' * 60}")
    print(f"Chunks used: {len(result['chunks_used'])}")
    for i, c in enumerate(result["chunks_used"], 1):
        print(f"  [{i}] score={c['reranker_score']:.4f}  {c['text'][:80]}...")


if __name__ == "__main__":
    main()
