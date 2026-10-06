"""
Test case #104: calculations checked against worked examples

REAL VALUES (confirmed from app/routes.py, current main):
  - Route: GET /api/payroll?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD
                            [&employee_id=]
           (require_authenticated_user; non-admin forced to own employee_id)
  - calculate_payroll_amounts(employee, total_hours):
        regular_hours  = min(total_hours, employee.standard_hours)
        overtime_hours = max(total_hours - employee.standard_hours, 0)
        regular_pay    = round(regular_hours * employee.pay_rate, 2)
        overtime_pay   = round(overtime_hours * employee.overtime_pay_rate, 2)
        gross_pay      = regular_pay + overtime_pay
  - total_hours per employee comes from calculate_employee_hours(), which
    sums calculate_worked_hours() across all closed TimeLogs in the period
    (same break-deduction logic as /api/hours, verified in test_hours.py).

WORKED EXAMPLE used below (hand-calculated, not guessed):
  Employee: standard_hours=38, pay_rate=20.00, overtime_pay_rate=30.00
  Two closed TimeLogs in the period:
    Day 1: 08:00-18:00 (10.0h gross), no break -> 10.0h worked
    Day 2: 08:00-18:00 (10.0h gross), no break -> 10.0h worked
    Day 3: 08:00-18:00 (10.0h gross), no break -> 10.0h worked
    Day 4: 08:00-18:00 (10.0h gross), no break -> 10.0h worked
  Total worked hours = 40.0h
  regular_hours  = min(40.0, 38) = 38.0  -> regular_pay  = 38.0 * 20.00 = 760.00
  overtime_hours = max(40.0 - 38, 0) = 2.0 -> overtime_pay = 2.0 * 30.00 = 60.00
  gross_pay = 760.00 + 60.00 = 820.00
"""
from datetime import date, datetime

import pytest

from app.extensions import db
from app.models import Employee, TimeLog, User

ADMIN_LOGIN = "admin01"
ADMIN_PASSWORD = "password123"

STANDARD_HOURS = 38
PAY_RATE = 20.00
OVERTIME_RATE = 30.00


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
            role="Picker", contract_type="Full Time", standard_hours=STANDARD_HOURS,
            pay_rate=PAY_RATE, overtime_pay_rate=OVERTIME_RATE, status="Active",
            hire_date=date(2026, 1, 1),
        )
        db.session.add(staff_emp)
        db.session.flush()
        staff_employee_id = staff_emp.employee_id

        for day in range(2, 6):  # 2nd, 3rd, 4th, 5th Feb -> 4 x 10h shifts
            db.session.add(TimeLog(
                employee_id=staff_employee_id,
                clock_in=datetime(2026, 2, day, 8, 0, 0),
                clock_out=datetime(2026, 2, day, 18, 0, 0),
                date=date(2026, 2, day),
            ))

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


def test_payroll_matches_worked_example(setup):
    client, headers, employee_id = setup
    response = client.get(
        f"/api/payroll?period_start=2026-02-01&period_end=2026-02-07&employee_id={employee_id}",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()
    assert len(body["employees"]) == 1
    result = body["employees"][0]

    assert result["total_hours"] == 40.0
    assert result["regular_hours"] == 38.0
    assert result["overtime_hours"] == 2.0
    assert result["regular_pay"] == 760.0
    assert result["overtime_pay"] == 60.0
    assert result["gross_pay"] == 820.0
    assert body["total_gross_pay"] == 820.0


def test_payroll_no_hours_in_period_gives_zero(setup):
    client, headers, employee_id = setup
    response = client.get(
        f"/api/payroll?period_start=2026-03-01&period_end=2026-03-07&employee_id={employee_id}",
        headers=headers,
    )
    result = response.get_json()["employees"][0]
    assert result["total_hours"] == 0
    assert result["gross_pay"] == 0


def test_payroll_rejects_period_end_before_start(setup):
    client, headers, employee_id = setup
    response = client.get(
        f"/api/payroll?period_start=2026-02-07&period_end=2026-02-01&employee_id={employee_id}",
        headers=headers,
    )
    assert response.status_code == 400


def test_payroll_requires_authentication(app):
    staff_employee_id = _seed_admin_and_staff_with_timelogs(app)
    client = app.test_client()
    response = client.get(
        f"/api/payroll?period_start=2026-02-01&period_end=2026-02-07&employee_id={staff_employee_id}"
    )
    assert response.status_code == 401
