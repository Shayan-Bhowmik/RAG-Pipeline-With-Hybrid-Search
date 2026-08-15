from pathlib import Path
import re

import fitz

SUPPORTED_EXTENSIONS: set[str] = {".pdf",".txt",".md"}

def load_document(file_path:str | Path) -> str:

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: '{suffix}'."
            f"Supported types: {','.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    if suffix == ".pdf":
        raw = _extract_pdf(path)
    else:
        raw = _extract_plain(path)
         
    return _clean_text(raw)

def _extract_pdf(path: Path) -> str:

    pages:list[str] = []
    with fitz.open(str(path)) as doc:
        for page in doc:
            text = page.get_text()
            if text:
                pages.append(text)
    return "\n".join(pages)

def _extract_plain(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def _clean_text(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

    

