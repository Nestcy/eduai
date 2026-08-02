"""Standalone MCP connectivity smoke test — run this BEFORE trusting the
Curriculum/Retrieval agents, so failures are obvious and isolated from
LangGraph/FastAPI.

Usage:
    python -m app.tests.mcp_smoke_test brave_search
    python -m app.tests.mcp_smoke_test firecrawl
    python -m app.tests.mcp_smoke_test filesystem
    python -m app.tests.mcp_smoke_test all
"""
import asyncio
import sys

from app.tools.mcp_client import get_mcp_client


async def test_server(server: str) -> None:
    print(f"\n--- Testing MCP server: {server} ---")
    try:
        async with get_mcp_client(server) as client:
            tools = await client.list_tools()
            print(f"✅ Connected. Available tools: {tools}")

            if server == "brave_search":
                result = await client.call_tool("brave_web_search", {"query": "test", "count": 1})
                print(f"✅ Sample call succeeded, {len(result)} chars returned")
            elif server == "firecrawl":
                result = await client.call_tool(
                    "firecrawl_scrape", {"url": "https://example.com", "formats": ["markdown"]}
                )
                print(f"✅ Sample scrape succeeded, {len(result)} chars returned")
            elif server == "filesystem":
                result = await client.call_tool("list_directory", {"path": "."})
                print(f"✅ Sample list succeeded:\n{result}")
    except Exception as exc:
        print(f"❌ {server} failed: {exc}")


async def main() -> None:
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    servers = ["brave_search", "firecrawl", "filesystem"] if target == "all" else [target]
    for server in servers:
        await test_server(server)


if __name__ == "__main__":
    asyncio.run(main())
