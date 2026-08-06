FROM python:3.11-slim

# tesseract-ocr: fallback OCR for scanned PDFs (app/rag/chunking.py)
# No Node.js/npm needed -- search and scraping go through Tavily and
# Firecrawl's REST APIs directly (app/tools/search_client.py), not MCP
# server subprocesses, so the container stays Python-only.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# $PORT is injected by Railway at runtime; falls back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
