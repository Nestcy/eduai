FROM python:3.11-slim

# tesseract-ocr: fallback OCR for scanned PDFs (app/rag/chunking.py)
# nodejs/npm: required to run the MCP servers (Brave Search, Firecrawl, Filesystem)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Pre-install MCP servers globally so requests don't pay an `npx -y` fetch
# cost at runtime. Update app/config.py MCP_*_CMD values to call these
# binaries directly (e.g. "mcp-server-brave-search") instead of `npx -y ...`.
RUN npm install -g \
    @modelcontextprotocol/server-brave-search \
    firecrawl-mcp \
    @modelcontextprotocol/server-filesystem

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# $PORT is injected by Railway at runtime; falls back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
