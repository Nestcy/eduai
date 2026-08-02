"""Retrieval Agent: builds/queries the RAG pipeline over past exam papers
and user-uploaded PDFs. Handles two sub-flows depending on `state.intent`:

- retrieval_ingest: discover public past papers (Brave MCP) + ingest any
  `state.ingest_file_paths` (user uploads) into the vector store.
- otherwise (called as a sub-step by Tutor/Flashcard agents): pure query,
  populating `state.retrieved_chunks`.
"""
from __future__ import annotations

from app.logging_config import logger
from app.models.state import GraphState, Intent, RetrievedChunk
from app.rag.ingestion import build_collection_name, ingest_pdf, retrieve
from app.tools.exam_paper_tools import download_pdf, find_past_paper_urls


async def retrieval_ingest_node(state: GraphState, upload_temp_dir: str) -> dict:
    """Discover public past papers + ingest uploaded PDFs for the given scope."""
    if not all([state.country, state.curriculum_board, state.grade, state.subject]):
        return {"errors": state.errors + ["Retrieval ingest missing curriculum scope"]}

    collection = state.collection_name or build_collection_name(
        state.country, state.curriculum_board, state.grade, state.subject
    )

    total_chunks = 0
    ingested_files: list[str] = []

    # 1. Publicly available past papers via Brave Search MCP
    try:
        urls = await find_past_paper_urls(state.country, state.curriculum_board, state.grade, state.subject)
        for url in urls:
            local_path = await download_pdf(url, upload_temp_dir)
            if local_path:
                total_chunks += ingest_pdf(local_path, collection, extra_metadata={"source_type": "web"})
                ingested_files.append(local_path)
    except Exception as exc:
        logger.warning(f"Past paper discovery/ingestion failed: {exc}")

    # 2. User-uploaded PDFs
    for path in state.ingest_file_paths:
        try:
            total_chunks += ingest_pdf(path, collection, extra_metadata={"source_type": "upload"})
            ingested_files.append(path)
        except Exception as exc:
            logger.warning(f"Failed to ingest uploaded file {path}: {exc}")

    logger.info(f"Ingested {total_chunks} chunks across {len(ingested_files)} files into '{collection}'")
    return {"collection_name": collection}


def retrieval_query_node(state: GraphState) -> dict:
    """Pure query step: populate `retrieved_chunks` for the Tutor/Flashcard agents."""
    if not state.collection_name or not state.user_query:
        return {"retrieved_chunks": []}

    results = retrieve(state.collection_name, state.user_query)
    chunks = [
        RetrievedChunk(
            content=doc.page_content,
            source=doc.metadata.get("source", "unknown"),
            page=doc.metadata.get("page"),
            score=score,
            metadata=doc.metadata,
        )
        for doc, score in results
    ]
    return {"retrieved_chunks": chunks}
