from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class SearchClient(ABC):
    @abstractmethod
    def search(self, query: str, limit: int = 10, **kwargs) -> List[Dict[str, Any]]:
        """Run a search and return a list of result dicts."""
        raise NotImplementedError


def get_search_client(provider: str, config) -> SearchClient:
    """
    Factory for creating a SearchClient.
    provider: 'tavily', 'firecrawl', or 'mcp' (fallback)
    config: module or object with endpoint/api_key attributes
    """
    provider = (provider or "").lower()
    if provider == "tavily":
        from .tavily_client import TavilyClient
        return TavilyClient(endpoint=config.TAVILY_ENDPOINT, api_key=config.TAVILY_API_KEY)
    if provider == "firecrawl":
        from .firecrawl_client import FirecrawlClient
        return FirecrawlClient(endpoint=config.FIRECRAWL_ENDPOINT, api_key=config.FIRECRAWL_API_KEY)
    # fallback: attempt to use MCP client if it exists in repo
    try:
        from .mcp_client import MCPClient  # existing client in repo (if present)
        return MCPClient(endpoint=getattr(config, "MCP_ENDPOINT", None), api_key=getattr(config, "MCP_API_KEY", None))
    except Exception:
        raise RuntimeError(f"Unknown search provider '{provider}' and MCP client missing.")
