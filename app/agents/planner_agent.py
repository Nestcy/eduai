"""Study Planner Agent: generates a personalized revision schedule.

Priority scoring blends four signals per topic:
  - weakness      = (100 - self_reported_score) / 100        [0..1, higher = weaker]
  - low_confidence = (5 - confidence_level) / 5               [0..1, higher = less confident]
  - exam_weight    = exam_topic_frequency_weight               [0..1, provided/estimated]
  - staleness      = min(days_since_last_review / 30, 1.0)     [0..1, capped at 30 days]

priority_score = 0.35*weakness + 0.25*low_confidence + 0.25*exam_weight + 0.15*staleness

Topics are then greedily allocated across the days remaining until the
exam, respecting `daily_minutes_available`, highest priority first.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from app.agents.llm import get_llm
from app.models.state import GraphState, StudyPlanEntry, TopicPerformance
from app.prompts.agent_prompts import STUDY_PLAN_EXPLANATION_PROMPT

WEIGHTS = {"weakness": 0.35, "confidence": 0.25, "exam": 0.25, "staleness": 0.15}
MIN_SESSION_MINUTES = 20
MAX_SESSION_MINUTES = 60


def compute_priority(topic: TopicPerformance) -> float:
    weakness = (100 - topic.self_reported_score) / 100
    low_confidence = (5 - topic.confidence_level) / 5
    staleness = min(topic.days_since_last_review / 30, 1.0)
    score = (
        WEIGHTS["weakness"] * weakness
        + WEIGHTS["confidence"] * low_confidence
        + WEIGHTS["exam"] * topic.exam_frequency_weight
        + WEIGHTS["staleness"] * staleness
    )
    return round(score, 4)


def allocate_schedule(
    ranked_topics: list[TopicPerformance], exam_date: date, daily_minutes: int
) -> list[StudyPlanEntry]:
    """Greedily spread highest-priority topics across the days remaining."""
    days_remaining = max((exam_date - date.today()).days, 1)
    schedule: list[StudyPlanEntry] = []

    for i, topic in enumerate(ranked_topics):
        day_offset = i % days_remaining
        scheduled_date = date.today() + timedelta(days=day_offset)
        # Weaker/higher-priority topics get more minutes, capped.
        minutes = min(
            MAX_SESSION_MINUTES,
            max(MIN_SESSION_MINUTES, int(daily_minutes * compute_priority(topic))),
        )
        schedule.append(
            StudyPlanEntry(
                topic=topic.topic,
                priority_score=compute_priority(topic),
                recommended_minutes=minutes,
                scheduled_date=scheduled_date.isoformat(),
            )
        )
    schedule.sort(key=lambda e: e.scheduled_date)
    return schedule


async def study_planner_node(state: GraphState, exam_date_str: str, daily_minutes: int = 60) -> dict:
    """LangGraph node. Requires `topic_performance` on state."""
    if not state.topic_performance:
        return {"errors": state.errors + ["No topic performance data provided for study plan"]}

    exam_date = datetime.fromisoformat(exam_date_str).date()
    ranked = sorted(state.topic_performance, key=compute_priority, reverse=True)
    plan = allocate_schedule(ranked, exam_date, daily_minutes)

    # Optional: LLM-generated human-friendly rationale (not required for the plan itself)
    llm = get_llm(temperature=0.4)
    summary_lines = "\n".join(f"- {e.topic}: priority {e.priority_score}" for e in plan[:10])
    chain = STUDY_PLAN_EXPLANATION_PROMPT | llm
    try:
        explanation = await chain.ainvoke({"subject": state.subject or "your subject", "plan_summary": summary_lines})
        rationale = explanation.content
    except Exception:
        rationale = ""

    return {"study_plan": plan, "curriculum_summary": state.curriculum_summary, "tutor_answer": rationale or state.tutor_answer}
