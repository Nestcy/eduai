"""SQLAlchemy ORM models mapped to Supabase Postgres tables.

These mirror the DDL in `app/database/schema.sql`. Using SQLAlchemy Core/ORM
(rather than the Supabase Python client for reads/writes) gives typed
queries and easy migration to Alembic later, while Supabase is still used
for auth/storage where convenient.
"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class StudentProfileModel(Base):
    __tablename__ = "student_profiles"

    student_id: Mapped[str] = mapped_column(String, primary_key=True)
    country: Mapped[str] = mapped_column(String)
    curriculum_board: Mapped[str] = mapped_column(String)
    grade: Mapped[str] = mapped_column(String)
    subjects: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TopicProgressModel(Base):
    __tablename__ = "topic_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.student_id"))
    topic: Mapped[str] = mapped_column(String)
    subject: Mapped[str] = mapped_column(String)
    self_reported_score: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[float] = mapped_column(Float)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class StudyPlanModel(Base):
    __tablename__ = "study_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.student_id"))
    subject: Mapped[str] = mapped_column(String)
    plan_json: Mapped[dict] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RevisionHistoryModel(Base):
    __tablename__ = "revision_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.student_id"))
    topic: Mapped[str] = mapped_column(String)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[str] = mapped_column(Text, default="")


class DocumentMetadataModel(Base):
    """Metadata for every ingested source (uploaded PDF or scraped page)."""

    __tablename__ = "document_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_name: Mapped[str] = mapped_column(String, index=True)
    source_name: Mapped[str] = mapped_column(String)
    source_type: Mapped[str] = mapped_column(String)  # "upload" | "web" | "official_curriculum"
    num_chunks: Mapped[int] = mapped_column(Integer)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
