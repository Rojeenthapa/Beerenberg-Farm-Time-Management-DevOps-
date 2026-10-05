"""
Test case #39: login success/failure, access control

STATUS: Updated with real values from Backend/app/routes.py and models.py.
No more placeholders — confirmed directly from the repo.

REAL VALUES USED (confirmed from source):
  - App factory:        create_app() in Backend/app/__init__.py (NOT a plain `app` import)
  - Login route:        POST /api/auth/login
  - Logout route:       POST /api/auth/logout
  - Current-user route: GET  /api/auth/me
  - Payload fields:     "email", "password" (NOT "username")
  - Success status:     200
  - Failure status:     401
  - Auth mechanism:     Flask-Login (login_user/logout_user/@login_required)
  - Unauthorized access returns: 401 JSON {"error": "Authentication required."}
    (NOT a redirect)
  - Protected route used for access-control test: GET /api/employees
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


def test_login_success(client):
    """Valid email/password should log the admin in with 200."""
    response = client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert response.status_code == 200
    assert response.get_json()["message"] == "Login successful."


def test_login_failure_wrong_password(client):
    """Wrong password should return 401 with no session created."""
    response = client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": "wrongpassword",
    })
    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password."


def test_login_failure_missing_fields(client):
    """Missing email/password should return 400, not 401."""
    response = client.post("/api/auth/login", json={"email": TEST_EMAIL})
    assert response.status_code == 400


def test_access_control_blocks_unauthenticated_user(client):
    """Protected routes should reject requests with no active session."""
    response = client.get("/api/employees")
    assert response.status_code == 401
    assert response.get_json()["error"] == "Authentication required."


def test_access_control_allows_authenticated_user(client):
    """After logging in, the same protected route should succeed."""
    client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    response = client.get("/api/employees")
    assert response.status_code == 200