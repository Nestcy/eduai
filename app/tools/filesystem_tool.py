"""Wrapper around the Filesystem MCP server for sandboxed file operations
(listing uploads, reading generated flashcard PDFs, etc.) so agents never
touch the raw filesystem outside the MCP-governed sandbox root
(configured via `MCP_FILESYSTEM_CMD ... ./data`).
"""
from __future__ import annotations

from app.logging_config import logger
from app.tools.mcp_client import get_mcp_client


async def list_files(directory: str = ".") -> list[str]:
    """List files under `directory` inside the MCP filesystem sandbox."""
    async with get_mcp_client("filesystem") as client:
        raw = await client.call_tool("list_directory", {"path": directory})
    return [line.strip() for line in raw.splitlines() if line.strip()]


async def read_text_file(path: str) -> str:
    async with get_mcp_client("filesystem") as client:
        return await client.call_tool("read_file", {"path": path})


async def write_text_file(path: str, content: str) -> None:
    async with get_mcp_client("filesystem") as client:
        await client.call_tool("write_file", {"path": path, "content": content})
    logger.info(f"Wrote file via Filesystem MCP: {path}")
