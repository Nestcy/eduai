"""Unit tests for the Study Planner Agent's priority scoring and scheduling."""
from datetime import date, timedelta

from app.agents.planner_agent import allocate_schedule, compute_priority
from app.models.state import TopicPerformance


def test_weaker_topic_scores_higher_priority():
    weak = TopicPerformance(
        topic="Thermodynamics", self_reported_score=40, confidence_level=1,
        exam_frequency_weight=0.8, days_since_last_review=20,
    )
    strong = TopicPerformance(
        topic="Kinematics", self_reported_score=90, confidence_level=4,
        exam_frequency_weight=0.8, days_since_last_review=2,
    )
    assert compute_priority(weak) > compute_priority(strong)


def test_priority_score_within_bounds():
    topic = TopicPerformance(
        topic="X", self_reported_score=0, confidence_level=0,
        exam_frequency_weight=1.0, days_since_last_review=100,
    )
    score = compute_priority(topic)
    assert 0.0 <= score <= 1.0


def test_allocate_schedule_spreads_across_days():
    topics = [
        TopicPerformance(topic=f"Topic {i}", self_reported_score=50, confidence_level=2,
                          exam_frequency_weight=0.5, days_since_last_review=5)
        for i in range(6)
    ]
    exam_date = date.today() + timedelta(days=3)
    schedule = allocate_schedule(topics, exam_date, daily_minutes=60)

    assert len(schedule) == 6
    scheduled_dates = {entry.scheduled_date for entry in schedule}
    assert len(scheduled_dates) <= 3  # spread across at most `days_remaining` distinct days
    for entry in schedule:
        assert 20 <= entry.recommended_minutes <= 60
