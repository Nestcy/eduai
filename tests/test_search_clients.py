import os
import importlib

import pytest

from search.adapter import get_search_client
import config


def test_factory_raises_on_unknown_provider():
    # Unknown provider should raise when MCP client isn't present
    importlib.reload(config)
    with pytest.raises(RuntimeError):
        get_search_client("__unknown_provider__", config)


def test_tavily_client_basic(monkeypatch, requests_mock):
    endpoint = "http://localhost:52345"
    monkeypatch.setenv("TAVILY_ENDPOINT", endpoint)
    monkeypatch.setenv("TAVILY_API_KEY", "fakekey")
    importlib.reload(config)
    client = get_search_client("tavily", config)
    requests_mock.post(f"{endpoint}/search", json={"results": [{"id":"1","title":"A"}]})
    res = client.search("A")
    assert isinstance(res, list)
    assert res[0]["id"] == "1"
