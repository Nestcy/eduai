"""Document ingestion endpoints: upload PDFs and trigger public past-paper
discovery for a given curriculum scope.
"""
from __future__ import annotations

import os
import shutil

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import AuthenticatedStudent, get_current_student, get_settings
from app.graph.build_graph import build_graph
from app.logging_config import logger
from app.models.schemas import IngestResponse
from app.models.state import GraphState, Intent
from app.rag.ingestion import build_collection_name

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("", response_model=IngestResponse)
async def ingest_documents(
    country: str = Form(...),
    curriculum_board: str = Form(...),
    grade: str = Form(...),
    subject: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    student: AuthenticatedStudent = Depends(get_current_student),
):
    """Ingest user-uploaded PDFs and discover public past exam papers for
    the given curriculum scope. Runs the Retrieval Agent via the graph.
    """
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)

    saved_paths: list[str] = []
    for upload in files:
        if not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(400, f"Only PDF uploads are supported: {upload.filename}")
        dest = os.path.join(settings.upload_dir, upload.filename)
        with open(dest, "wb") as f:
            shutil.copyfileobj(upload.file, f)
        saved_paths.append(dest)

    collection_name = build_collection_name(country, curriculum_board, grade, subject)
    state = GraphState(
        intent=Intent.RETRIEVAL_INGEST,
        country=country,
        curriculum_board=curriculum_board,
        grade=grade,
        subject=subject,
        collection_name=collection_name,
        ingest_file_paths=saved_paths,
    )

    graph = build_graph(upload_temp_dir=settings.upload_dir)
    try:
        result = await graph.ainvoke(state)
    except Exception as exc:
        logger.exception("Ingestion graph run failed")
        raise HTTPException(500, f"Ingestion failed: {exc}") from exc

    if result.get("errors"):
        logger.warning(f"Ingestion completed with warnings: {result['errors']}")

    return IngestResponse(
        collection_name=result.get("collection_name", collection_name),
        num_chunks=0,  # exact count is logged/persisted; kept simple at API boundary
        source_files=saved_paths,
    )
