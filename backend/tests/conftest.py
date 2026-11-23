import os
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ.update({
    "DATABASE_URL": f"sqlite:///{Path(tempfile.mkdtemp(prefix='cognipick-test-'), 'test.db').as_posix()}",
    "JWT_SECRET_KEY": "test-secret-key-for-pytest-only-0123456789", "ADMIN_SECRET_KEY": "real-admin-key-for-tests",
    "ENABLE_TEST_LOGIN": "true", "GEMINI_API_KEY": "",
})

from fastapi.testclient import TestClient  # noqa: E402

from backend.app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def _h(client, role):
    return {"Authorization": f"Bearer {client.post('/api/auth/test-login', json={'role': role}).json()['access_token']}"}


@pytest.fixture(scope="session")
def learner(client):
    return _h(client, "learner")


@pytest.fixture(scope="session")
def readonly(client):
    return _h(client, "admin_readonly")


@pytest.fixture(scope="session")
def company(client):
    return _h(client, "company")


@pytest.fixture(scope="session")
def admin(client):
    res = client.post("/api/auth/admin-login", json={"key": "real-admin-key-for-tests"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}
