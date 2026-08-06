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
  tools/         External tool integrations (Tavily search, Firecrawl scrape,
                 ReportLab PDF export, Video-gen API client)
  api/routes/    FastAPI routers (thin — delegate to graph/agents)
  models/        Pydantic state models, API schemas
  prompts/       Centralized prompt templates per agent
  tests/         Pytest suite (unit + integration, mocked LLM/API calls)
```

## Key design decisions

- **Railway is a stateless AI service.** It holds no database credentials at
  all. Student profiles, progress, and study plans are owned entirely by the
  frontend (Lovable), which reads/writes Supabase Postgres directly with
  the logged-in student's session. Every AI request Railway receives
  carries all the context it needs (board, grade, subject, weak topics,
  self-reported scores) in the request body — it never looks anything up.
- **Auth is JWKS-based, not a shared secret.** `app/api/auth.py` verifies
  each request's bearer token against Supabase's public JWKS endpoint
  (ES256). No `SUPABASE_JWT_SECRET`/service key/DB URL is ever configured
  on Railway — see `.env.example` for the three JWKS-related vars that
  replace them.
- **Typed LangGraph state** (`app/models/state.py`) — every agent reads/writes a single
  Pydantic `GraphState`, so nodes are composable and independently testable.
- **Supervisor pattern** — a router node inspects `state.intent` (set
  explicitly by the API layer per-endpoint) and dispatches to exactly one
  specialist agent per turn.
- **Direct API integrations for external retrieval** — the Curriculum Agent and Retrieval
  Agent use Tavily (search) and Firecrawl (scrape) directly over HTTPS, wrapped behind a
  stable `tools/search_client.py` interface so the provider can be swapped without
  touching agent logic. No subprocess/MCP server management — the container is
  Python-only, which keeps builds fast and the runtime simple.
- **Video Tool Agent is strictly on-demand** — never part of the default
  supervisor routing table; only reachable via an explicit
  `intent == "video_request"` flag set by the `/tutor/video` endpoint.
- **RAG vector store lives on Railway's own volume** (FAISS/Chroma), separate
  from Supabase Postgres — it's not student data, it's shared curriculum/exam
  content, and doesn't need per-student RLS.

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
the `curriculum_sources` table (or letting Tavily/Firecrawl discover it dynamically) —
no code changes.
