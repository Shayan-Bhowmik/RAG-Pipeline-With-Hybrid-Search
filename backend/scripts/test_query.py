import sys
import json
import urllib.request
import urllib.error

def main():
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.test_query <question>")
        sys.exit(1)

    question = " ".join(sys.argv[1:])
    print(f"Testing /query for: '{question}'\n")

    url = "http://127.0.0.1:8000/query"
    data = json.dumps({"question": question, "top_n": 10, "top_k": 5}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            
        print("--- Answer ---")
        print(data.get("answer"))
        print("\n--- Citations ---")
        for cite in data.get("citations", []):
            print(f"[{cite.get('id')}]: {cite.get('text', '')[:80]}...")
            
        print(f"\nModel used: {data.get('model')}")

    except urllib.error.URLError as e:
        print(f"Error calling API: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode("utf-8"))

if __name__ == "__main__":
    main()
