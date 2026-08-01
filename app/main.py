"""FastAPI application entrypoint: wires routers, middleware, error
handlers, and startup/shutdown hooks.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import curriculum, flashcards, ingest, progress, study_plan, tutor
from app.logging_config import configure_logging, logger

configure_logging()

app = FastAPI(
    title="EduAI Platform",
    description="Multi-agent AI tutoring platform: curriculum lookup, RAG-grounded tutoring, "
    "personalized study plans, flashcard generation, and on-demand explainer videos.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(tutor.router)
app.include_router(study_plan.router)
app.include_router(flashcards.router)
app.include_router(progress.router)
app.include_router(curriculum.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
async def health_check():
    """Liveness/readiness probe."""
    return {"status": "ok"}
