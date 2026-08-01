"""Flashcard generation + PDF export endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedStudent, get_current_student, get_db, get_settings
from app.graph.build_graph import build_graph
from app.logging_config import logger
from app.models.schemas import FlashcardRequest, FlashcardResponse
from app.models.state import GraphState, Intent
from app.rag.ingestion import build_collection_name

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post("", response_model=FlashcardResponse)
async def generate_flashcards(
    payload: FlashcardRequest,
    db: Session = Depends(get_db),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Generate flashcards for a topic from retrieved content, optionally exporting a PDF."""
    settings = get_settings()
    collection_name = payload.collection_name or build_collection_name(
        "any", "any", "any", payload.subject
    )
    state = GraphState(
        intent=Intent.FLASHCARDS,
        user_query=payload.topic,
        subject=payload.subject,
        student_id=student.student_id,
        collection_name=collection_name,
    )

    graph = build_graph(
        db=db,
        upload_temp_dir=settings.upload_dir,
        num_flashcards=payload.num_cards,
        export_pdf=payload.export_pdf,
    )
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Flashcard graph run failed")
        raise HTTPException(500, f"Flashcard generation failed: {exc}") from exc

    if not result.get("flashcards"):
        raise HTTPException(422, "; ".join(result.get("errors", ["Could not generate flashcards"])))

    return FlashcardResponse(
        flashcards=result["flashcards"], pdf_path=result.get("flashcard_pdf_path")
    )


@router.get("/download")
async def download_flashcard_pdf(path: str):
    """Download a previously generated flashcard PDF pack."""
    return FileResponse(path, media_type="application/pdf", filename=path.split("/")[-1])
