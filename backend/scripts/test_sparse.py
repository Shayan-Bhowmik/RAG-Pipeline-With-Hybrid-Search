import sys
from app.retrieval.sparse import sparse_search

def main()->None:
    query=" ".join(sys.argv[1:]) if len(sys.argv) > 1 else "service role key"

    print(f"Query: '{query}'\n")
    results=sparse_search(query, top_n=5)

    if not results:
        print("No results found")
        return

    print(f"Top {len(results)} results: \n")
    for i, r in enumerate(results, 1):
        print(f"{i}. score={r['score']:.4f} chunk_id={r['chunk_id']}")


if __name__ == "__main__":
    main()