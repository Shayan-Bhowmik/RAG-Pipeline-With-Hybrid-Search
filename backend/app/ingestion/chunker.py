from __future__ import annotations 
import re
import uuid
from dataclasses import dataclass

@dataclass
class Chunk:
    chunk_id: str
    doc_id: str
    chunk_index: int
    text: str
    page_or_section: str | None=None

def _split_sentences(text: str)->list[str]:
    paragraphs=re.split(r"\n\s*\n", text)

    sentences:list[str]=[]
    for para in paragraphs:
        para=para.replace("\n"," ").strip()

        if not para:
            continue
        parts=re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", para)
        sentences.extend(p.strip() for p in parts if p.strip())

    return sentences

def chunk_document(
    text: str,
    doc_id: str, 
    window_size: int=8,
    overlap: int=3,
    min_chunk_chars: int=50,
)->list[Chunk]:
    sentences=_split_sentences(text)
    if not sentences:
        return []
    
    step = max(1, window_size-overlap)
    chunks: list[Chunk]=[]

    for start in range(0, len(sentences), step):
        window=sentences[start : start+window_size]
        chunk_text=" ".join(window)

        if len(chunk_text) < min_chunk_chars and chunks:
            prev=chunks[-1]
            chunks[-1]=Chunk(
                chunk_id=prev.chunk_id,
                doc_id=prev.doc_id,
                chunk_index=prev.chunk_index,
                text=prev.text+" "+chunk_text,
                page_or_section=prev.page_or_section,
            )
            continue
        chunks.append(
            Chunk(
                chunk_id=str(uuid.uuid4()),
                doc_id=doc_id,
                chunk_index=len(chunks),
                text=chunk_text,
            )
        )
    return chunks