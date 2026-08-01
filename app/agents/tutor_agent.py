"""Tutor Agent: answers student questions grounded in retrieved RAG context,
citing sources. Runs `retrieval_query_node` internally first if chunks
haven't already been populated by the graph.
"""
from __future__ import annotations

from app.agents.llm import get_llm
from app.agents.retrieval_agent import retrieval_query_node
from app.logging_config import logger
from app.models.state import GraphState
from app.prompts.agent_prompts import TUTOR_SYSTEM_PROMPT


async def tutor_agent_node(state: GraphState) -> dict:
    """LangGraph node. Requires `user_query` and `collection_name` on state."""
    updates: dict = {}
    chunks = state.retrieved_chunks
    if not chunks and state.collection_name:
        updates.update(retrieval_query_node(state))
        chunks = updates.get("retrieved_chunks", [])

    if not chunks:
        logger.info("Tutor agent proceeding with no retrieved context")

    context = "\n\n".join(f"[{c.source}, p.{c.page}] {c.content}" for c in chunks) or "No context retrieved."

    llm = get_llm(temperature=0.3)
    chain = TUTOR_SYSTEM_PROMPT | llm
    response = await chain.ainvoke(
        {
            "subject": state.subject or "the subject",
            "grade": state.grade or "student",
            "curriculum_board": state.curriculum_board or "the relevant board",
            "country": state.country or "",
            "context": context,
            "question": state.user_query,
        }
    )

    updates["tutor_answer"] = response.content
    return updates
