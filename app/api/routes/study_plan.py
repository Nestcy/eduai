"""Study plan generation endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedStudent, get_current_student, get_db, get_settings
from app.database.repository import StudentRepository
from app.graph.build_graph import build_graph
from app.logging_config import logger
from app.models.schemas import StudyPlanRequest, StudyPlanResponse
from app.models.state import GraphState, Intent

router = APIRouter(prefix="/study-plan", tags=["study-plan"])


@router.post("", response_model=StudyPlanResponse)
async def generate_study_plan(
    payload: StudyPlanRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Generate a prioritized revision schedule from self-reported performance data."""
    settings = get_settings()
    state = GraphState(
        intent=Intent.STUDY_PLAN,
        student_id=student.student_id,
        subject=payload.subject,
        topic_performance=payload.topic_performance,
    )

    graph = build_graph(
        db=db,
        upload_temp_dir=settings.upload_dir,
        exam_date_str=payload.exam_date,
        daily_minutes=payload.daily_minutes_available,
    )
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Study plan graph run failed")
        raise HTTPException(500, f"Study plan generation failed: {exc}") from exc

    if not result.get("study_plan"):
        raise HTTPException(422, "; ".join(result.get("errors", ["Could not generate a plan"])))

    StudentRepository.save_study_plan(
        db, student.student_id, payload.subject, {"plan": [e.model_dump() for e in result["study_plan"]]}
    )

    return StudyPlanResponse(student_id=student.student_id, plan=result["study_plan"])
