"""On-demand video generation tool.

IMPORTANT: This tool must only ever be invoked synchronously in direct
response to an explicit student request (`Intent.VIDEO_REQUEST`). It must
never be scheduled, background-triggered, or called speculatively by the
Supervisor or any other agent.
"""
from __future__ import annotations

import httpx

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()


class VideoGenerationError(RuntimeError):
    pass


async def generate_explainer_video(topic: str, subject: str, context: str | None = None) -> str:
    """Call the external video-generation API synchronously and return the video URL.

    Raises `VideoGenerationError` on failure so the calling agent/route can
    surface a clean error to the student rather than hanging silently.
    """
    if not settings.video_api_base_url or not settings.video_api_key:
        raise VideoGenerationError("Video generation API is not configured")

    payload = {"topic": topic, "subject": subject, "context": context or ""}
    headers = {"Authorization": f"Bearer {settings.video_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                f"{settings.video_api_base_url}/v1/generate", json=payload, headers=headers
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.error(f"Video generation request failed: {exc}")
        raise VideoGenerationError(str(exc)) from exc

    video_url = data.get("video_url")
    if not video_url:
        raise VideoGenerationError("Video API response missing 'video_url'")
    return video_url
