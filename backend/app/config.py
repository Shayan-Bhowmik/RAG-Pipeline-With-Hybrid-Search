from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config=SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    supabase_url: str=""
    supabase_service_role_key: str=""

    openrouter_api_key: str=""
    llm_model_name: str="minimax/minimax-m3:free"



    embedding_model_name: str="BAAI/bge-base-en-v1.5"
    reranker_model_name: str="BAAI/bge-reranker-base"

    rrf_k: int=60
    top_n_retrieval: int=20
    top_k_reranked: int=5

settings = Settings()
