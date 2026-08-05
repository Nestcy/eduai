import requests
from typing import Any, Dict, List, Optional
from .adapter import SearchClient


class FirecrawlClient(SearchClient):
    def __init__(self, endpoint: str, api_key: Optional[str] = None, timeout: int = 10):
        if not endpoint:
            raise ValueError("FIRECRAWL endpoint must be provided")
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self):
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def search(self, query: str, limit: int = 10, **kwargs) -> List[Dict[str, Any]]:
        payload = {"query": query, "limit": limit}
        payload.update(kwargs)
        resp = requests.post(f"{self.endpoint}/v1/search", json=payload, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("items", [])
        return data
