"""Reusable RAG ingestion pipeline.

Any endpoint or agent can call `ingest_pdf(...)` or `ingest_web_page(...)`
to turn a source into embedded, indexed, metadata-tracked chunks. This is
intentionally decoupled from the LangGraph agents so it can also be used
by offline batch scripts (e.g. bulk-loading past exam papers).
"""
from __future__ import annotations

from langchain_core.documents import Document
from sqlalchemy.orm import Session

from app.database.repository import DocumentRepository
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
    db: Session,
    source_type: str = "upload",
    extra_metadata: dict | None = None,
) -> int:
    """Extract, chunk, embed, and index a single PDF. Records metadata in Postgres.

    Returns the number of chunks indexed.
    """
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
    num_indexed = manager.add_documents(collection_name, chunks)

    DocumentRepository.record_ingestion(
        db,
        collection_name=collection_name,
        source_name=file_path,
        source_type=source_type,
        num_chunks=num_indexed,
    )
    return num_indexed


def ingest_text_documents(
    documents: list[Document],
    collection_name: str,
    db: Session,
    source_name: str,
    source_type: str = "web",
) -> int:
    """Chunk and index already-extracted text (e.g. from a Firecrawl scrape)."""
    chunks = chunk_documents(documents)
    if not chunks:
        return 0
    manager = get_vectorstore_manager()
    num_indexed = manager.add_documents(collection_name, chunks)
    DocumentRepository.record_ingestion(
        db, collection_name=collection_name, source_name=source_name,
        source_type=source_type, num_chunks=num_indexed,
    )
    return num_indexed


def retrieve(collection_name: str, query: str, k: int | None = None):
    """Query a collection for the most relevant chunks with similarity scores."""
    manager = get_vectorstore_manager()
    try:
        return manager.similarity_search(collection_name, query, k=k)
    except Exception as exc:  # collection may not exist yet
        logger.warning(f"Retrieval failed for collection '{collection_name}': {exc}")
        return []
