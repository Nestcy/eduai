"""Tests asserting the Video Tool Agent's strict on-demand contract:
it must never be reachable via the Supervisor's automatic classification.
"""
import pytest

from app.agents.supervisor import route_from_supervisor
from app.models.state import GraphState, Intent


def test_video_intent_not_in_llm_valid_labels():
    from app.agents.supervisor import _VALID_LLM_INTENTS

    assert "video_request" not in _VALID_LLM_INTENTS


def test_route_from_supervisor_maps_video_intent_when_explicitly_set():
    state = GraphState(intent=Intent.VIDEO_REQUEST, video_topic="Photosynthesis", subject="Biology")
    assert route_from_supervisor(state) == "video_agent"


@pytest.mark.asyncio
async def test_video_agent_node_errors_without_topic():
    from app.agents.video_agent import video_agent_node

    state = GraphState(intent=Intent.VIDEO_REQUEST, subject="Biology")
    result = await video_agent_node(state)
    assert result["errors"]
    assert "video_url" not in result
