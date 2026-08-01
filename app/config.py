"""Centralized application configuration.

All environment-dependent values are declared here as a single Pydantic
Settings object so the rest of the codebase never touches `os.environ`
directly. This keeps configuration testable (override via `.env.test`
or constructor kwargs) and self-documenting.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    groq_temperature: float = 0.2

    # Embeddings / RAG
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    vector_store_backend: str = "chroma"  # "faiss" | "chroma"
    vector_store_dir: str = "./data/vectorstore"
    chunk_size: int = 1000
    chunk_overlap: int = 150
    retrieval_top_k: int = 6

    # Supabase / Postgres
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_db_url: str = ""
    supabase_jwt_secret: str = ""  # Project Settings -> API -> JWT Secret

    # MCP
    mcp_brave_search_cmd: str = ""
    brave_api_key: str = ""
    mcp_firecrawl_cmd: str = ""
    firecrawl_api_key: str = ""
    mcp_filesystem_cmd: str = ""

    # Video generation (on-demand only)
    video_api_base_url: str = ""
    video_api_key: str = ""

    # App
    app_env: str = "development"
    log_level: str = "INFO"
    upload_dir: str = "./data/uploads"
    flashcard_export_dir: str = "./data/flashcards"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton (safe for FastAPI dependency injection)."""
    return Settings()
