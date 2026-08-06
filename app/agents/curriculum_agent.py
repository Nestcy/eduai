"""Curriculum Agent: retrieves official curriculum/exam-spec content for a
given country/board/grade/subject via Tavily search + Firecrawl scrape,
then summarizes it with ChatGroq.
"""
from __future__ import annotations

from app.agents.llm import get_llm
from app.logging_config import logger
from app.models.state import GraphState
from app.prompts.agent_prompts import CURRICULUM_SUMMARY_PROMPT
from app.tools.curriculum_tools import discover_and_scrape_curriculum


async def curriculum_agent_node(state: GraphState) -> dict:
    """LangGraph node. Requires `country`, `curriculum_board`, `grade`, `subject` on state."""
    missing = [f for f in ("country", "curriculum_board", "grade", "subject") if not getattr(state, f)]
    if missing:
        return {"errors": state.errors + [f"Curriculum agent missing fields: {missing}"]}

    try:
        pages = await discover_and_scrape_curriculum(
            state.country, state.curriculum_board, state.grade, state.subject
        )
    except Exception as exc:
        logger.exception("Curriculum discovery failed")
        return {"errors": state.errors + [f"Curriculum discovery failed: {exc}"]}

    if not pages:
        return {"errors": state.errors + ["No official curriculum sources found"]}

    combined = "\n\n---\n\n".join(f"Source: {p['url']}\n{p['markdown'][:4000]}" for p in pages)

    llm = get_llm(temperature=0.1)
    chain = CURRICULUM_SUMMARY_PROMPT | llm
    response = await chain.ainvoke(
        {
            "country": state.country,
            "curriculum_board": state.curriculum_board,
            "grade": state.grade,
            "subject": state.subject,
            "scraped_content": combined,
        }
    )

    return {"curriculum_summary": response.content}
