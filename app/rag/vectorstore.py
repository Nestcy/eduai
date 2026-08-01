"""Vector store abstraction: creates/loads a FAISS or Chroma index per
"collection" (typically scoped as `{country}_{board}_{grade}_{subject}`).

Callers should always go through `get_vectorstore_manager()` rather than
instantiating LangChain vector stores directly, so the backend can be
swapped via config without touching agent code.
"""
from __future__ import annotations

import os
from functools import lru_cache

from langchain_community.vectorstores import FAISS, Chroma
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()


@lru_cache
def get_embeddings() -> HuggingFaceEmbeddings:
    """Cached embedding model instance (loaded once per process)."""
    return HuggingFaceEmbeddings(model_name=settings.embedding_model)


class VectorStoreManager:
    """Loads/creates/persists a vector store per named collection."""

    def __init__(self) -> None:
        self.backend = settings.vector_store_backend
        self.base_dir = settings.vector_store_dir
        os.makedirs(self.base_dir, exist_ok=True)
        self.embeddings = get_embeddings()

    def _collection_path(self, collection_name: str) -> str:
        path = os.path.join(self.base_dir, collection_name)
        os.makedirs(path, exist_ok=True)
        return path

    def add_documents(self, collection_name: str, documents: list[Document]) -> int:
        """Embed and persist `documents` into `collection_name`. Returns chunk count."""
        path = self._collection_path(collection_name)
        if self.backend == "faiss":
            index_file = os.path.join(path, "index.faiss")
            if os.path.exists(index_file):
                store = FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
                store.add_documents(documents)
            else:
                store = FAISS.from_documents(documents, self.embeddings)
            store.save_local(path)
        else:
            store = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=path,
            )
            store.add_documents(documents)
        logger.info(f"Indexed {len(documents)} chunks into collection '{collection_name}' ({self.backend})")
        return len(documents)

    def load(self, collection_name: str) -> VectorStore:
        path = self._collection_path(collection_name)
        if self.backend == "faiss":
            return FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
        return Chroma(
            collection_name=collection_name, embedding_function=self.embeddings, persist_directory=path
        )

    def similarity_search(self, collection_name: str, query: str, k: int | None = None) -> list[tuple[Document, float]]:
        store = self.load(collection_name)
        return store.similarity_search_with_relevance_scores(query, k=k or settings.retrieval_top_k)


@lru_cache
def get_vectorstore_manager() -> VectorStoreManager:
    return VectorStoreManager()
