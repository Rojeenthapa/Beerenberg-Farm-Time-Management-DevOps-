"""
Test case #93: totals match known sample data

REAL VALUES (confirmed from app/routes.py, current main):
  - Route: GET /api/hours?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD[&employee_id=]
           (require_authenticated_user; non-admin is forced to their own
           employee_id regardless of query param)
  - calculate_worked_hours(time_log):
        gross_hours = (clock_out - clock_in).total_seconds() / 3600
        break_hours = calculate_break_hours(time_log)   # sum of each
            break's (end_time - start_time) in hours, rounded to 2dp
        worked = max(round(gross_hours - break_hours, 2), 0)
  - Only TimeLogs with clock_out IS NOT NULL and date in [from_date, to_date]
    are counted (calculate_employee_hours / the /api/hours loop both filter
    this way).
  - Response: {from_date, to_date, total_hours, total_hours_display,
               employees: [{employee_id, display_id, employee_name, role,
                             total_hours, total_hours_display}]}

WORKED EXAMPLE used below (hand-calculated, not guessed):
  Day 1: clock_in 09:00 -> clock_out 17:00 (8.0h gross), one 30-minute break
         (12:00-12:30) -> worked = 8.0 - 0.5 = 7.5h
  Day 2: clock_in 09:00 -> clock_out 13:00 (4.0h gross), no break
         -> worked = 4.0h
  Expected total for the period = 7.5 + 4.0 = 11.5h
"""
from datetime import date, datetime, time

import pytest

from app.extensions import db
from app.models import Break, Employee, TimeLog, User

ADMIN_LOGIN = "admin01"
ADMIN_PASSWORD = "password123"


def _seed_admin_and_staff_with_timelogs(app):
    with app.app_context():
        admin_emp = Employee(
            first_name="Test", last_name="Admin", email="admin@test.com",
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

        # Day 1: 09:00-17:00 with a 30-minute break -> worked 7.5h
        log1 = TimeLog(
            employee_id=staff_employee_id,
            clock_in=datetime(2026, 2, 2, 9, 0, 0),
            clock_out=datetime(2026, 2, 2, 17, 0, 0),
            date=date(2026, 2, 2),
        )
        db.session.add(log1)
        db.session.flush()
        db.session.add(Break(
            timelog_id=log1.timelog_id,
            start_time=time(12, 0, 0),
            end_time=time(12, 30, 0),
        ))

        # Day 2: 09:00-13:00, no break -> worked 4.0h
        log2 = TimeLog(
            employee_id=staff_employee_id,
            clock_in=datetime(2026, 2, 3, 9, 0, 0),
            clock_out=datetime(2026, 2, 3, 13, 0, 0),
            date=date(2026, 2, 3),
        )
        db.session.add(log2)

        # An open (still clocked-in) log should NOT be counted
        open_log = TimeLog(
            employee_id=staff_employee_id,
            clock_in=datetime(2026, 2, 4, 9, 0, 0),
            clock_out=None,
            date=date(2026, 2, 4),
        )
        db.session.add(open_log)

        db.session.commit()
        return staff_employee_id


@pytest.fixture
def setup(app):
    staff_employee_id = _seed_admin_and_staff_with_timelogs(app)
    client = app.test_client()
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, staff_employee_id


def test_hours_totals_match_known_sample_data(setup):
    client, headers, employee_id = setup
    response = client.get(
        f"/api/hours?from_date=2026-02-01&to_date=2026-02-05&employee_id={employee_id}",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_hours"] == 11.5
    assert len(body["employees"]) == 1
    assert body["employees"][0]["total_hours"] == 11.5


def test_hours_excludes_open_timelog(setup):
    """The still-open (no clock_out) log on day 3 should not add any hours."""
    client, headers, employee_id = setup
    response = client.get(
        f"/api/hours?from_date=2026-02-04&to_date=2026-02-04&employee_id={employee_id}",
        headers=headers,
    )
    body = response.get_json()
    assert body["total_hours"] == 0


def test_hours_respects_date_range(setup):
    """Narrowing the range to just day 1 should only count the 7.5h shift."""
    client, headers, employee_id = setup
    response = client.get(
        f"/api/hours?from_date=2026-02-02&to_date=2026-02-02&employee_id={employee_id}",
        headers=headers,
    )
    body = response.get_json()
    assert body["total_hours"] == 7.5


def test_hours_requires_authentication(app):
    staff_employee_id = _seed_admin_and_staff_with_timelogs(app)
    client = app.test_client()
    response = client.get(
        f"/api/hours?from_date=2026-02-01&to_date=2026-02-05&employee_id={staff_employee_id}"
    )
    assert response.status_code == 401
