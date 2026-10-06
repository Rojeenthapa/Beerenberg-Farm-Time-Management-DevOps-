"""
Test case #88: valid clock-in/out, duplicate clock-in rejected

REAL VALUES (confirmed from app/routes.py):
  - Clock in:   POST /api/timelogs/clock-in  (admin can pass employee_id in body;
                a non-admin staff user clocks themselves in automatically)
  - Clock out:  POST /api/timelogs/<timelog_id>/clock-out
  - Duplicate clock-in (an open log with clock_out is None already exists)
    -> 409 "This employee is already clocked in"
  - Clock-out on an already-closed log -> 409 "This time log is already closed"
  - Success: clock-in -> 201 with TimeLog.to_dict(); clock-out -> 200
"""
from datetime import date

import pytest

from app.extensions import db
from app.models import Employee, User

ADMIN_LOGIN = "admin@test.com"
ADMIN_PASSWORD = "password123"


def _seed_admin_and_staff(app):
    with app.app_context():
        admin_emp = Employee(
            first_name="Test", last_name="Admin", email=ADMIN_LOGIN,
            role="Admin", contract_type="Full Time", standard_hours=38,
            pay_rate=0, overtime_pay_rate=0, status="Active", hire_date=date(2026, 1, 1),
        )
        db.session.add(admin_emp)
        db.session.flush()
        admin_user = User(login_id=ADMIN_LOGIN, employee_id=admin_emp.employee_id, role="Admin")
        admin_user.set_password(ADMIN_PASSWORD)
        db.session.add(admin_user)

        staff_emp = Employee(
            first_name="Jane", last_name="Doe", email="jane@farm.com",
            role="Picker", contract_type="Full Time", standard_hours=38,
            pay_rate=28.5, overtime_pay_rate=35.0, status="Active", hire_date=date(2026, 1, 1),
        )
        db.session.add(staff_emp)
        db.session.flush()
        staff_employee_id = staff_emp.employee_id

        db.session.commit()
        return staff_employee_id


@pytest.fixture
def setup(app):
    staff_employee_id = _seed_admin_and_staff(app)
    client = app.test_client()
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, staff_employee_id


def test_clock_in_success(setup):
    client, headers, employee_id = setup
    response = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    assert response.status_code == 201
    body = response.get_json()
    assert body["employee_id"] == employee_id
    assert body["clock_out"] is None


def test_duplicate_clock_in_rejected(setup):
    client, headers, employee_id = setup
    client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    second = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    assert second.status_code == 409


def test_clock_out_success(setup):
    client, headers, employee_id = setup
    clock_in = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    timelog_id = clock_in.get_json()["timelog_id"]

    clock_out = client.post(f"/api/timelogs/{timelog_id}/clock-out", headers=headers)
    assert clock_out.status_code == 200
    assert clock_out.get_json()["clock_out"] is not None


def test_clock_out_already_closed_rejected(setup):
    client, headers, employee_id = setup
    clock_in = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    timelog_id = clock_in.get_json()["timelog_id"]
    client.post(f"/api/timelogs/{timelog_id}/clock-out", headers=headers)

    second_clock_out = client.post(f"/api/timelogs/{timelog_id}/clock-out", headers=headers)
    assert second_clock_out.status_code == 409


def test_clock_in_after_clock_out_allowed(setup):
    """A new clock-in should be allowed once the previous log is closed —
    duplicate rejection only applies to an OPEN log."""
    client, headers, employee_id = setup
    first_in = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    client.post(f"/api/timelogs/{first_in.get_json()['timelog_id']}/clock-out", headers=headers)

    second_in = client.post("/api/timelogs/clock-in", json={"employee_id": employee_id}, headers=headers)
    assert second_in.status_code == 201


def test_clock_in_requires_authentication(app):
    staff_employee_id = _seed_admin_and_staff(app)
    client = app.test_client()
    response = client.post("/api/timelogs/clock-in", json={"employee_id": staff_employee_id})
    assert response.status_code == 401
