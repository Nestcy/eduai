import requests
from typing import Any, Dict, List, Optional
from .adapter import SearchClient


class TavilyClient(SearchClient):
    def __init__(self, endpoint: str, api_key: Optional[str] = None, timeout: int = 10):
        if not endpoint:
            raise ValueError("TAVILY endpoint must be provided")
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self):
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def search(self, query: str, limit: int = 10, **kwargs) -> List[Dict[str, Any]]:
        payload = {"q": query, "limit": limit}
        payload.update(kwargs)
        resp = requests.post(f"{self.endpoint}/search", json=payload, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        # Normalize result structure to a list of dicts with keys like 'id','title','score','snippet'
        if isinstance(data, dict):
            return data.get("results", [])
        return data
