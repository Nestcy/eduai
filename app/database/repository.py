"""Repository layer: all raw DB queries live here so agents/routes never
touch SQLAlchemy directly. Each method takes an active `Session`.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.db_models import (
    DocumentMetadataModel,
    RevisionHistoryModel,
    StudentProfileModel,
    StudyPlanModel,
    TopicProgressModel,
)


class StudentRepository:
    @staticmethod
    def get_or_create(
        db: Session, student_id: str, country: str, board: str, grade: str, subject: str
    ) -> StudentProfileModel:
        profile = db.get(StudentProfileModel, student_id)
        if profile:
            if subject not in profile.subjects:
                profile.subjects = [*profile.subjects, subject]
            return profile
        profile = StudentProfileModel(
            student_id=student_id,
            country=country,
            curriculum_board=board,
            grade=grade,
            subjects=[subject],
        )
        db.add(profile)
        db.flush()
        return profile

    @staticmethod
    def record_progress(
        db: Session, student_id: str, topic: str, subject: str, score: float, confidence: float
    ) -> TopicProgressModel:
        entry = TopicProgressModel(
            student_id=student_id,
            topic=topic,
            subject=subject,
            self_reported_score=score,
            confidence_level=confidence,
        )
        db.add(entry)
        db.flush()
        return entry

    @staticmethod
    def get_latest_progress(db: Session, student_id: str, subject: str) -> list[TopicProgressModel]:
        stmt = (
            select(TopicProgressModel)
            .where(TopicProgressModel.student_id == student_id, TopicProgressModel.subject == subject)
            .order_by(TopicProgressModel.updated_at.desc())
        )
        return list(db.scalars(stmt))

    @staticmethod
    def save_study_plan(db: Session, student_id: str, subject: str, plan_json: dict) -> StudyPlanModel:
        record = StudyPlanModel(student_id=student_id, subject=subject, plan_json=plan_json)
        db.add(record)
        db.flush()
        return record

    @staticmethod
    def log_revision(db: Session, student_id: str, topic: str, notes: str = "") -> RevisionHistoryModel:
        record = RevisionHistoryModel(student_id=student_id, topic=topic, notes=notes)
        db.add(record)
        db.flush()
        return record

    @staticmethod
    def last_reviewed_days_ago(db: Session, student_id: str, topic: str) -> int | None:
        stmt = (
            select(RevisionHistoryModel)
            .where(RevisionHistoryModel.student_id == student_id, RevisionHistoryModel.topic == topic)
            .order_by(RevisionHistoryModel.reviewed_at.desc())
            .limit(1)
        )
        row = db.scalars(stmt).first()
        if not row:
            return None
        from datetime import datetime

        return (datetime.utcnow() - row.reviewed_at).days


class DocumentRepository:
    @staticmethod
    def record_ingestion(
        db: Session, collection_name: str, source_name: str, source_type: str, num_chunks: int
    ) -> DocumentMetadataModel:
        record = DocumentMetadataModel(
            collection_name=collection_name,
            source_name=source_name,
            source_type=source_type,
            num_chunks=num_chunks,
        )
        db.add(record)
        db.flush()
        return record
