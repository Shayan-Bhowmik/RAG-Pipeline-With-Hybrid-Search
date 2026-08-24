import sys
import json
import urllib.request
import urllib.error


def main():
    if len(sys.argv) < 3:
        print("Usage: python -m scripts.test_retrieval <dense|sparse> <query>")
        sys.exit(1)

    method = sys.argv[1]
    query = " ".join(sys.argv[2:])

    if method not in ("dense", "sparse", "hybrid", "reranked"):
        print("Method must be 'dense' or 'sparse'")
        sys.exit(1)

    print(f"Testing {method.upper()} retrieval for query: '{query}'")

    url = f"http://127.0.0.1:8000/retrieve/{method}"
    data = json.dumps({"query": query, "top_n": 3}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode("utf-8"))

        results = response_data.get("results", [])
        if not results:
            print("No results found.")
            return

        print(f"\nTop {len(results)} results:")
        for i, r in enumerate(results, 1):
            if method == "reranked":
                score = r.get("reranker_score", 0.0)
            elif method == "hybrid":
                score = r.get("rrf_score", 0.0)
            else:
                score = r.get("score", 0.0)
                
            text = r.get("text", "")[:100].replace("\n", " ")

            print(f"  {i}. [Score: {score:.4f}] {text}...")

    except urllib.error.URLError as e:
        print(f"Error calling API: {e}")


if __name__ == "__main__":
    main()
