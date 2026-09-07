import re


def extract_citations(answer: str, chunks: list[dict]) -> list[dict]:

    
    matches = re.findall(r"\[(\d+)\]", answer)

    
    seen = set()
    cited_indices = []
    for m in matches:
        idx = int(m)
        if idx not in seen and 1 <= idx <= len(chunks):
            seen.add(idx)
            cited_indices.append(idx)

    
    citations = []
    for idx in cited_indices:
        chunk = chunks[idx - 1]
        citations.append({
            "citation_index": idx,
            "chunk_id": chunk.get("chunk_id"),
            "doc_id": chunk.get("doc_id"),
            "text": chunk.get("text", ""),
            "page_or_section": chunk.get("page_or_section"),
            "reranker_score": chunk.get("reranker_score"),
        })

    return citations
