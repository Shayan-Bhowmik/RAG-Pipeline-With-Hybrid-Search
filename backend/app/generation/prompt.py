SYSTEM_PROMPT = """You are a precise, helpful research assistant. You answer questions using ONLY the context chunks provided below. Follow these rules strictly:

1. Answer ONLY from the provided context. Do not use prior knowledge.
2. Cite your sources by referencing the chunk number in square brackets, e.g. [1], [3].
3. If multiple chunks support a point, cite all of them, e.g. [1][3].
4. If the provided context does not contain enough information to answer the question, respond EXACTLY with: "I don't have enough information in the provided documents to answer this question."
5. Do NOT guess, speculate, or hallucinate. If you're unsure, say you don't have enough information.
6. Keep answers concise and well-structured."""


def build_context_block(chunks: list[dict]) -> str:
    """Format retrieved chunks into a numbered context block for the prompt."""
    if not chunks:
        return "No context chunks available."

    lines = []
    for i, chunk in enumerate(chunks, 1):
        doc_id = chunk.get("doc_id", "unknown")
        section = chunk.get("page_or_section") or "N/A"
        text = chunk.get("text", "")
        lines.append(
            f"--- Chunk [{i}] (doc: {doc_id}, section: {section}) ---\n{text}"
        )
    return "\n\n".join(lines)


def build_user_message(query: str, chunks: list[dict]) -> str:
    """Build the full user message with context and question."""
    context = build_context_block(chunks)
    return f"""Context:
{context}

Question: {query}"""
