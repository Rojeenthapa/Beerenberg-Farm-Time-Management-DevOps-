"""
Test case #51: list displays correctly

STATUS: Real values — no placeholders. Confirmed from list_employees() in
Backend/app/routes.py.

REAL VALUES USED:
  - List route:   GET /api/employees (requires login)
  - Response:     plain JSON array (NOT wrapped in {"employees": [...]})
  - Filtering:    only employees with status == "Active" are returned
                  (deactivated employees are silently excluded, not marked
                  inactive in the response)
  - Ordering:     ordered by employee_id ascending
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


def _seed_employee(app, status="Active", email="staff1@farm.com", name="Jane"):
    with app.app_context():
        employee = Employee(
            first_name=name,
            last_name="Doe",
            email=email,
            role="Picker",
            contract_type="Full Time",
            standard_hours=38,
            pay_rate=28.50,
            overtime_pay_rate=35.00,
            status=status,
            hire_date=date(2026, 1, 15),
        )
        db.session.add(employee)
        db.session.commit()
        return employee.employee_id


def test_list_empty_when_no_employees(client):
    """With no employees seeded, the list should return an empty array."""
    response = client.get("/api/employees")
    assert response.status_code == 200
    assert response.get_json() == []


def test_list_displays_seeded_employees(client, app):
    """Seeded active employees should appear in the list with correct fields."""
    _seed_employee(app, email="staff1@farm.com", name="Jane")
    _seed_employee(app, email="staff2@farm.com", name="John")

    response = client.get("/api/employees")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    names = [emp["first_name"] for emp in data]
    assert "Jane" in names and "John" in names


def test_list_excludes_inactive_employees(client, app):
    """Deactivated (status='Inactive') employees should NOT appear in the list."""
    _seed_employee(app, status="Active", email="active@farm.com", name="Active")
    _seed_employee(app, status="Inactive", email="inactive@farm.com", name="Inactive")

    response = client.get("/api/employees")
    data = response.get_json()
    names = [emp["first_name"] for emp in data]
    assert "Active" in names
    assert "Inactive" not in names
    assert len(data) == 1


def test_list_ordered_by_employee_id(client, app):
    """Employees should be returned in ascending employee_id order."""
    first_id = _seed_employee(app, email="first@farm.com", name="First")
    second_id = _seed_employee(app, email="second@farm.com", name="Second")

    response = client.get("/api/employees")
    data = response.get_json()
    returned_ids = [emp["employee_id"] for emp in data]
    assert returned_ids == sorted(returned_ids)
    assert returned_ids[0] == first_id
    assert returned_ids[1] == second_id


def test_list_requires_authentication(app):
    """Without logging in, GET /api/employees should return 401."""
    unauthenticated_client = app.test_client()
    response = unauthenticated_client.get("/api/employees")
    assert response.status_code == 401