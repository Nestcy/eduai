"""Student progress tracking endpoints (self-reported scores, revision log)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedStudent, get_current_student, get_db
from app.database.repository import StudentRepository
from app.models.schemas import ProgressUpdateRequest

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("")
def update_progress(
    payload: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Record a self-reported score/confidence update for a topic, and log the review."""
    StudentRepository.record_progress(
        db,
        student_id=student.student_id,
        topic=payload.topic,
        subject="unspecified",
        score=payload.self_reported_score,
        confidence=payload.confidence_level,
    )
    StudentRepository.log_revision(db, student.student_id, payload.topic)
    return {"status": "recorded"}


@router.get("")
def get_progress(
    subject: str,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Fetch the latest recorded progress entries for the authenticated student/subject."""
    rows = StudentRepository.get_latest_progress(db, student.student_id, subject)
    return [
        {
            "topic": r.topic,
            "self_reported_score": r.self_reported_score,
            "confidence_level": r.confidence_level,
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rows
    ]
