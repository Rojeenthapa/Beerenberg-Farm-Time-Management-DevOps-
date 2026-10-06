"""
Test case #99: shift creation and view per staff member

REAL VALUES (confirmed from app/routes.py and app/models.py):
  - Create:  POST /api/shifts   (admin-only via require_admin_user)
             required: employee_id, date (YYYY-MM-DD), start_time, end_time
             (HH:MM or HH:MM:SS, parsed with time.fromisoformat)
             optional: status (defaults to "Scheduled")
             end_time <= start_time -> 400 "end_time must be later than start_time"
             unknown employee_id -> 404 (via get_employee_or_404)
             success -> 201 with Shift.to_dict()
  - List:    GET /api/shifts    (require_authenticated_user)
             admin: sees all shifts, or filtered by ?employee_id=
             non-admin: always restricted to their own employee_id,
             regardless of any employee_id query param they send
             ordered by date, start_time
"""
from datetime import date

import pytest

from app.extensions import db
from app.models import Employee, User

ADMIN_LOGIN = "admin@test.com"
ADMIN_PASSWORD = "password123"
STAFF_LOGIN = "staff@test.com"
STAFF_PASSWORD = "password123"


def _seed(app):
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
        staff_user = User(login_id=STAFF_LOGIN, employee_id=staff_emp.employee_id, role="Staff")
        staff_user.set_password(STAFF_PASSWORD)
        db.session.add(staff_user)

        other_emp = Employee(
            first_name="Sam", last_name="Lee", email="sam@farm.com",
            role="Picker", contract_type="Full Time", standard_hours=38,
            pay_rate=28.5, overtime_pay_rate=35.0, status="Active", hire_date=date(2026, 1, 1),
        )
        db.session.add(other_emp)
        db.session.flush()

        ids = (staff_emp.employee_id, other_emp.employee_id)
        db.session.commit()
        return ids


@pytest.fixture
def setup(app):
    staff_id, other_id = _seed(app)
    client = app.test_client()

    admin_login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    admin_headers = {"Authorization": f"Bearer {admin_login.get_json()['access_token']}"}

    staff_login = client.post("/api/login", json={"login_id": STAFF_LOGIN, "password": STAFF_PASSWORD})
    staff_headers = {"Authorization": f"Bearer {staff_login.get_json()['access_token']}"}

    return client, admin_headers, staff_headers, staff_id, other_id


def test_admin_creates_shift_for_staff(setup):
    client, admin_headers, _, staff_id, _ = setup
    response = client.post("/api/shifts", json={
        "employee_id": staff_id,
        "date": "2026-02-02",
        "start_time": "09:00",
        "end_time": "17:00",
    }, headers=admin_headers)
    assert response.status_code == 201
    body = response.get_json()
    assert body["employee_id"] == staff_id
    assert body["start_time"] == "09:00:00"
    assert body["end_time"] == "17:00:00"
    assert body["status"] == "Scheduled"


def test_create_shift_end_before_start_rejected(setup):
    client, admin_headers, _, staff_id, _ = setup
    response = client.post("/api/shifts", json={
        "employee_id": staff_id,
        "date": "2026-02-02",
        "start_time": "17:00",
        "end_time": "09:00",
    }, headers=admin_headers)
    assert response.status_code == 400


def test_create_shift_unknown_employee_404(setup):
    client, admin_headers, _, _, _ = setup
    response = client.post("/api/shifts", json={
        "employee_id": 9999,
        "date": "2026-02-02",
        "start_time": "09:00",
        "end_time": "17:00",
    }, headers=admin_headers)
    assert response.status_code == 404


def test_create_shift_requires_admin(setup):
    client, _, staff_headers, staff_id, _ = setup
    response = client.post("/api/shifts", json={
        "employee_id": staff_id,
        "date": "2026-02-02",
        "start_time": "09:00",
        "end_time": "17:00",
    }, headers=staff_headers)
    assert response.status_code == 403


def test_admin_sees_all_shifts(setup):
    client, admin_headers, _, staff_id, other_id = setup
    client.post("/api/shifts", json={
        "employee_id": staff_id, "date": "2026-02-02",
        "start_time": "09:00", "end_time": "17:00",
    }, headers=admin_headers)
    client.post("/api/shifts", json={
        "employee_id": other_id, "date": "2026-02-03",
        "start_time": "08:00", "end_time": "16:00",
    }, headers=admin_headers)

    response = client.get("/api/shifts", headers=admin_headers)
    assert response.status_code == 200
    ids = {s["employee_id"] for s in response.get_json()}
    assert ids == {staff_id, other_id}


def test_staff_sees_only_own_shifts(setup):
    """Even if a non-admin asks for another employee's shifts via the query
    param, the view is forced back to their own employee_id."""
    client, admin_headers, staff_headers, staff_id, other_id = setup
    client.post("/api/shifts", json={
        "employee_id": staff_id, "date": "2026-02-02",
        "start_time": "09:00", "end_time": "17:00",
    }, headers=admin_headers)
    client.post("/api/shifts", json={
        "employee_id": other_id, "date": "2026-02-03",
        "start_time": "08:00", "end_time": "16:00",
    }, headers=admin_headers)

    response = client.get(f"/api/shifts?employee_id={other_id}", headers=staff_headers)
    assert response.status_code == 200
    body = response.get_json()
    assert len(body) == 1
    assert body[0]["employee_id"] == staff_id


def test_list_shifts_requires_authentication(app):
    staff_id, _ = _seed(app)
    client = app.test_client()
    response = client.get("/api/shifts")
    assert response.status_code == 401
