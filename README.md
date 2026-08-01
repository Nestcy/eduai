# EduAI Platform

A production-ready, multi-agent educational AI platform built with **FastAPI**, **LangGraph**,
**LangChain**, and **ChatGroq**. A Supervisor Agent orchestrates six specialized agents
(Curriculum, Retrieval/RAG, Tutor, Study Planner, Flashcard, Video Tool) to deliver
personalized, citation-grounded tutoring for any country / curriculum / grade / subject.

## Architecture

```
app/
  agents/        LangGraph node implementations (one class per agent)
  graph/         LangGraph StateGraph wiring + Supervisor routing logic
  rag/           Ingestion pipeline, chunking, vector store management
  tools/         External tool integrations (MCP: Brave Search, Firecrawl,
                 Filesystem; ReportLab PDF export; Video-gen API client)
  api/routes/    FastAPI routers (thin — delegate to graph/agents)
  models/        Pydantic state models, DB models, API schemas
  prompts/       Centralized prompt templates per agent
  database/      Supabase (Postgres) client + repositories
  tests/         Pytest suite (unit + integration, mocked LLM/MCP calls)
```

## Key design decisions

- **Typed LangGraph state** (`app/models/state.py`) — every agent reads/writes a single
  Pydantic `GraphState`, so nodes are composable and independently testable.
- **Supervisor pattern** — a router node inspects `state.intent` (set by a lightweight
  ChatGroq classification call or explicit API `mode` field) and dispatches to exactly
  one specialist agent per turn, matching LangGraph's supervisor-worker convention.
- **MCP-first external retrieval** — the Curriculum Agent and Retrieval Agent prefer
  MCP tools (Brave Search MCP, Firecrawl MCP, Filesystem MCP) over ad-hoc HTTP calls,
  wrapped behind a stable `tools/mcp_client.py` interface so the underlying MCP servers
  can be swapped without touching agent logic.
- **Video Tool Agent is strictly on-demand** — it is never part of the default
  supervisor routing table; it is only reachable via an explicit
  `intent == "video_request"` flag set by the `/tutor/video` endpoint, and it never
  runs as a background/async job.
- **RAG pipeline is reusable** — `rag/ingestion.py` is a standalone pipeline any agent
  or endpoint can call (`ingest_pdf(path, metadata)`), independent of the graph.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in secrets
uvicorn app.main:app --reload
```

## Extending to a new subject / exam board

No architectural changes needed — the Curriculum Agent and Retrieval Agent accept
`country`, `board`, `grade`, `subject` as free-form parameters and use them purely as
metadata filters and search-query parameters. Adding a new board means adding a row to
the `curriculum_sources` table (or letting Firecrawl/Brave discover it dynamically) —
no code changes.
