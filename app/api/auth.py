"""Verifies Supabase Auth JWTs on incoming requests using Supabase's public
JWKS endpoint, and extracts the authenticated user's id (`sub` claim).

Railway holds no Supabase secrets at all -- verification uses Supabase's
published public keys (ES256), the same trust model as any OAuth resource
server. Frontend contract: every authenticated request must send
`Authorization: Bearer <supabase_access_token>`.
"""
from __future__ import annotations

from functools import lru_cache

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


@lru_cache
def _get_jwks_client() -> jwt.PyJWKClient:
    """Cached JWKS client -- fetches and caches Supabase's public signing keys."""
    settings = get_settings()
    return jwt.PyJWKClient(settings.supabase_jwks_url)


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> AuthenticatedStudent:
    """FastAPI dependency: verify the bearer token against Supabase's JWKS
    endpoint and return the caller's identity.

    Raises 401 for missing/invalid/expired tokens. Use as:
        student: AuthenticatedStudent = Depends(get_current_student)
    """
    settings = get_settings()
    token = credentials.credentials

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=settings.supabase_audience,
            issuer=settings.supabase_issuer,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired")
    except jwt.PyJWKClientError as exc:
        logger.error(f"Could not fetch/match Supabase JWKS: {exc}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Auth verification is misconfigured")
    except jwt.InvalidTokenError as exc:
        logger.warning(f"JWT verification failed: {exc}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject claim")

    return AuthenticatedStudent(student_id=user_id, email=payload.get("email"))
