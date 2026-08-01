"""Wires the Supervisor + specialist agents into a single LangGraph
StateGraph. Each specialist is a leaf: after running, it returns to END
(this is a single-turn dispatch graph, not a multi-hop agent loop — each
API call constructs a fresh state, sets `intent` and inputs, and runs the
graph once). This keeps behavior predictable and easy to test per-agent.

The Video Tool Agent node exists in the graph (so the compiled graph can
serve `/tutor/video`), but it is unreachable via the Supervisor's LLM
classification — see `agents/supervisor.py`.
"""
from __future__ import annotations

from functools import partial

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.agents.curriculum_agent import curriculum_agent_node
from app.agents.flashcard_agent import flashcard_agent_node
from app.agents.planner_agent import study_planner_node
from app.agents.retrieval_agent import retrieval_ingest_node
from app.agents.supervisor import route_from_supervisor, supervisor_node
from app.agents.tutor_agent import tutor_agent_node
from app.agents.video_agent import video_agent_node
from app.models.state import GraphState


def build_graph(
    db: Session,
    upload_temp_dir: str,
    exam_date_str: str | None = None,
    daily_minutes: int = 60,
    num_flashcards: int = 15,
    export_pdf: bool = True,
):
    """Compile and return the LangGraph app. Bound dependencies (DB session,
    file paths, request-specific params) are injected via `functools.partial`
    so agent node signatures stay simple and independently testable.
    """
    graph = StateGraph(GraphState)

    graph.add_node("supervisor", supervisor_node)
    graph.add_node("curriculum_agent", curriculum_agent_node)
    graph.add_node("retrieval_ingest_agent", partial(retrieval_ingest_node, db=db, upload_temp_dir=upload_temp_dir))
    graph.add_node("tutor_agent", tutor_agent_node)
    graph.add_node(
        "study_planner_agent",
        partial(study_planner_node, exam_date_str=exam_date_str or "", daily_minutes=daily_minutes),
    )
    graph.add_node(
        "flashcard_agent",
        partial(flashcard_agent_node, num_cards=num_flashcards, export_pdf=export_pdf),
    )
    graph.add_node("video_agent", video_agent_node)

    graph.set_entry_point("supervisor")
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "curriculum_agent": "curriculum_agent",
            "retrieval_ingest_agent": "retrieval_ingest_agent",
            "tutor_agent": "tutor_agent",
            "study_planner_agent": "study_planner_agent",
            "flashcard_agent": "flashcard_agent",
            "video_agent": "video_agent",
        },
    )

    for node in (
        "curriculum_agent",
        "retrieval_ingest_agent",
        "tutor_agent",
        "study_planner_agent",
        "flashcard_agent",
        "video_agent",
    ):
        graph.add_edge(node, END)

    return graph.compile()
