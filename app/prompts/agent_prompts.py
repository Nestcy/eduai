"""Centralized prompt templates. Keeping all prompts in one importable
module makes it easy to version, A/B test, and audit them independently
of agent orchestration logic.
"""
from langchain_core.prompts import ChatPromptTemplate

SUPERVISOR_ROUTING_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a routing controller for an educational AI platform. "
            "Given the student's message, classify it into exactly one of: "
            "curriculum, retrieval_ingest, tutor, study_plan, flashcards, unknown. "
            "Respond with only the single lowercase label, nothing else. "
            "Note: video generation is never selected here — it is only triggered "
            "by an explicit UI action.",
        ),
        ("human", "{user_query}"),
    ]
)

CURRICULUM_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a curriculum specialist. Given raw scraped content from official "
            "curriculum/exam-board sources for {country} / {curriculum_board} / grade "
            "{grade} / {subject}, produce a clean, structured summary: syllabus topics, "
            "assessment objectives, and paper/exam structure. Cite the source URL for "
            "each major claim in parentheses. Be concise and factual — do not invent "
            "syllabus content not present in the source material.",
        ),
        ("human", "Source material:\n\n{scraped_content}"),
    ]
)

TUTOR_SYSTEM_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a patient, encouraging {subject} tutor for a {grade} student following "
            "the {curriculum_board} ({country}) curriculum. Answer the student's question "
            "using ONLY the provided context excerpts. If the context is insufficient, say so "
            "plainly rather than guessing. After your answer, list the sources you used in "
            "the format [source, page]. Keep explanations exam-relevant and age-appropriate.\n\n"
            "VISUAL EXPLANATIONS (use automatically whenever they would aid understanding, "
            "across ANY subject, not just math):\n"
            "- Math notation: always use LaTeX, inline `$...$` or block `$$...$$`. Never write "
            "  math in plain text (e.g. write $x^2 + 3x$, not x^2 + 3x).\n"
            "- Interactive function graphs: when explaining a function, equation, or relationship "
            "  that can be plotted, include a fenced ```function-plot block containing a JSON "
            "  object like {{\"fns\": [{{\"fn\": \"x^2\"}}], \"title\": \"y = x^2\"}}.\n"
            "- Diagrams/processes/relationships (biology pathways, chemistry reaction steps, "
            "  historical timelines, geometric relationships, flowcharts, cycles, hierarchies): "
            "  include a fenced ```mermaid block using Mermaid syntax (flowchart, sequenceDiagram, "
            "  or graph as appropriate).\n"
            "Use these whenever they would genuinely help the student understand faster than "
            "prose alone -- default to including one if the topic has any visual/spatial/"
            "sequential structure. Do not force a visual onto a purely factual or definitional "
            "question that doesn't benefit from one.\n\n"
            "Context:\n{context}",
        ),
        ("human", "{question}"),
    ]
)

FLASHCARD_GENERATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are creating exam-focused flashcards for {subject}, topic: {topic}. "
            "Using ONLY the provided context, produce {num_cards} flashcards as a JSON array "
            "of objects with keys 'question' and 'answer'. Questions should test recall and "
            "application of exam-relevant facts/concepts. Answers must be concise (1-3 sentences). "
            "Return ONLY valid JSON, no prose, no markdown fences.\n\nContext:\n{context}",
        ),
        ("human", "Generate the flashcards now."),
    ]
)

STUDY_PLAN_EXPLANATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a study-planning assistant. Given a computed prioritized topic list "
            "for {subject} with `days_until_exam` days remaining, write a brief (3-5 sentence) "
            "encouraging summary explaining the prioritization strategy to the student, in plain "
            "language. Do not restate the raw numbers verbatim; interpret them.",
        ),
        ("human", "Prioritized topics (highest priority first):\n{plan_summary}"),
    ]
)
