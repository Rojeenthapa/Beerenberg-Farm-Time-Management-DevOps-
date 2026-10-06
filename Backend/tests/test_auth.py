"""
Replaces test_login.py + test_session.py (old AdminUser/email+session auth,
now broken since the rewrite). Covers #39 (login success/failure, access
control) and #42 (session/token behaviour) against the REAL JWT backend.

REAL VALUES (confirmed from app/routes.py, current main):
  - Login:   POST /api/login   body: {login_id, password}
             -> 200 {message, access_token, expires_in_seconds: 1800, user}
             -> 401 {"error": "Invalid user ID or password"} wrong id/password
             -> 400 missing login_id/password
             -> 403 if the employee's status != "Active"
  - Me:      GET /api/me  (Authorization: Bearer <token> OR X-User-Id header)
             -> 401 {"error": "Authentication required or token expired"} if absent/invalid
  - Logout:  POST /api/logout -> 200, stateless no-op (JWT is not blacklisted)
"""
from datetime import date

import pytest

from app.extensions import db
from app.models import Employee, User

ADMIN_LOGIN = "admin01"
ADMIN_PASSWORD = "password123"


def _seed_admin(app, status="Active"):
    with app.app_context():
        employee = Employee(
            first_name="Test", last_name="Admin", email="admin@test.com",
            role="Admin", contract_type="Full Time", standard_hours=38,
            pay_rate=0, overtime_pay_rate=0, status=status, hire_date=date(2026, 1, 1),
        )
        db.session.add(employee)
        db.session.flush()
        user = User(login_id=ADMIN_LOGIN, employee_id=employee.employee_id, role="Admin")
        user.set_password(ADMIN_PASSWORD)
        db.session.add(user)
        db.session.commit()


@pytest.fixture
def client(app):
    _seed_admin(app)
    return app.test_client()


def test_login_success(client):
    response = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    assert response.status_code == 200
    body = response.get_json()
    assert "access_token" in body
    assert body["expires_in_seconds"] == 1800
    assert body["user"]["login_id"] == ADMIN_LOGIN


def test_login_wrong_password(client):
    response = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": "wrongpassword"})
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post("/api/login", json={"login_id": "nobody", "password": "password123"})
    assert response.status_code == 401


def test_login_missing_fields(client):
    response = client.post("/api/login", json={"login_id": ADMIN_LOGIN})
    assert response.status_code == 400


def test_login_inactive_employee_rejected(app):
    with app.app_context():
        employee = Employee(
            first_name="Old", last_name="Staff", email="old@test.com",
            role="Picker", contract_type="Full Time", standard_hours=38,
            pay_rate=25, overtime_pay_rate=30, status="Inactive", hire_date=date(2026, 1, 1),
        )
        db.session.add(employee)
        db.session.flush()
        user = User(login_id="oldstaff", employee_id=employee.employee_id, role="Staff")
        user.set_password(ADMIN_PASSWORD)
        db.session.add(user)
        db.session.commit()

    client = app.test_client()
    response = client.post("/api/login", json={"login_id": "oldstaff", "password": ADMIN_PASSWORD})
    assert response.status_code == 403


def test_access_control_blocks_unauthenticated_user(client):
    response = client.get("/api/me")
    assert response.status_code == 401


def test_access_control_allows_valid_token(client):
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.get_json()["login_id"] == ADMIN_LOGIN


def test_access_control_rejects_garbage_token(client):
    response = client.get("/api/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_logout_returns_200(client):
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    response = client.post("/api/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_logout_does_not_invalidate_token(client):
    """Documents real, current behaviour: logout is a stateless no-op, so the
    same token still works afterward. This is a known limitation, called out
    on the Technical Debt slide, not a bug this test is meant to catch."""
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/logout", headers=headers)
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 200
