"""Curriculum discovery/summary endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedStudent, get_current_student, get_db, get_settings
from app.graph.build_graph import build_graph
from app.logging_config import logger
from app.models.schemas import CurriculumRequest
from app.models.state import GraphState, Intent

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.post("")
async def get_curriculum_summary(
    payload: CurriculumRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Discover and summarize the official curriculum/exam specification."""
    settings = get_settings()
    state = GraphState(
        intent=Intent.CURRICULUM,
        country=payload.country,
        curriculum_board=payload.curriculum_board,
        grade=payload.grade,
        subject=payload.subject,
    )
    graph = build_graph(db=db, upload_temp_dir=settings.upload_dir)
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Curriculum graph run failed")
        raise HTTPException(500, f"Curriculum lookup failed: {exc}") from exc

    if not result.get("curriculum_summary"):
        raise HTTPException(422, "; ".join(result.get("errors", ["Could not summarize curriculum"])))

    return {"summary": result["curriculum_summary"]}
