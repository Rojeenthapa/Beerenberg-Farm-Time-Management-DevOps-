"""
Test case #53: update persists correctly

STATUS: Real values — no placeholders. Confirmed from update_employee() in
Backend/app/routes.py.

REAL VALUES USED:
  - Update route:  PUT /api/employees/<employee_id> (requires login)
  - Full-object update: same required fields as create (first_name, last_name,
    email, role, contract_type, standard_hours, pay_rate, overtime_pay_rate,
    hire_date) — there is no partial/PATCH update for general fields
  - Not found -> 404
  - Validation failures -> 400 (same rules as create, see test_input.py)
  - Duplicate email (used by a DIFFERENT employee) -> 409
  - Success -> 200 with updated employee.to_dict()
  - NOTE: there is no GET /api/employees/<id> single-record route, so
    "persists" is verified by re-fetching via GET /api/employees (the list).
"""

import pytest
from app import create_app
from app.extensions import db
from app.models import AdminUser, Employee
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


def _create_employee(client, overrides=None):
    payload = {**VALID_EMPLOYEE, **(overrides or {})}
    response = client.post("/api/employees", json=payload)
    return response.get_json()["employee_id"]


def test_update_persists_and_is_reflected_in_list(client):
    """Updating a field should be reflected both in the response and on re-fetch."""
    employee_id = _create_employee(client)

    updated_payload = {**VALID_EMPLOYEE, "role": "Supervisor", "pay_rate": 32.0}
    update_response = client.put(f"/api/employees/{employee_id}", json=updated_payload)
    assert update_response.status_code == 200
    assert update_response.get_json()["role"] == "Supervisor"

    list_response = client.get("/api/employees")
    updated = next(e for e in list_response.get_json() if e["employee_id"] == employee_id)
    assert updated["role"] == "Supervisor"
    assert updated["pay_rate"] == 32.0


def test_update_nonexistent_employee_returns_404(client):
    """Updating an employee_id that doesn't exist should return 404."""
    response = client.put("/api/employees/9999", json=VALID_EMPLOYEE)
    assert response.status_code == 404


def test_update_with_invalid_data_rejected(client):
    """Same validation rules as create apply to update (e.g. bad contract_type)."""
    employee_id = _create_employee(client)
    bad_payload = {**VALID_EMPLOYEE, "contract_type": "Intern"}
    response = client.put(f"/api/employees/{employee_id}", json=bad_payload)
    assert response.status_code == 400
    assert "contract_type" in response.get_json()["details"]


def test_update_to_duplicate_email_rejected(client):
    """Updating an employee to use another employee's email should return 409."""
    first_id = _create_employee(client, {"email": "first@farm.com"})
    _create_employee(client, {"email": "second@farm.com"})

    payload = {**VALID_EMPLOYEE, "email": "second@farm.com"}
    response = client.put(f"/api/employees/{first_id}", json=payload)
    assert response.status_code == 409


def test_update_requires_authentication(app):
    """Without logging in, PUT /api/employees/<id> should return 401."""
    unauthenticated_client = app.test_client()
    response = unauthenticated_client.put("/api/employees/1", json=VALID_EMPLOYEE)
    assert response.status_code == 401
