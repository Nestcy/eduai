"""Shared ChatGroq LLM instance factory used by every agent."""
from functools import lru_cache

from langchain_groq import ChatGroq

from app.config import get_settings


@lru_cache
def get_llm(temperature: float | None = None) -> ChatGroq:
    """Return a cached ChatGroq client. Pass `temperature` to override default."""
    settings = get_settings()
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=temperature if temperature is not None else settings.groq_temperature,
    )
