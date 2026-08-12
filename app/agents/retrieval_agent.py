"""Retrieval Agent: builds/queries the RAG pipeline over past exam papers,
student textbooks, and user-uploaded PDFs. Handles two sub-flows depending
on `state.intent`:

- retrieval_ingest: discover public past papers + textbooks (Tavily search)
  and ingest any `state.ingest_file_paths` (user uploads) into the vector store.
- otherwise (called as a sub-step by Tutor/Flashcard agents): pure query,
  populating `state.retrieved_chunks`.

Discovery and downloads run CONCURRENTLY (not one-at-a-time). Searching and
downloading several documents sequentially inside a single HTTP request was
slow enough to look like the agent "couldn't find or download materials" --
in practice it was often still working, just serially, and likely to exceed
Railway's request timeout before finishing.
"""
from __future__ import annotations

import asyncio

from app.logging_config import logger
from app.models.state import GraphState, Intent, RetrievedChunk
from app.rag.ingestion import build_collection_name, ingest_pdf, retrieve
from app.tools.exam_paper_tools import (
    download_pdf,
    find_past_paper_candidate_urls,
    find_textbook_candidate_urls,
)

# Cap concurrent downloads so we don't hammer source sites or blow past
# Railway's own outbound connection limits.
_DOWNLOAD_CONCURRENCY = 5


async def _download_and_ingest(
    url: str, collection: str, upload_temp_dir: str, source_type: str, semaphore: asyncio.Semaphore
) -> tuple[str, int] | None:
    """Download one candidate URL and, if it's a real PDF, ingest it.
    Returns (local_path, num_chunks) on success, None otherwise.
    """
    async with semaphore:
        local_path = await download_pdf(url, upload_temp_dir)
        if not local_path:
            return None
        try:
            # ingest_pdf does CPU-bound PDF parsing + a blocking embeddings
            # API call -- run it off the event loop so concurrent downloads
            # aren't serialized behind it.
            num_chunks = await asyncio.to_thread(
                ingest_pdf, local_path, collection, extra_metadata={"source_type": source_type}
            )
            return (local_path, num_chunks)
        except Exception as exc:
            logger.warning(f"Failed to ingest downloaded file {local_path}: {exc}")
            return None


async def retrieval_ingest_node(state: GraphState, upload_temp_dir: str) -> dict:
    """Discover public past papers + textbooks, and ingest uploaded PDFs, concurrently."""
    if not all([state.country, state.curriculum_board, state.grade, state.subject]):
        return {"errors": state.errors + ["Retrieval ingest missing curriculum scope"]}

    collection = state.collection_name or build_collection_name(
        state.country, state.curriculum_board, state.grade, state.subject
    )

    total_chunks = 0
    ingested_files: list[str] = []

    # 1. Discover past-paper and textbook candidates concurrently.
    try:
        past_paper_urls, textbook_urls = await asyncio.gather(
            find_past_paper_candidate_urls(state.country, state.curriculum_board, state.grade, state.subject),
            find_textbook_candidate_urls(state.country, state.curriculum_board, state.grade, state.subject),
        )
    except Exception as exc:
        logger.warning(f"Material discovery failed: {exc}")
        past_paper_urls, textbook_urls = [], []

    candidates = [(url, "web_past_paper") for url in past_paper_urls] + [
        (url, "web_textbook") for url in textbook_urls
    ]

    # 2. Download + ingest all candidates concurrently (bounded).
    if candidates:
        semaphore = asyncio.Semaphore(_DOWNLOAD_CONCURRENCY)
        results = await asyncio.gather(
            *[
                _download_and_ingest(url, collection, upload_temp_dir, source_type, semaphore)
                for url, source_type in candidates
            ],
            return_exceptions=True,
        )
        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"Download/ingest task raised: {result}")
                continue
            if result:
                local_path, num_chunks = result
                total_chunks += num_chunks
                ingested_files.append(local_path)

    # 3. User-uploaded PDFs (already on disk, no download needed).
    for path in state.ingest_file_paths:
        try:
            num_chunks = await asyncio.to_thread(
                ingest_pdf, path, collection, extra_metadata={"source_type": "upload"}
            )
            total_chunks += num_chunks
            ingested_files.append(path)
        except Exception as exc:
            logger.warning(f"Failed to ingest uploaded file {path}: {exc}")

    logger.info(
        f"Ingested {total_chunks} chunks across {len(ingested_files)} files into '{collection}' "
        f"({len(candidates)} web candidates found, {len(state.ingest_file_paths)} uploads)"
    )
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
