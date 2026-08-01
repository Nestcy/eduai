"""Database connectivity: SQLAlchemy engine/session for Postgres (Supabase),
plus a thin Supabase client for storage/auth features if needed later.
"""
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from supabase import Client, create_client

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()

_engine = create_engine(settings.supabase_db_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


@contextmanager
def get_db_session() -> Iterator[Session]:
    """Context-managed SQLAlchemy session; use via FastAPI `Depends(get_db)`."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("DB session rolled back due to error")
        raise
    finally:
        session.close()


def get_db() -> Iterator[Session]:
    """FastAPI dependency wrapper around `get_db_session`."""
    with get_db_session() as session:
        yield session


_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a cached Supabase client (for storage/auth, not primary CRUD)."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY not configured")
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase_client
