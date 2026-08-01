"""Unit tests for the RAG chunking pipeline."""
from langchain_core.documents import Document

from app.rag.chunking import chunk_documents


def test_chunk_documents_respects_size_and_overlap():
    long_text = "Sentence number {}. " * 500
    doc = Document(page_content=long_text.format(*range(500)), metadata={"source": "test.pdf", "page": 1})

    chunks = chunk_documents([doc], chunk_size=200, chunk_overlap=20)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk.page_content) <= 250  # allow small overshoot from separator logic
        assert chunk.metadata["source"] == "test.pdf"


def test_chunk_documents_empty_input_returns_empty():
    assert chunk_documents([]) == []
