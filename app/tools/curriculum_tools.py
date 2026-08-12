"""Tools for discovering and scraping official curriculum / exam board
documents, using Tavily for search and Firecrawl for scraping.

Flow: Tavily finds candidate official URLs -> Firecrawl scrapes each page
to clean markdown -> caller (Curriculum Agent) summarizes or ingests it.
"""
from __future__ import annotations

from app.logging_config import logger
from app.tools.search_client import firecrawl_scrape, tavily_search


async def search_official_curriculum_sources(
    country: str, curriculum_board: str, grade: str, subject: str, num_results: int = 5
) -> list[dict]:
    """Search for likely official curriculum/exam-spec URLs via Tavily.

    Returns a list of {"title", "url", "snippet"} dicts. Results are not
    guaranteed authoritative -- the Curriculum Agent should prefer domains
    matching the known exam board and let the LLM sanity-check relevance.
    """
    query = f"{country} {curriculum_board} {grade} {subject} official syllabus exam specification PDF"
    try:
        results = await tavily_search(query, max_results=num_results)
    except Exception as exc:
        logger.error(f"Tavily search failed for curriculum sources (query={query!r}): {exc}")
        return []

    if not results:
        logger.warning(f"Tavily returned zero results for curriculum query: {query!r}")

    return [{"title": r["title"], "url": r["url"], "snippet": r["content"]} for r in results]


async def scrape_curriculum_page(url: str) -> str:
    """Scrape a single curriculum/exam-board page to markdown via Firecrawl."""
    return await firecrawl_scrape(url)


async def discover_and_scrape_curriculum(
    country: str, curriculum_board: str, grade: str, subject: str, max_pages: int = 3
) -> list[dict]:
    """End-to-end: search -> scrape top candidate pages -> return [{url, title, markdown}]."""
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
