"""Typed state shared across all LangGraph nodes.

LangGraph passes a single mutable state object between nodes. We define it
as a Pydantic model (not a TypedDict) so every agent gets validation,
defaults, and IDE support. Each agent node reads the fields it needs and
returns a partial-update dict, which LangGraph merges into this state.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class Intent(str, Enum):
    """Which specialist agent the Supervisor should route to."""

    CURRICULUM = "curriculum"
    RETRIEVAL_INGEST = "retrieval_ingest"
    TUTOR = "tutor"
    STUDY_PLAN = "study_plan"
    FLASHCARDS = "flashcards"
    VIDEO_REQUEST = "video_request"  # only ever set explicitly by the API layer
    UNKNOWN = "unknown"


class RetrievedChunk(BaseModel):
    """A single retrieved RAG chunk with provenance for citation."""

    content: str
    source: str = Field(..., description="File name or URL the chunk came from")
    page: Optional[int] = None
    score: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)


class StudentProfile(BaseModel):
    student_id: str
    country: str
    curriculum_board: str
    grade: str
    subjects: list[str] = Field(default_factory=list)


class TopicPerformance(BaseModel):
    """Self-reported / derived performance signal for one syllabus topic."""

    topic: str
    self_reported_score: float = Field(ge=0, le=100)
    confidence_level: float = Field(ge=0, le=5)
    exam_frequency_weight: float = Field(ge=0, le=1, default=0.5)
    days_since_last_review: int = 0


class StudyPlanEntry(BaseModel):
    topic: str
    priority_score: float
    recommended_minutes: int
    scheduled_date: str


class Flashcard(BaseModel):
    question: str
    answer: str
    source: Optional[str] = None
    topic: Optional[str] = None


class GraphState(BaseModel):
    """The single object threaded through the entire LangGraph run."""

    # Routing
    intent: Intent = Intent.UNKNOWN
    user_query: str = ""

    # Curriculum context (used to scope retrieval/curriculum lookups)
    country: Optional[str] = None
    curriculum_board: Optional[str] = None
    grade: Optional[str] = None
    subject: Optional[str] = None

    # Student context
    student_id: Optional[str] = None
    topic_performance: list[TopicPerformance] = Field(default_factory=list)

    # RAG
    collection_name: Optional[str] = None
    retrieved_chunks: list[RetrievedChunk] = Field(default_factory=list)
    ingest_file_paths: list[str] = Field(default_factory=list)

    # Agent outputs
    curriculum_summary: Optional[str] = None
    tutor_answer: Optional[str] = None
    study_plan: list[StudyPlanEntry] = Field(default_factory=list)
    flashcards: list[Flashcard] = Field(default_factory=list)
    flashcard_pdf_path: Optional[str] = None
    video_url: Optional[str] = None
    video_topic: Optional[str] = None

    # Bookkeeping
    errors: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"arbitrary_types_allowed": True}
