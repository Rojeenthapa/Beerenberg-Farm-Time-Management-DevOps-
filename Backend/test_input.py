"""
Test case #47: valid/invalid input handling

STATUS: Real values — no placeholders. Validation rules confirmed directly
from validate_employee_fields() in Backend/app/routes.py.

REAL VALUES USED:
  - Create route:    POST /api/employees (requires login)
  - Required fields: first_name, last_name, email, role, contract_type,
                      standard_hours, pay_rate, overtime_pay_rate, hire_date
  - Validation rules (from validate_employee_fields):
      first_name / last_name: 2-50 characters
      email: must contain "@" and "." after the "@"
      contract_type: must be "Casual", "Part Time", or "Full Time"
      standard_hours: 0-60
      pay_rate: > 0 and <= 999.99
      overtime_pay_rate: >= pay_rate and <= 999.99
      hire_date: must be YYYY-MM-DD
  - Missing/invalid fields -> 400 with {"error": "Validation failed.", "details": {...}}
  - Duplicate email (active employee) -> 409
  - Successful creation -> 201
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
    "phone": "0400000000",
    "role": "Picker",
    "contract_type": "Full Time",
    "standard_hours": 38,
    "pay_rate": 28.50,
    "overtime_pay_rate": 35.00,
    "hire_date": "2026-01-15",
}


def test_valid_employee_input_accepted(client):
    """A fully valid employee payload should be created with 201."""
    response = client.post("/api/employees", json=VALID_EMPLOYEE)
    assert response.status_code == 201
    assert response.get_json()["email"] == "jane.doe@farm.com"


def test_missing_required_field_rejected(client):
    """Missing a required field (e.g. role) should return 400 with details."""
    payload = {**VALID_EMPLOYEE}
    del payload["role"]
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "role" in response.get_json()["details"]


def test_name_too_short_rejected(client):
    """first_name under 2 characters should fail validation."""
    payload = {**VALID_EMPLOYEE, "first_name": "J"}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "first_name" in response.get_json()["details"]


def test_invalid_email_format_rejected(client):
    """An email without '@' or a valid domain should fail validation."""
    payload = {**VALID_EMPLOYEE, "email": "not-an-email"}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "email" in response.get_json()["details"]


def test_invalid_contract_type_rejected(client):
    """contract_type outside Casual/Part Time/Full Time should fail."""
    payload = {**VALID_EMPLOYEE, "contract_type": "Intern"}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "contract_type" in response.get_json()["details"]


def test_standard_hours_out_of_range_rejected(client):
    """standard_hours above 60 should fail validation."""
    payload = {**VALID_EMPLOYEE, "standard_hours": 70}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "standard_hours" in response.get_json()["details"]


def test_zero_pay_rate_rejected(client):
    """pay_rate must be greater than 0."""
    payload = {**VALID_EMPLOYEE, "pay_rate": 0}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "pay_rate" in response.get_json()["details"]


def test_overtime_below_pay_rate_rejected(client):
    """overtime_pay_rate must be >= pay_rate."""
    payload = {**VALID_EMPLOYEE, "pay_rate": 30.0, "overtime_pay_rate": 20.0}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "overtime_pay_rate" in response.get_json()["details"]


def test_invalid_hire_date_format_rejected(client):
    """hire_date must be YYYY-MM-DD, not any other format."""
    payload = {**VALID_EMPLOYEE, "hire_date": "15/01/2026"}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "hire_date" in response.get_json()["details"]


def test_duplicate_email_rejected(client):
    """Creating a second active employee with the same email should return 409."""
    client.post("/api/employees", json=VALID_EMPLOYEE)
    response = client.post("/api/employees", json=VALID_EMPLOYEE)
    assert response.status_code == 409


def test_create_requires_authentication(app):
    """Without logging in first, creating an employee should return 401."""
    unauthenticated_client = app.test_client()
    response = unauthenticated_client.post("/api/employees", json=VALID_EMPLOYEE)
    assert response.status_code == 401