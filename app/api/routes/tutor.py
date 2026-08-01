"""Tutor endpoints: ask a question (RAG-grounded), and request an
on-demand explainer video.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedStudent, get_current_student, get_db, get_settings
from app.graph.build_graph import build_graph
from app.logging_config import logger
from app.models.schemas import TutorRequest, TutorResponse, VideoRequest, VideoResponse
from app.models.state import GraphState, Intent
from app.rag.ingestion import build_collection_name

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/ask", response_model=TutorResponse)
async def ask_tutor(
    payload: TutorRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Answer a student question using the Tutor Agent, grounded in RAG context."""
    settings = get_settings()
    collection_name = payload.collection_name or build_collection_name(
        payload.country, payload.curriculum_board, payload.grade, payload.subject
    )
    state = GraphState(
        intent=Intent.TUTOR,
        user_query=payload.question,
        country=payload.country,
        curriculum_board=payload.curriculum_board,
        grade=payload.grade,
        subject=payload.subject,
        student_id=student.student_id,
        collection_name=collection_name,
    )

    graph = build_graph(db=db, upload_temp_dir=settings.upload_dir)
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Tutor graph run failed")
        raise HTTPException(500, f"Tutor request failed: {exc}") from exc

    if not result.get("tutor_answer"):
        raise HTTPException(422, "Could not generate an answer: " + "; ".join(result.get("errors", [])))

    return TutorResponse(answer=result["tutor_answer"], sources=result.get("retrieved_chunks", []))


@router.post("/video", response_model=VideoResponse)
async def request_video(
    payload: VideoRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Explicit, user-triggered request for an AI-generated explainer video.

    This is the ONLY entry point that can set `Intent.VIDEO_REQUEST` — the
    Supervisor's automatic classifier can never select this intent.
    """
    settings = get_settings()
    state = GraphState(
        intent=Intent.VIDEO_REQUEST,
        user_query=payload.context or payload.topic,
        video_topic=payload.topic,
        subject=payload.subject,
        student_id=student.student_id,
    )

    graph = build_graph(db=db, upload_temp_dir=settings.upload_dir)
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Video graph run failed")
        raise HTTPException(500, f"Video generation failed: {exc}") from exc

    if not result.get("video_url"):
        raise HTTPException(502, "; ".join(result.get("errors", ["Video generation failed"])))

    return VideoResponse(video_url=result["video_url"], topic=payload.topic)
