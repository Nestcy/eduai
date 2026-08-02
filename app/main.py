"""FastAPI application entrypoint: wires routers, middleware, error
handlers, and startup/shutdown hooks.

Railway is a stateless AI service: it holds no database credentials.
Student profiles, progress, and study plans are owned entirely by the
frontend (Lovable) via Supabase; this app only verifies bearer tokens
(against Supabase's public JWKS) and runs the LangGraph agents.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import curriculum, flashcards, ingest, study_plan, tutor
from app.logging_config import configure_logging, logger

configure_logging()

app = FastAPI(
    title="EduAI Platform",
    description="Stateless multi-agent AI service: curriculum lookup, RAG-grounded tutoring, "
    "personalized study plan generation, flashcard generation, and on-demand explainer videos. "
    "Called directly from the browser with the student's Supabase access token.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # locked down by JWT verification instead; tighten to known frontend origins if desired
    allow_methods=["*"],
    allow_headers=["*"],  # includes Authorization
)

app.include_router(ingest.router)
app.include_router(tutor.router)
app.include_router(study_plan.router)
app.include_router(flashcards.router)
app.include_router(curriculum.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
async def health_check():
    """Liveness/readiness probe."""
    return {"status": "ok"}
