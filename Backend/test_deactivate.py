"""
Test case #56: record no longer shows as active

STATUS: Real values — no placeholders. Confirmed from deactivate_employee()
in Backend/app/routes.py.

REAL VALUES USED:
  - Deactivate route: PATCH /api/employees/<employee_id>/deactivate (requires login)
  - This is a SOFT deactivate, not a hard delete — sets status = "Inactive"
    on the existing row; the record is NOT removed from the database.
  - Already-inactive employee -> 409 ("Employee is already inactive.")
  - Not found -> 404
  - Success -> 200 with {"message": ..., "employee": {...}}
  - Deactivated employees are excluded from GET /api/employees (see test_list.py),
    which is how "no longer shows as active" is actually verified end-to-end.
"""

import pytest
from app import create_app
from app.extensions import db
from app.models import AdminUser
from datetime import date

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
    client = app.test_client()
    client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    return client


VALID_EMPLOYEE = {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@farm.com",
    "role": "Picker",
    "contract_type": "Full Time",
    "standard_hours": 38,
    "pay_rate": 28.50,
    "overtime_pay_rate": 35.00,
    "hire_date": "2026-01-15",
}


def _create_employee(client):
    response = client.post("/api/employees", json=VALID_EMPLOYEE)
    return response.get_json()["employee_id"]


def test_deactivate_sets_status_inactive(client):
    """Deactivating should set status to 'Inactive' in the response."""
    employee_id = _create_employee(client)
    response = client.patch(f"/api/employees/{employee_id}/deactivate")
    assert response.status_code == 200
    assert response.get_json()["employee"]["status"] == "Inactive"


def test_deactivated_employee_no_longer_in_list(client):
    """After deactivation, the employee should no longer appear in GET /api/employees."""
    employee_id = _create_employee(client)
    client.patch(f"/api/employees/{employee_id}/deactivate")

    list_response = client.get("/api/employees")
    ids_in_list = [e["employee_id"] for e in list_response.get_json()]
    assert employee_id not in ids_in_list


def test_deactivate_already_inactive_returns_409(client):
    """Deactivating an already-inactive employee should return 409, not succeed again."""
    employee_id = _create_employee(client)
    client.patch(f"/api/employees/{employee_id}/deactivate")
    second_attempt = client.patch(f"/api/employees/{employee_id}/deactivate")
    assert second_attempt.status_code == 409


def test_deactivate_nonexistent_employee_returns_404(client):
    """Deactivating an employee_id that doesn't exist should return 404."""
    response = client.patch("/api/employees/9999/deactivate")
    assert response.status_code == 404


def test_deactivate_requires_authentication(app):
    """Without logging in, PATCH /api/employees/<id>/deactivate should return 401."""
    unauthenticated_client = app.test_client()
    response = unauthenticated_client.patch("/api/employees/1/deactivate")
    assert response.status_code == 401
