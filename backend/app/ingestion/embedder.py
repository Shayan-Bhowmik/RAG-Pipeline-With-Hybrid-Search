from sentence_transformers import SentenceTransformer
from app.config import settings

_model: SentenceTransformer | None = None

def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Lodaing embedding model:{settings.embedding_model_name}")
        _model = SentenceTransformer(settings.embedding_model_name)
        print("Embedding model loaded.")

    return _model

def embed_texts(texts: list[str]) -> list[list[float]]:

    model = _get_model()
    embeddings = model.encode(texts,show_progress_bar=True, normalize_embeddings=True)
    return embeddings.tolist()


    
