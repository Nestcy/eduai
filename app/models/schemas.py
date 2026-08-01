"""Pydantic request/response schemas exposed at the FastAPI boundary.

Kept separate from `state.py` (internal graph state) so the public API
contract can evolve independently of internal orchestration structures.
"""
from typing import Optional

from pydantic import BaseModel, Field

from app.models.state import Flashcard, RetrievedChunk, StudyPlanEntry, TopicPerformance


class IngestResponse(BaseModel):
    collection_name: str
    num_chunks: int
    source_files: list[str]


class TutorRequest(BaseModel):
    question: str
    country: str
    curriculum_board: str
    grade: str
    subject: str
    collection_name: Optional[str] = Field(
        default=None, description="RAG collection to query; defaults to subject/board scoped collection"
    )


class TutorResponse(BaseModel):
    answer: str
    sources: list[RetrievedChunk]


class StudyPlanRequest(BaseModel):
    subject: str
    exam_date: str
    daily_minutes_available: int = 60
    topic_performance: list[TopicPerformance]


class StudyPlanResponse(BaseModel):
    student_id: str
    plan: list[StudyPlanEntry]


class FlashcardRequest(BaseModel):
    subject: str
    topic: str
    collection_name: Optional[str] = None
    num_cards: int = 15
    export_pdf: bool = True


class FlashcardResponse(BaseModel):
    flashcards: list[Flashcard]
    pdf_path: Optional[str] = None


class VideoRequest(BaseModel):
    """Explicit, user-initiated request. Never triggered automatically."""

    topic: str
    subject: str
    context: Optional[str] = None


class VideoResponse(BaseModel):
    video_url: str
    topic: str


class ProgressUpdateRequest(BaseModel):
    topic: str
    self_reported_score: float
    confidence_level: float


class CurriculumRequest(BaseModel):
    country: str
    curriculum_board: str
    grade: str
    subject: str
