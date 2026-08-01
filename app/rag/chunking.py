"""PDF text extraction (with OCR fallback) and recursive chunking.

Uses PyMuPDF for fast native text extraction. If a page yields no
extractable text (e.g. scanned image), falls back to Tesseract OCR on a
rasterized render of that page.
"""
from __future__ import annotations

import io

import fitz  # PyMuPDF
import pytesseract
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from PIL import Image

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()


def extract_text_from_pdf(file_path: str, ocr_if_needed: bool = True) -> list[Document]:
    """Extract text per page from a PDF, OCR-ing pages with no native text layer.

    Returns one LangChain `Document` per page with `source` and `page` metadata,
    ready to be chunked by `chunk_documents`.
    """
    docs: list[Document] = []
    with fitz.open(file_path) as pdf:
        for page_index, page in enumerate(pdf):
            text = page.get_text("text").strip()
            if not text and ocr_if_needed:
                logger.info(f"No native text on page {page_index} of {file_path}; running OCR")
                pix = page.get_pixmap(dpi=300)
                image = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(image).strip()
            if text:
                docs.append(
                    Document(
                        page_content=text,
                        metadata={"source": file_path, "page": page_index + 1},
                    )
                )
    return docs


def chunk_documents(
    documents: list[Document],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Document]:
    """Recursively split documents into overlapping chunks suitable for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.chunk_size,
        chunk_overlap=chunk_overlap or settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)
