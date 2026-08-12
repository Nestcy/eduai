"""Custom `langchain_core.embeddings.Embeddings` implementation backed by
Google's Gemini embeddings API, called directly via the `google-genai` SDK.

Why a custom wrapper instead of `langchain-google-genai`: that package's
current major version aligns with LangChain 1.x internals, which would risk
reintroducing the exact dependency conflicts this project deliberately
avoided by staying within the LangChain 0.3.x family (see the comment
block at the top of requirements.txt). Calling the SDK directly is a few
dozen lines and has no LangChain-core version coupling at all.

Free-tier note: this uses Google's hosted Gemini embeddings API (free tier
available), NOT OpenAI (billed) and NOT a self-hosted sentence-transformers
model (was slow / memory-heavy on Railway's CPU-only, GPU-less environment).
"""
from __future__ import annotations

from google import genai
from langchain_core.embeddings import Embeddings

from app.logging_config import logger

# Google recommends batching embed_content calls; keep batches modest to
# stay well under per-request token/size limits regardless of chunk size.
_BATCH_SIZE = 50


class GeminiEmbeddings(Embeddings):
    """Embeds text via the Gemini Developer API's `embed_content` endpoint.

    Uses task-type hints (`RETRIEVAL_DOCUMENT` for indexed content,
    `RETRIEVAL_QUERY` for search queries) since Gemini's embedding model is
    asymmetric -- using the right task type measurably improves retrieval
    quality over embedding both the same way.
    """

    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for i in range(0, len(texts), _BATCH_SIZE):
            batch = texts[i : i + _BATCH_SIZE]
            try:
                result = self._client.models.embed_content(
                    model=self._model,
                    contents=batch,
                    config={"task_type": "RETRIEVAL_DOCUMENT"},
                )
            except Exception as exc:
                logger.error(f"Gemini embed_content failed for a batch of {len(batch)} chunks: {exc}")
                raise
            vectors.extend([e.values for e in result.embeddings])
        return vectors

    def embed_query(self, text: str) -> list[float]:
        result = self._client.models.embed_content(
            model=self._model,
            contents=[text],
            config={"task_type": "RETRIEVAL_QUERY"},
        )
        return result.embeddings[0].values
