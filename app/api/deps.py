"""Shared FastAPI dependencies.

Railway holds no database connection -- see app/api/auth.py for JWT/JWKS
verification, which is the only "shared dependency" this stateless service needs.
"""
from app.api.auth import AuthenticatedStudent, get_current_student  # re-exported for routers
from app.config import Settings, get_settings

__all__ = ["get_settings", "Settings", "get_current_student", "AuthenticatedStudent"]
