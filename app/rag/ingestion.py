"""Reusable RAG ingestion pipeline.

Any endpoint or agent can call `ingest_pdf(...)` or `ingest_text_documents(...)`
to turn a source into embedded, indexed chunks. Railway is a stateless AI
service -- it does NOT write to Supabase Postgres. Ingestion metadata
(what's been indexed) lives only in the vector store itself (FAISS/Chroma,
on the Railway volume), not in a separate Postgres table.
"""
from __future__ import annotations

from langchain_core.documents import Document

from app.logging_config import logger
from app.rag.chunking import chunk_documents, extract_text_from_pdf
from app.rag.vectorstore import get_vectorstore_manager


def build_collection_name(country: str, board: str, grade: str, subject: str) -> str:
    """Deterministic collection naming so retrieval can be scoped consistently."""
    raw = f"{country}_{board}_{grade}_{subject}".lower().replace(" ", "_")
    return "".join(c for c in raw if c.isalnum() or c == "_")


def ingest_pdf(
    file_path: str,
    collection_name: str,
    extra_metadata: dict | None = None,
) -> int:
    """Extract, chunk, embed, and index a single PDF. Returns chunk count."""
    logger.info(f"Ingesting PDF '{file_path}' into collection '{collection_name}'")
    pages = extract_text_from_pdf(file_path)
    if extra_metadata:
        for page in pages:
            page.metadata.update(extra_metadata)
    chunks = chunk_documents(pages)
    if not chunks:
        logger.warning(f"No extractable content in {file_path}")
        return 0

    manager = get_vectorstore_manager()
    return manager.add_documents(collection_name, chunks)


def ingest_text_documents(
    documents: list[Document],
    collection_name: str,
) -> int:
    """Chunk and index already-extracted text (e.g. from a Firecrawl scrape)."""
    chunks = chunk_documents(documents)
    if not chunks:
        return 0
    manager = get_vectorstore_manager()
    return manager.add_documents(collection_name, chunks)


def retrieve(collection_name: str, query: str, k: int | None = None):
    """Query a collection for the most relevant chunks with similarity scores."""
    manager = get_vectorstore_manager()
    try:
        return manager.similarity_search(collection_name, query, k=k)
    except Exception as exc:  # collection may not exist yet
        logger.warning(f"Retrieval failed for collection '{collection_name}': {exc}")
        return []
