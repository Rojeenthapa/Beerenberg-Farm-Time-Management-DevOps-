from datetime import date

from flask import Blueprint
from flask import jsonify
from flask import request

from .extensions import db
from .models import Employee
from .models import User


main_bp = Blueprint("main", __name__)


def error_response(message, status_code=400):
    return jsonify({
        "error": message
    }), status_code


def parse_date(value, field_name):
    if not value:
        raise ValueError(
            f"{field_name} is required"
        )

    return date.fromisoformat(value)


@main_bp.get("/api/health")
def health_check():
    try:
        db.session.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "ok",
            "database": "connected",
            "message": (
                "Farm Time Management API is running"
            )
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "database": "disconnected",
            "message": str(error)
        }), 500


@main_bp.post("/api/admin/create")
def create_admin():
    data = request.get_json(silent=True) or {}

    required_fields = [
        "first_name",
        "last_name",
        "email",
        "password"
    ]

    missing_fields = [
        field
        for field in required_fields
        if not data.get(field)
    ]

    if missing_fields:
        return error_response(
            "Missing fields: "
            + ", ".join(missing_fields)
        )

    email = data["email"].strip().lower()

    existing_employee = Employee.query.filter_by(
        email=email
    ).first()

    try:
        if existing_employee is not None:
            existing_user = User.query.filter_by(
                employee_id=existing_employee.employee_id
            ).first()

            if existing_user is not None:
                return error_response(
                    "An account already exists for this email",
                    409
                )

            employee = existing_employee

        else:
            employee = Employee(
                first_name=data["first_name"].strip(),
                last_name=data["last_name"].strip(),
                email=email,
                phone=data.get("phone"),
                role=data.get(
                    "employee_role",
                    "Administrator"
                ),
                contract_type=data.get(
                    "contract_type",
                    "Full Time"
                ),
                standard_hours=data.get(
                    "standard_hours",
                    38
                ),
                pay_rate=data.get(
                    "pay_rate",
                    0
                ),
                overtime_pay_rate=data.get(
                    "overtime_pay_rate",
                    0
                ),
                status="Active",
                hire_date=parse_date(
                    data.get(
                        "hire_date",
                        date.today().isoformat()
                    ),
                    "hire_date"
                )
            )

            db.session.add(employee)
            db.session.flush()

        user = User(
            employee_id=employee.employee_id,
            role="Admin"
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": (
                "Admin account created successfully"
            ),
            "user": user.to_dict()
        }), 201

    except ValueError as error:
        db.session.rollback()
        return error_response(str(error))

    except Exception as error:
        db.session.rollback()
        return error_response(str(error), 500)


@main_bp.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return error_response(
            "Email and password are required"
        )

    employee = Employee.query.filter_by(
        email=email
    ).first()

    if employee is None:
        return error_response(
            "Invalid email or password",
            401
        )

    user = User.query.filter_by(
        employee_id=employee.employee_id
    ).first()

    if user is None or not user.check_password(password):
        return error_response(
            "Invalid email or password",
            401
        )

    if not user.is_admin:
        return error_response(
            "This account does not have administrator access",
            403
        )

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict()
    }), 200


@main_bp.get("/api/users")
def get_users():
    users = User.query.join(Employee).order_by(
        Employee.last_name,
        Employee.first_name
    ).all()

    return jsonify([
        user.to_dict()
        for user in users
    ]), 200


@main_bp.get("/api/employees")
def get_employees():
    search = request.args.get(
        "search",
        ""
    ).strip()

    status = request.args.get(
        "status",
        ""
    ).strip()

    query = Employee.query

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            db.or_(
                Employee.first_name.ilike(search_value),
                Employee.last_name.ilike(search_value),
                Employee.email.ilike(search_value),
                Employee.role.ilike(search_value),
                Employee.contract_type.ilike(search_value)
            )
        )

    if status:
        query = query.filter(
            Employee.status == status
        )

    employees = query.order_by(
        Employee.last_name,
        Employee.first_name
    ).all()

    return jsonify([
        employee.to_dict()
        for employee in employees
    ]), 200


@main_bp.get("/api/employees/<int:employee_id>")
def get_employee(employee_id):
    employee = db.get_or_404(
        Employee,
        employee_id
    )

    return jsonify(
        employee.to_dict()
    ), 200


@main_bp.post("/api/employees")
def create_employee():
    data = request.get_json(silent=True) or {}

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
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return error_response(
            "Missing fields: "
            + ", ".join(missing_fields)
        )

    email = data["email"].strip().lower()

    if Employee.query.filter_by(
        email=email
    ).first() is not None:
        return error_response(
            "An employee with this email already exists",
            409
        )

    try:
        employee = Employee(
            first_name=data["first_name"].strip(),
            last_name=data["last_name"].strip(),
            email=email,
            phone=data.get("phone"),
            role=data["role"],
            contract_type=data["contract_type"],
            standard_hours=data["standard_hours"],
            pay_rate=data["pay_rate"],
            overtime_pay_rate=data["overtime_pay_rate"],
            status=data.get("status", "Active"),
            hire_date=parse_date(
                data["hire_date"],
                "hire_date"
            )
        )

        db.session.add(employee)
        db.session.commit()

        return jsonify(
            employee.to_dict()
        ), 201

    except ValueError as error:
        db.session.rollback()
        return error_response(str(error))

    except Exception as error:
        db.session.rollback()
        return error_response(str(error), 500)


@main_bp.put("/api/employees/<int:employee_id>")
def update_employee(employee_id):
    employee = db.get_or_404(
        Employee,
        employee_id
    )

    data = request.get_json(silent=True) or {}

    fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "contract_type",
        "standard_hours",
        "pay_rate",
        "overtime_pay_rate",
        "status"
    ]

    for field in fields:
        if field in data:
            setattr(
                employee,
                field,
                data[field]
            )

    if "hire_date" in data:
        try:
            employee.hire_date = parse_date(
                data["hire_date"],
                "hire_date"
            )
        except ValueError as error:
            return error_response(str(error))

    try:
        db.session.commit()

        return jsonify(
            employee.to_dict()
        ), 200

    except Exception as error:
        db.session.rollback()
        return error_response(str(error), 500)


@main_bp.delete("/api/employees/<int:employee_id>")
def delete_employee(employee_id):
    employee = db.get_or_404(
        Employee,
        employee_id
    )

    try:
        db.session.delete(employee)
        db.session.commit()

        return jsonify({
            "message": (
                "Employee deleted successfully"
            )
        }), 200

    except Exception as error:
        db.session.rollback()
        return error_response(str(error), 500)