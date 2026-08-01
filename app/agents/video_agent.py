"""Video Tool Agent: calls the external video-generation API.

STRICT CONTRACT: This node must only be reached via an explicit
`Intent.VIDEO_REQUEST`, set exclusively by the `/tutor/video` endpoint in
direct response to a user action. It is intentionally excluded from the
Supervisor's default routing table (see `graph/build_graph.py`) so it can
never fire automatically or in the background.
"""
from __future__ import annotations

from app.logging_config import logger
from app.models.state import GraphState
from app.tools.video_tool import VideoGenerationError, generate_explainer_video


async def video_agent_node(state: GraphState) -> dict:
    """LangGraph node. Requires `video_topic` and `subject` on state."""
    if not state.video_topic:
        return {"errors": state.errors + ["Video agent invoked without a topic"]}

    try:
        url = await generate_explainer_video(
            topic=state.video_topic, subject=state.subject or "", context=state.user_query
        )
        return {"video_url": url}
    except VideoGenerationError as exc:
        logger.error(f"Video generation failed: {exc}")
        return {"errors": state.errors + [f"Video generation failed: {exc}"]}
