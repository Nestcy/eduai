"""Shared FastAPI dependencies."""
from app.api.auth import AuthenticatedStudent, get_current_student  # re-exported for routers
from app.config import Settings, get_settings
from app.database.supabase_client import get_db  # re-exported for routers

__all__ = ["get_db", "get_settings", "Settings", "get_current_student", "AuthenticatedStudent"]
