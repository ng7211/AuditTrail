import pytest
from fastapi.testclient import TestClient

from backend.main import app, frontend_dir


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "OK"}


@pytest.mark.skipif(not frontend_dir.is_dir(), reason="Build Angular first")
def test_frontend_is_served(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "<app-root>" in response.text


def test_unknown_endpoint_returns_not_found(client):
    assert client.get("/does-not-exist").status_code == 404
