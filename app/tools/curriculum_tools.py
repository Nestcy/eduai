"""Tools for discovering and scraping official curriculum / exam board
documents, built on top of the Brave Search MCP and Firecrawl MCP servers.

Flow: Brave Search MCP finds candidate official URLs -> Firecrawl MCP
scrapes each page to clean markdown/text -> caller (Curriculum Agent)
turns that into LangChain Documents for ingestion or direct summarization.
"""
from __future__ import annotations

import json

from app.config import get_settings
from app.logging_config import logger
from app.tools.mcp_client import get_mcp_client

settings = get_settings()


async def search_official_curriculum_sources(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 5
) -> list[dict]:
    """Use Brave Search MCP to find likely official curriculum/exam-spec URLs.

    Returns a list of {"title", "url", "snippet"} dicts. Results are not
    guaranteed authoritative — the Curriculum Agent should prefer domains
    matching the known exam board (e.g. cambridgeinternational.org,
    aqa.org.uk, ecolebooks... ) and let the LLM sanity-check relevance.
    """
    query = f"{country} {curriculum_board} {grade} {subject} official syllabus exam specification PDF"
    env = {"BRAVE_API_KEY": settings.brave_api_key} if settings.brave_api_key else None

    async with get_mcp_client("brave_search", env=env) as client:
        raw = await client.call_tool("brave_web_search", {"query": query, "count": num_results})

    results: list[dict] = []
    try:
        parsed = json.loads(raw)
        for item in parsed if isinstance(parsed, list) else parsed.get("results", []):
            results.append(
                {
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", ""),
                }
            )
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Brave Search MCP returned non-JSON payload; falling back to raw text")
        results.append({"title": "search_result", "url": "", "snippet": raw})

    return results


async def scrape_curriculum_page(url: str) -> str:
    """Use Firecrawl MCP to scrape a single curriculum/exam-board page to markdown."""
    env = {"FIRECRAWL_API_KEY": settings.firecrawl_api_key} if settings.firecrawl_api_key else None
    async with get_mcp_client("firecrawl", env=env) as client:
        content = await client.call_tool("firecrawl_scrape", {"url": url, "formats": ["markdown"]})
    return content


async def discover_and_scrape_curriculum(
    country: str, curriculum_board: str, grade: str, subject: str, max_pages: int = 3
) -> list[dict]:
    """End-to-end: search -> scrape top candidate pages -> return [{url, markdown}]."""
    candidates = await search_official_curriculum_sources(country, curriculum_board, grade, subject)
    pages: list[dict] = []
    for candidate in candidates[:max_pages]:
        url = candidate.get("url")
        if not url:
            continue
        try:
            markdown = await scrape_curriculum_page(url)
            pages.append({"url": url, "title": candidate.get("title", ""), "markdown": markdown})
        except Exception as exc:
            logger.warning(f"Failed to scrape {url}: {exc}")
    return pages
