from datetime import date

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from .extensions import db
from .models import Employee

main_bp = Blueprint("main", __name__)


@main_bp.get("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Farm Time Management API is running"
    }), 200


@main_bp.post("/api/employees")
def create_employee():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body must contain JSON data."
        }), 400

    required_fields = [
        "first_name",
        "last_name",
        "email",
        "role",
        "contract_type",
        "standard_hours",
        "pay_rate",
        "overtime_pay_rate",
        "hire_date"
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] in (None, "")
    ]

    if missing_fields:
        return jsonify({
            "error": "Validation failed.",
            "details": {
                field: "This field is required."
                for field in missing_fields
            }
        }), 400

    first_name = str(data["first_name"]).strip()
    last_name = str(data["last_name"]).strip()
    email = str(data["email"]).strip().lower()
    phone = str(data.get("phone", "")).strip() or None
    role = str(data["role"]).strip()
    contract_type = str(data["contract_type"]).strip()

    validation_error = validate_employee_fields(
        first_name=first_name,
        last_name=last_name,
        email=email,
        role=role,
        contract_type=contract_type,
        standard_hours=data["standard_hours"],
        pay_rate=data["pay_rate"],
        overtime_pay_rate=data["overtime_pay_rate"],
        hire_date_value=data["hire_date"]
    )

    if validation_error:
        return jsonify(validation_error), 400

    standard_hours = float(data["standard_hours"])
    pay_rate = float(data["pay_rate"])
    overtime_pay_rate = float(data["overtime_pay_rate"])
    hire_date = date.fromisoformat(str(data["hire_date"]))

    existing_employee = Employee.query.filter_by(email=email).first()

    if existing_employee:
        return jsonify({
            "error": "An employee with this email already exists."
        }), 409

    employee = Employee(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        role=role,
        contract_type=contract_type,
        standard_hours=standard_hours,
        pay_rate=pay_rate,
        overtime_pay_rate=overtime_pay_rate,
        status="Active",
        hire_date=hire_date
    )

    try:
        db.session.add(employee)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": (
                "The employee could not be created "
                "because of a database conflict."
            )
        }), 409

    return jsonify(employee.to_dict()), 201


@main_bp.get("/api/employees")
def list_employees():
    employees = Employee.query.filter_by(
        status="Active"
    ).order_by(
        Employee.employee_id
    ).all()

    return jsonify([
        employee.to_dict()
        for employee in employees
    ]), 200


@main_bp.put("/api/employees/<int:employee_id>")
def update_employee(employee_id):
    employee = db.session.get(Employee, employee_id)

    if employee is None:
        return jsonify({
            "error": "Employee not found."
        }), 404

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body must contain JSON data."
        }), 400

    required_fields = [
        "first_name",
        "last_name",
        "email",
        "role",
        "contract_type",
        "standard_hours",
        "pay_rate",
        "overtime_pay_rate",
        "hire_date"
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] in (None, "")
    ]

    if missing_fields:
        return jsonify({
            "error": "Validation failed.",
            "details": {
                field: "This field is required."
                for field in missing_fields
            }
        }), 400

    first_name = str(data["first_name"]).strip()
    last_name = str(data["last_name"]).strip()
    email = str(data["email"]).strip().lower()
    phone = str(data.get("phone", "")).strip() or None
    role = str(data["role"]).strip()
    contract_type = str(data["contract_type"]).strip()

    validation_error = validate_employee_fields(
        first_name=first_name,
        last_name=last_name,
        email=email,
        role=role,
        contract_type=contract_type,
        standard_hours=data["standard_hours"],
        pay_rate=data["pay_rate"],
        overtime_pay_rate=data["overtime_pay_rate"],
        hire_date_value=data["hire_date"]
    )

    if validation_error:
        return jsonify(validation_error), 400

    duplicate_email = Employee.query.filter(
        Employee.email == email,
        Employee.employee_id != employee_id
    ).first()

    if duplicate_email:
        return jsonify({
            "error": "Another employee already uses this email."
        }), 409

    employee.first_name = first_name
    employee.last_name = last_name
    employee.email = email
    employee.phone = phone
    employee.role = role
    employee.contract_type = contract_type
    employee.standard_hours = float(data["standard_hours"])
    employee.pay_rate = float(data["pay_rate"])
    employee.overtime_pay_rate = float(data["overtime_pay_rate"])
    employee.hire_date = date.fromisoformat(str(data["hire_date"]))

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": (
                "The employee could not be updated "
                "because of a database conflict."
            )
        }), 409

    return jsonify(employee.to_dict()), 200


def validate_employee_fields(
    first_name,
    last_name,
    email,
    role,
    contract_type,
    standard_hours,
    pay_rate,
    overtime_pay_rate,
    hire_date_value
):
    details = {}

    if len(first_name) < 2 or len(first_name) > 50:
        details["first_name"] = (
            "Must contain between 2 and 50 characters."
        )

    if len(last_name) < 2 or len(last_name) > 50:
        details["last_name"] = (
            "Must contain between 2 and 50 characters."
        )

    if "@" not in email or "." not in email.split("@")[-1]:
        details["email"] = "Enter a valid email address."

    if len(role) < 2 or len(role) > 50:
        details["role"] = (
            "Must contain between 2 and 50 characters."
        )

    allowed_contract_types = {
        "Casual",
        "Part Time",
        "Full Time"
    }

    if contract_type not in allowed_contract_types:
        details["contract_type"] = (
            "Must be Casual, Part Time, or Full Time."
        )

    try:
        standard_hours_value = float(standard_hours)
        pay_rate_value = float(pay_rate)
        overtime_pay_rate_value = float(overtime_pay_rate)
    except (TypeError, ValueError):
        details["standard_hours"] = "Must be a number."
        details["pay_rate"] = "Must be a number."
        details["overtime_pay_rate"] = "Must be a number."
    else:
        if not 0 <= standard_hours_value <= 60:
            details["standard_hours"] = (
                "Must be between 0 and 60."
            )

        if pay_rate_value <= 0 or pay_rate_value > 999.99:
            details["pay_rate"] = (
                "Must be greater than 0 and no more than 999.99."
            )

        if (
            overtime_pay_rate_value < pay_rate_value
            or overtime_pay_rate_value > 999.99
        ):
            details["overtime_pay_rate"] = (
                "Must be at least the pay rate "
                "and no more than 999.99."
            )

    try:
        date.fromisoformat(str(hire_date_value))
    except ValueError:
        details["hire_date"] = "Must use YYYY-MM-DD format."

    if details:
        return {
            "error": "Validation failed.",
            "details": details
        }

    return None