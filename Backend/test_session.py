"""
Test case #42: session expiry behaviour

STATUS: Updated with real values from Backend/app/routes.py and __init__.py.
No more placeholders — confirmed directly from the repo.

REAL VALUES USED (confirmed from source):
  - Logout route:     POST /api/auth/logout (requires login, uses @login_required)
  - Current-user check: GET /api/auth/me — returns {"authenticated": false} with 401
    when not logged in, or {"authenticated": true, "admin": {...}} with 200 when logged in
  - No PERMANENT_SESSION_LIFETIME is configured in app/__init__.py, so there is no
    time-based auto-expiry — the session lasts until explicit logout (or until the
    browser session ends, since remember_me is not used by default).
    => No freeze-time/timeout test is included, since there's nothing to test;
       this is itself worth noting as a product decision / limitation for the
       Risk & Technical Debt section (no session timeout = security consideration).
"""

import pytest
from app import create_app
from app.extensions import db
from app.models import AdminUser

TEST_EMAIL = "admin@test.com"
TEST_PASSWORD = "password123"


@pytest.fixture
def app():
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    )
    with app.app_context():
        db.create_all()
        admin = AdminUser(
            email=TEST_EMAIL,
            full_name="Test Admin",
            role="Admin",
            is_active=True,
        )
        admin.set_password(TEST_PASSWORD)
        db.session.add(admin)
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _login(client):
    return client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })


def test_session_active_after_login(client):
    """GET /api/auth/me should confirm an authenticated session right after login."""
    _login(client)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.get_json()["authenticated"] is True


def test_logout_ends_session(client):
    """After logout, /api/auth/me should report not authenticated."""
    _login(client)
    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 200

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
    assert me_response.get_json()["authenticated"] is False


def test_protected_route_blocked_after_logout(client):
    """After logout, a protected route should behave as if never logged in."""
    _login(client)
    client.post("/api/auth/logout")
    response = client.get("/api/employees")
    assert response.status_code == 401
    assert response.get_json()["error"] == "Authentication required."


def test_logout_requires_active_session(client):
    """Logging out without an active session should still return 401
    (since /api/auth/logout is @login_required)."""
    response = client.post("/api/auth/logout")
    assert response.status_code == 401