from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config=SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    supabase_url: str=""
    supabase_service_role_key: str=""

    anthropic_api_key: str=""

    embedding_model_name: str="bge-base-en"
    reranker_model_name: str="bge-reranker-base"

    rrf_k: int=60
    top_n_retrieval: int=20
    top_k_reranked: int=5

settings = Settings()