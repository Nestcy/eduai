"""Verifies Supabase Auth JWTs on incoming requests and extracts the
authenticated user's id (`sub` claim), so route handlers never trust a
client-supplied `student_id` for anything that reads/writes that
student's data.

Frontend contract: every authenticated request must send
`Authorization: Bearer <supabase_access_token>` (the token from
`supabase.auth.getSession()` on the client). Supabase signs access tokens
with the project's JWT secret (HS256) — we verify locally without an
extra round trip to Supabase.
"""
from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.logging_config import logger

_bearer_scheme = HTTPBearer(auto_error=True)


class AuthenticatedStudent:
    """Minimal identity extracted from a verified Supabase JWT."""

    def __init__(self, student_id: str, email: str | None = None) -> None:
        self.student_id = student_id
        self.email = email


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> AuthenticatedStudent:
    """FastAPI dependency: verify the bearer token and return the caller's identity.

    Raises 401 for missing/invalid/expired tokens. Use as:
        student: AuthenticatedStudent = Depends(get_current_student)
    and use `student.student_id` instead of any client-supplied id.
    """
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        logger.error("SUPABASE_JWT_SECRET is not configured")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Auth is not configured on the server")

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired")
    except jwt.InvalidTokenError as exc:
        logger.warning(f"JWT verification failed: {exc}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject claim")

    return AuthenticatedStudent(student_id=user_id, email=payload.get("email"))
