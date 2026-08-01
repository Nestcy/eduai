"""Thin async wrapper around the official `mcp` Python SDK for talking to
stdio-based MCP servers (Brave Search, Firecrawl, Filesystem).

Design goals:
- One `MCPToolClient` per server, opened lazily and cached per-process.
- Agents call `await client.call_tool(name, arguments)` and get back plain
  Python data (str/dict), never raw MCP protocol objects — so agent code
  stays MCP-implementation-agnostic and easy to unit test with mocks.
"""
from __future__ import annotations

import shlex
from contextlib import AsyncExitStack
from functools import lru_cache
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from app.logging_config import logger


class MCPToolClient:
    """Manages a single MCP server subprocess + session lifecycle."""

    def __init__(self, command_line: str, env: dict[str, str] | None = None) -> None:
        parts = shlex.split(command_line)
        self._params = StdioServerParameters(command=parts[0], args=parts[1:], env=env)
        self._stack: AsyncExitStack | None = None
        self._session: ClientSession | None = None

    async def __aenter__(self) -> "MCPToolClient":
        self._stack = AsyncExitStack()
        read, write = await self._stack.enter_async_context(stdio_client(self._params))
        self._session = await self._stack.enter_async_context(ClientSession(read, write))
        await self._session.initialize()
        return self

    async def __aexit__(self, *exc_info) -> None:
        if self._stack:
            await self._stack.aclose()

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Invoke an MCP tool by name and return its text content concatenated."""
        assert self._session is not None, "MCPToolClient must be used as an async context manager"
        try:
            result = await self._session.call_tool(tool_name, arguments)
            text_parts = [c.text for c in result.content if getattr(c, "type", None) == "text"]
            return "\n".join(text_parts)
        except Exception as exc:
            logger.error(f"MCP tool call '{tool_name}' failed: {exc}")
            raise

    async def list_tools(self) -> list[str]:
        assert self._session is not None
        resp = await self._session.list_tools()
        return [t.name for t in resp.tools]


@lru_cache
def _server_command(server: str) -> str:
    from app.config import get_settings

    settings = get_settings()
    mapping = {
        "brave_search": settings.mcp_brave_search_cmd,
        "firecrawl": settings.mcp_firecrawl_cmd,
        "filesystem": settings.mcp_filesystem_cmd,
    }
    cmd = mapping.get(server, "")
    if not cmd:
        raise RuntimeError(f"MCP server '{server}' has no command configured in .env")
    return cmd


def get_mcp_client(server: str, env: dict[str, str] | None = None) -> MCPToolClient:
    """Factory returning a fresh (not-yet-connected) client for a named MCP server.

    `server` is one of: "brave_search", "firecrawl", "filesystem".
    Use as: `async with get_mcp_client("brave_search") as client: ...`
    """
    return MCPToolClient(_server_command(server), env=env)
