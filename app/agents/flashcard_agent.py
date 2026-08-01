"""Flashcard Agent: generates flashcards from retrieved content and
optionally exports a printable PDF pack via ReportLab.
"""
from __future__ import annotations

import json

from app.agents.llm import get_llm
from app.agents.retrieval_agent import retrieval_query_node
from app.config import get_settings
from app.logging_config import logger
from app.models.state import Flashcard, GraphState
from app.prompts.agent_prompts import FLASHCARD_GENERATION_PROMPT
from app.tools.pdf_export import export_flashcards_to_pdf

settings = get_settings()


def _parse_flashcard_json(raw: str) -> list[Flashcard]:
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        items = json.loads(cleaned)
        return [Flashcard(question=i["question"], answer=i["answer"]) for i in items]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        logger.error(f"Failed to parse flashcard JSON from LLM: {exc}")
        return []


async def flashcard_agent_node(state: GraphState, num_cards: int = 15, export_pdf: bool = True) -> dict:
    """LangGraph node. Requires `collection_name`, `subject`, and a topic in `user_query`."""
    updates: dict = {}
    chunks = state.retrieved_chunks
    if not chunks and state.collection_name:
        # Reuse the topic (passed via user_query) as the retrieval query.
        updates.update(retrieval_query_node(state))
        chunks = updates.get("retrieved_chunks", [])

    if not chunks:
        return {"errors": state.errors + ["No content retrieved to generate flashcards from"]}

    context = "\n\n".join(c.content for c in chunks)
    llm = get_llm(temperature=0.3)
    chain = FLASHCARD_GENERATION_PROMPT | llm
    response = await chain.ainvoke(
        {
            "subject": state.subject or "the subject",
            "topic": state.user_query,
            "num_cards": num_cards,
            "context": context,
        }
    )

    flashcards = _parse_flashcard_json(response.content)
    for card in flashcards:
        card.topic = state.user_query

    updates["flashcards"] = flashcards

    if export_pdf and flashcards:
        pdf_path = export_flashcards_to_pdf(
            flashcards, settings.flashcard_export_dir, state.subject or "subject", state.user_query
        )
        updates["flashcard_pdf_path"] = pdf_path

    return updates
