"""Discover publicly available past exam papers (PDFs) for the Retrieval
Agent, using Tavily to locate candidate PDF URLs, then downloading them
directly for ingestion.
"""
from __future__ import annotations

import os

import httpx

from app.logging_config import logger
from app.tools.search_client import tavily_search


async def find_past_paper_urls(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 8
) -> list[str]:
    """Search for direct PDF links to past exam papers via Tavily."""
    query = f"{country} {curriculum_board} {grade} {subject} past exam paper filetype:pdf"
    try:
        results = await tavily_search(query, max_results=num_results)
    except Exception as exc:
        logger.warning(f"Tavily search failed for past papers: {exc}")
        return []

    return [r["url"] for r in results if r.get("url", "").lower().endswith(".pdf")]


async def download_pdf(url: str, dest_dir: str) -> str | None:
    """Download a PDF to `dest_dir` via plain HTTP. Returns local path or None on failure."""
    os.makedirs(dest_dir, exist_ok=True)
    filename = url.split("/")[-1].split("?")[0] or "paper.pdf"
    dest_path = os.path.join(dest_dir, filename)
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            with open(dest_path, "wb") as f:
                f.write(resp.content)
        return dest_path
    except Exception as exc:
        logger.warning(f"Failed to download {url}: {exc}")
        return None
