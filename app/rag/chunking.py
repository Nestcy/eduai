"""PDF text extraction (with OCR fallback) and recursive chunking.

Uses PyMuPDF for fast native text extraction. If a page yields no
extractable text (e.g. scanned image), falls back to Tesseract OCR on a
rasterized render of that page.

OCR is deliberately bounded: a large scanned document (common for past
papers and photocopied textbooks) could otherwise mean dozens of
sequential OCR passes on a single request, which is slow enough to look
like "the agent can't read this document" even though it's just still
working. `MAX_OCR_PAGES` caps how many pages get OCR'd per document, and
each page has its own timeout so one bad/huge page can't stall the rest.
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

MAX_OCR_PAGES = 40  # per document; remaining scanned pages are skipped, not failed
OCR_PAGE_TIMEOUT_SECONDS = 20


def extract_text_from_pdf(file_path: str, ocr_if_needed: bool = True) -> list[Document]:
    """Extract text per page from a PDF, OCR-ing pages with no native text layer.

    Returns one LangChain `Document` per page with `source` and `page` metadata,
    ready to be chunked by `chunk_documents`.
    """
    docs: list[Document] = []
    ocr_pages_used = 0

    with fitz.open(file_path) as pdf:
        for page_index, page in enumerate(pdf):
            text = page.get_text("text").strip()

            if not text and ocr_if_needed:
                if ocr_pages_used >= MAX_OCR_PAGES:
                    logger.warning(
                        f"Skipping OCR on page {page_index} of {file_path}: "
                        f"hit MAX_OCR_PAGES={MAX_OCR_PAGES} for this document"
                    )
                else:
                    logger.info(f"No native text on page {page_index} of {file_path}; running OCR")
                    try:
                        pix = page.get_pixmap(dpi=300)
                        image = Image.open(io.BytesIO(pix.tobytes("png")))
                        text = pytesseract.image_to_string(
                            image, timeout=OCR_PAGE_TIMEOUT_SECONDS
                        ).strip()
                        ocr_pages_used += 1
                    except RuntimeError as exc:
                        # pytesseract raises RuntimeError on its own timeout
                        logger.warning(f"OCR timed out on page {page_index} of {file_path}: {exc}")
                        text = ""
                    except Exception as exc:
                        logger.warning(f"OCR failed on page {page_index} of {file_path}: {exc}")
                        text = ""

            if text:
                docs.append(
                    Document(
                        page_content=text,
                        metadata={"source": file_path, "page": page_index + 1},
                    )
                )

    if ocr_pages_used >= MAX_OCR_PAGES:
        logger.warning(
            f"{file_path}: reached OCR page cap ({MAX_OCR_PAGES}). Some scanned pages "
            "were not indexed. Consider a higher-quality digital copy if content is missing."
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
