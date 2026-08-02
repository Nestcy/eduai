"""Shared ChatGroq LLM instance factory used by every agent.

Both the API key and the model are treated as required inputs — never
hardcoded. The key comes exclusively from env (`GROQ_API_KEY`); the model
comes from env (`GROQ_MODEL`) by default but can be overridden per-call by
passing `model` explicitly (e.g. to let a future API layer choose the
model per-request, or to run different agents on different models).
"""
from functools import lru_cache

from langchain_groq import ChatGroq

from app.config import get_settings


@lru_cache
def get_llm(model: str | None = None, temperature: float | None = None) -> ChatGroq:
    """Return a cached ChatGroq client for the given `model`/`temperature`.

    Raises if no model is available from either the `model` argument or the
    required `GROQ_MODEL` env var — this never silently falls back to a
    hardcoded model name.
    """
    settings = get_settings()
    resolved_model = model or settings.groq_model
    if not resolved_model:
        raise ValueError(
            "No Groq model specified. Pass `model=` explicitly or set the "
            "GROQ_MODEL environment variable."
        )
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=resolved_model,
        temperature=temperature if temperature is not None else settings.groq_temperature,
    )
