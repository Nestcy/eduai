import os

# Which provider to use: 'tavily' | 'firecrawl' | 'mcp'
SEARCH_PROVIDER = os.getenv("SEARCH_PROVIDER", "tavily").lower()

# Tavily config
TAVILY_ENDPOINT = os.getenv("TAVILY_ENDPOINT", "")  # e.g. https://api.tavily.example
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Firecrawl config
FIRECRAWL_ENDPOINT = os.getenv("FIRECRAWL_ENDPOINT", "")  # e.g. https://api.firecrawl.example
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

# MCP config (optional fallback)
MCP_ENDPOINT = os.getenv("MCP_ENDPOINT", "")
MCP_API_KEY = os.getenv("MCP_API_KEY", "")
