"""Discover publicly available past exam papers (PDFs) for the Retrieval
Agent, using Brave Search MCP to locate candidate PDF URLs and Firecrawl
MCP to fetch them for download prior to ingestion.
"""
from __future__ import annotations

import json
import os

import httpx

from app.config import get_settings
from app.logging_config import logger
from app.tools.mcp_client import get_mcp_client

settings = get_settings()


async def find_past_paper_urls(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 8
) -> list[str]:
    """Search for direct PDF links to past exam papers via Brave Search MCP."""
    query = f"{country} {curriculum_board} {grade} {subject} past exam paper filetype:pdf"
    env = {"BRAVE_API_KEY": settings.brave_api_key} if settings.brave_api_key else None

    async with get_mcp_client("brave_search", env=env) as client:
        raw = await client.call_tool("brave_web_search", {"query": query, "count": num_results})

    urls: list[str] = []
    try:
        parsed = json.loads(raw)
        items = parsed if isinstance(parsed, list) else parsed.get("results", [])
        urls = [item.get("url") for item in items if item.get("url", "").lower().endswith(".pdf")]
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Could not parse Brave Search MCP response for past papers")
    return urls


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
