"""Direct REST clients for Tavily (search) and Firecrawl (scrape).

Replaces the earlier MCP-server-based integration: no subprocess
management, no Node.js runtime needed in the container, just plain HTTPS
calls. Both APIs are simple enough that a thin wrapper here is more
reliable than routing through a protocol layer built for tool-calling
agents rather than a fixed two-endpoint use case.
"""
from __future__ import annotations

import httpx

from app.config import get_settings
from app.logging_config import logger

TAVILY_SEARCH_URL = "https://api.tavily.com/search"
FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape"

_TIMEOUT = httpx.Timeout(30.0, read=60.0)


async def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    """Run a Tavily web search. Returns a list of {title, url, content} dicts.

    Raises on transport/HTTP errors; callers should catch and degrade
    gracefully (an empty result list is a valid, non-error outcome for
    "nothing found", but a raised exception means the request itself failed).
    """
    settings = get_settings()
    payload = {
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
        "include_answer": False,
        "include_raw_content": False,
    }
    headers = {"Authorization": f"Bearer {settings.tavily_api_key}"}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(TAVILY_SEARCH_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
        }
        for r in results
    ]


async def firecrawl_scrape(url: str) -> str:
    """Scrape a single URL to clean markdown via Firecrawl. Returns markdown text.

    Raises on transport/HTTP errors or if Firecrawl reports failure, so
    callers can decide how to handle a bad/unreachable page individually
    rather than silently getting empty content.
    """
    settings = get_settings()
    payload = {"url": url, "formats": ["markdown"]}
    headers = {
        "Authorization": f"Bearer {settings.firecrawl_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(FIRECRAWL_SCRAPE_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    if not data.get("success", False):
        raise RuntimeError(f"Firecrawl scrape failed for {url}: {data.get('error', 'unknown error')}")

    markdown = data.get("data", {}).get("markdown", "")
    if not markdown:
        logger.warning(f"Firecrawl returned no markdown content for {url}")
    return markdown
