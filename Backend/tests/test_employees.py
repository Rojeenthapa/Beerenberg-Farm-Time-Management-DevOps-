"""
Replaces test_input.py + test_list.py + test_update.py + test_deactivate.py
(old AdminUser-based versions, now broken since the rewrite).
Covers #47 (valid/invalid input), #51 (list display), #53 (update persists),
#56 (no longer active).

REAL VALUES (confirmed from app/routes.py, current main):
  - Create:  POST /api/employees  (admin-only)
             required: first_name, last_name, email, password, user_id, role,
                       employee_role, contract_type, standard_hours, pay_rate,
                       overtime_pay_rate, hire_date
             (user_id -> User.login_id; role -> User.role (login role);
              employee_role -> Employee.role (job title); employee_code is
              auto-generated server-side, not supplied)
             -> 400 missing fields / password < 8 chars
             -> 409 duplicate email or duplicate login_id
             -> 201 {message, employee, user}
  - List:    GET /api/employees (admin-only) -> ALL employees, ordered by
             last_name/first_name. No status filter — Inactive employees
             still appear in the list (this is a real, current behaviour
             change from the old soft-deactivate-hides-from-list design).
  - Update:  PUT /api/employees/<id> (admin-only) — PARTIAL update, only
             fields present in the payload change. "status" is a directly
             settable field (this is how an employee is now marked inactive
             -- there is no separate PATCH .../deactivate route any more).
  - Delete:  DELETE /api/employees/<id> (admin-only) -- HARD delete, removes
             the row entirely (also removes its User row via FK cascade).
"""
from datetime import date

import pytest

from app.extensions import db
from app.models import Employee, User

ADMIN_LOGIN = "admin01"
ADMIN_PASSWORD = "password123"


def _seed_admin(app):
    with app.app_context():
        employee = Employee(
            first_name="Test", last_name="Admin", email="admin@test.com",
            role="Admin", contract_type="Full Time", standard_hours=38,
            pay_rate=0, overtime_pay_rate=0, status="Active", hire_date=date(2026, 1, 1),
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


@pytest.fixture
def auth_headers(client):
    login = client.post("/api/login", json={"login_id": ADMIN_LOGIN, "password": ADMIN_PASSWORD})
    token = login.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


NEW_EMPLOYEE = {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@farm.com",
    "password": "password123",
    "user_id": "janedoe",
    "role": "Staff",
    "employee_role": "Picker",
    "contract_type": "Full Time",
    "standard_hours": 38,
    "pay_rate": 28.50,
    "overtime_pay_rate": 35.00,
    "hire_date": "2026-01-15",
}


# ---------------------------------------------------------------------------
# #47 - valid/invalid input handling
# ---------------------------------------------------------------------------

def test_valid_employee_input_creates_employee_and_login(client, auth_headers):
    response = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    assert response.status_code == 201
    body = response.get_json()
    assert body["employee"]["email"] == "jane.doe@farm.com"
    assert body["user"]["login_id"] == "janedoe"


def test_missing_required_field_rejected(client, auth_headers):
    payload = {**NEW_EMPLOYEE}
    del payload["employee_role"]
    response = client.post("/api/employees", json=payload, headers=auth_headers)
    assert response.status_code == 400


def test_short_password_rejected(client, auth_headers):
    payload = {**NEW_EMPLOYEE, "password": "short"}
    response = client.post("/api/employees", json=payload, headers=auth_headers)
    assert response.status_code == 400


def test_duplicate_email_rejected(client, auth_headers):
    client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    second = {**NEW_EMPLOYEE, "user_id": "janedoe2"}
    response = client.post("/api/employees", json=second, headers=auth_headers)
    assert response.status_code == 409


def test_duplicate_login_id_rejected(client, auth_headers):
    client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    second = {**NEW_EMPLOYEE, "email": "other@farm.com"}
    response = client.post("/api/employees", json=second, headers=auth_headers)
    assert response.status_code == 409


def test_create_requires_admin(app):
    _seed_admin(app)
    with app.app_context():
        staff_emp = Employee(
            first_name="S", last_name="Taff", email="staff@test.com",
            role="Picker", contract_type="Full Time", standard_hours=38,
            pay_rate=25, overtime_pay_rate=30, status="Active", hire_date=date(2026, 1, 1),
        )
        db.session.add(staff_emp)
        db.session.flush()
        staff_user = User(login_id="staffuser", employee_id=staff_emp.employee_id, role="Staff")
        staff_user.set_password(ADMIN_PASSWORD)
        db.session.add(staff_user)
        db.session.commit()

    client = app.test_client()
    login = client.post("/api/login", json={"login_id": "staffuser", "password": ADMIN_PASSWORD})
    headers = {"Authorization": f"Bearer {login.get_json()['access_token']}"}
    response = client.post("/api/employees", json=NEW_EMPLOYEE, headers=headers)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# #51 - list displays correctly
# ---------------------------------------------------------------------------

def test_list_shows_seeded_employees(client, auth_headers):
    client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    response = client.get("/api/employees", headers=auth_headers)
    assert response.status_code == 200
    emails = [e["email"] for e in response.get_json()]
    assert "jane.doe@farm.com" in emails
    assert "admin@test.com" in emails


def test_list_includes_inactive_employees_too(client, auth_headers):
    """Real current behaviour: GET /api/employees has no status filter, so
    an Inactive employee still shows up in the list. This is a deliberate
    change from the old design and is called out as such, not assumed."""
    create = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    employee_id = create.get_json()["employee"]["employee_id"]
    client.put(f"/api/employees/{employee_id}", json={"status": "Inactive"}, headers=auth_headers)

    response = client.get("/api/employees", headers=auth_headers)
    ids = [e["employee_id"] for e in response.get_json()]
    assert employee_id in ids


# ---------------------------------------------------------------------------
# #53 - update persists correctly
# ---------------------------------------------------------------------------

def test_update_persists_and_is_reflected_on_refetch(client, auth_headers):
    create = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    employee_id = create.get_json()["employee"]["employee_id"]

    update = client.put(f"/api/employees/{employee_id}", json={"role": "Supervisor"}, headers=auth_headers)
    assert update.status_code == 200
    assert update.get_json()["role"] == "Supervisor"

    refetch = client.get(f"/api/employees/{employee_id}", headers=auth_headers)
    assert refetch.get_json()["role"] == "Supervisor"


def test_update_is_partial_unrelated_fields_untouched(client, auth_headers):
    create = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    employee_id = create.get_json()["employee"]["employee_id"]

    client.put(f"/api/employees/{employee_id}", json={"phone": "0411222333"}, headers=auth_headers)
    refetch = client.get(f"/api/employees/{employee_id}", headers=auth_headers)
    body = refetch.get_json()
    assert body["phone"] == "0411222333"
    assert body["email"] == "jane.doe@farm.com"
    assert body["first_name"] == "Jane"


def test_update_nonexistent_employee_404(client, auth_headers):
    response = client.put("/api/employees/9999", json={"role": "Supervisor"}, headers=auth_headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# #56 - record no longer shows as active
# ---------------------------------------------------------------------------

def test_status_update_marks_employee_inactive(client, auth_headers):
    create = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    employee_id = create.get_json()["employee"]["employee_id"]

    response = client.put(f"/api/employees/{employee_id}", json={"status": "Inactive"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["status"] == "Inactive"

    refetch = client.get(f"/api/employees/{employee_id}", headers=auth_headers)
    assert refetch.get_json()["status"] == "Inactive"


def test_hard_delete_removes_employee_entirely(client, auth_headers):
    """Real current behaviour: DELETE is a separate, genuine hard-delete --
    not the same as marking status Inactive. Confirmed removed from the DB,
    not just filtered out of the list."""
    create = client.post("/api/employees", json=NEW_EMPLOYEE, headers=auth_headers)
    employee_id = create.get_json()["employee"]["employee_id"]

    response = client.delete(f"/api/employees/{employee_id}", headers=auth_headers)
    assert response.status_code == 200

    refetch = client.get(f"/api/employees/{employee_id}", headers=auth_headers)
    assert refetch.status_code == 404
