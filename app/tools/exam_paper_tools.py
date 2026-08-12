"""Discover publicly available past exam papers (PDFs) for the Retrieval
Agent, using Tavily to locate candidate pages, then downloading and
verifying each candidate before treating it as a usable PDF.

Design notes (fixes for prior silent-failure behavior):
- Don't filter candidates by URL suffix. Real PDF links frequently have
  no ".pdf" extension (query strings, redirects, CDN paths) -- filtering
  on that threw away most legitimate results before download was even
  attempted.
- Verify each downloaded file is *actually* a PDF (magic bytes) rather
  than trusting a 200 status code. Servers commonly return an HTML error
  / login / "not found" page with a 200 status, which would otherwise get
  silently saved as a .pdf and fail later, deep inside PyMuPDF extraction,
  with no clear signal of what went wrong.
- Log candidate counts and per-URL outcomes at INFO/WARNING so failures
  are visible in Railway logs instead of just an empty result list.
"""
from __future__ import annotations

import os

import httpx

from app.logging_config import logger
from app.tools.search_client import tavily_search

PDF_MAGIC_BYTES = b"%PDF-"
MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024  # 25MB safety cap per file


async def find_past_paper_candidate_urls(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 10
) -> list[str]:
    """Search for candidate past-exam-paper pages via Tavily.

    Returns ALL result URLs (not filtered by extension) -- verification
    that a candidate is actually a usable PDF happens at download time.
    """
    query = f"{country} {curriculum_board} {grade} {subject} past exam paper download"
    try:
        results = await tavily_search(query, max_results=num_results)
    except Exception as exc:
        logger.warning(f"Tavily search failed for past papers (query={query!r}): {exc}")
        return []

    urls = [r["url"] for r in results if r.get("url")]
    logger.info(f"Tavily returned {len(urls)} candidate URLs for past papers: {urls}")
    return urls


async def find_textbook_candidate_urls(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 10
) -> list[str]:
    """Search for candidate student textbook / study material pages via Tavily.

    Separate query from past papers -- "past exam paper" and "textbook pdf"
    surface very different sources, and neither query was previously being
    run for the other, meaning textbook/study-material discovery never
    actually happened before.
    """
    query = f"{country} {curriculum_board} {grade} {subject} textbook student book pdf"
    try:
        results = await tavily_search(query, max_results=num_results)
    except Exception as exc:
        logger.warning(f"Tavily search failed for textbooks (query={query!r}): {exc}")
        return []

    urls = [r["url"] for r in results if r.get("url")]
    logger.info(f"Tavily returned {len(urls)} candidate URLs for textbooks: {urls}")
    return urls


# Backwards-compatible alias for existing callers.
find_past_paper_urls = find_past_paper_candidate_urls


async def download_pdf(url: str, dest_dir: str) -> str | None:
    """Download `url` to `dest_dir` and verify it's a real PDF before keeping it.

    Returns the local path on success, or None if the download failed OR
    the response wasn't actually a PDF (checked via magic bytes, not just
    Content-Type, since some servers mislabel the header).
    """
    os.makedirs(dest_dir, exist_ok=True)
    filename = url.split("/")[-1].split("?")[0] or "paper.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"
    dest_path = os.path.join(dest_dir, filename)

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

            content = resp.content
            if len(content) > MAX_DOWNLOAD_BYTES:
                logger.warning(f"Skipping {url}: exceeds {MAX_DOWNLOAD_BYTES} byte cap")
                return None
            if not content.startswith(PDF_MAGIC_BYTES):
                content_type = resp.headers.get("content-type", "unknown")
                logger.warning(
                    f"Skipping {url}: response is not a real PDF "
                    f"(content-type={content_type}, first bytes={content[:20]!r})"
                )
                return None

            with open(dest_path, "wb") as f:
                f.write(content)
        logger.info(f"Downloaded verified PDF: {url} -> {dest_path} ({len(content)} bytes)")
        return dest_path
    except httpx.HTTPStatusError as exc:
        logger.warning(f"Failed to download {url}: HTTP {exc.response.status_code}")
        return None
    except Exception as exc:
        logger.warning(f"Failed to download {url}: {exc}")
        return None
