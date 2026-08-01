"""Supervisor Agent: classifies the incoming request into an `Intent` and
lets the graph's conditional edges route to the correct specialist.

Note: `video_request` is deliberately never produced by the classifier —
it can only be set directly by the API layer before the graph runs,
enforcing the "on-demand only" contract for the Video Tool Agent.
"""
from __future__ import annotations

from app.agents.llm import get_llm
from app.logging_config import logger
from app.models.state import GraphState, Intent
from app.prompts.agent_prompts import SUPERVISOR_ROUTING_PROMPT

_VALID_LLM_INTENTS = {
    "curriculum",
    "retrieval_ingest",
    "tutor",
    "study_plan",
    "flashcards",
}


async def supervisor_node(state: GraphState) -> dict:
    """LangGraph entry node. If `state.intent` is already set explicitly
    (e.g. by the API route), it is respected as-is and the LLM is skipped.
    """
    if state.intent != Intent.UNKNOWN:
        return {}

    if not state.user_query:
        return {"intent": Intent.UNKNOWN}

    llm = get_llm(temperature=0.0)
    chain = SUPERVISOR_ROUTING_PROMPT | llm
    response = await chain.ainvoke({"user_query": state.user_query})
    label = response.content.strip().lower()

    if label not in _VALID_LLM_INTENTS:
        logger.warning(f"Supervisor got unrecognized label '{label}'; defaulting to tutor")
        label = "tutor"

    return {"intent": Intent(label)}


def route_from_supervisor(state: GraphState) -> str:
    """Conditional-edge function: maps `state.intent` to the next node name."""
    mapping = {
        Intent.CURRICULUM: "curriculum_agent",
        Intent.RETRIEVAL_INGEST: "retrieval_ingest_agent",
        Intent.TUTOR: "tutor_agent",
        Intent.STUDY_PLAN: "study_planner_agent",
        Intent.FLASHCARDS: "flashcard_agent",
        Intent.VIDEO_REQUEST: "video_agent",
        Intent.UNKNOWN: "tutor_agent",
    }
    return mapping[state.intent]
