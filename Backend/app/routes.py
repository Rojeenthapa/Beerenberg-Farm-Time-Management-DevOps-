from datetime import date
from datetime import datetime

from flask import Blueprint
from flask import jsonify
from flask import request

from .extensions import db
from .models import Employee
from .models import TimeLog
from .models import User


main_bp = Blueprint(
    "main",
    __name__
)


def error_response(
    message,
    status_code=400
):
    return jsonify({
        "error": message
    }), status_code


def parse_date(
    value,
    field_name
):
    if not value:
        raise ValueError(
            f"{field_name} is required"
        )

    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        )


@main_bp.get("/api/health")
def health_check():
    try:
        db.session.execute(
            db.text("SELECT 1")
        )

        return jsonify({
            "status": "ok",
            "database": "connected",
            "message": (
                "Farm Time Management API is running"
            )
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "database": "disconnected",
            "message": str(error)
        }), 500


@main_bp.post("/api/login")
def login():
    data = request.get_json(
        silent=True
    ) or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

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

    if user is None:
        return error_response(
            "Invalid email or password",
            401
        )

    if not user.check_password(password):
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


@main_bp.get("/api/employees")
def get_employees():
    status = request.args.get(
        "status",
        ""
    ).strip()

    query = Employee.query

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


@main_bp.get("/api/timelogs")
def get_time_logs():
    employee_id = request.args.get(
        "employee_id",
        type=int
    )

    log_date = request.args.get(
        "date",
        ""
    ).strip()

    query = TimeLog.query

    if employee_id:
        query = query.filter(
            TimeLog.employee_id == employee_id
        )

    if log_date:
        try:
            query = query.filter(
                TimeLog.date == parse_date(
                    log_date,
                    "date"
                )
            )
        except ValueError as error:
            return error_response(
                str(error)
            )

    time_logs = query.order_by(
        TimeLog.clock_in.desc()
    ).all()

    return jsonify([
        time_log.to_dict()
        for time_log in time_logs
    ]), 200


@main_bp.post("/api/timelogs/clock-in")
def clock_in():
    data = request.get_json(
        silent=True
    ) or {}

    employee_id = data.get(
        "employee_id"
    )

    if employee_id in (
        None,
        ""
    ):
        return error_response(
            "employee_id is required"
        )

    try:
        employee_id = int(employee_id)
    except (
        TypeError,
        ValueError
    ):
        return error_response(
            "employee_id must be an integer"
        )

    employee = db.session.get(
        Employee,
        employee_id
    )

    if employee is None:
        return error_response(
            "Employee not found",
            404
        )

    if employee.status.strip().lower() != "active":
        return error_response(
            "Only active employees can clock in"
        )

    existing_open_log = TimeLog.query.filter(
        TimeLog.employee_id == employee_id,
        TimeLog.clock_out.is_(None)
    ).first()

    if existing_open_log is not None:
        return error_response(
            "This employee is already clocked in",
            409
        )

    now = datetime.now()

    time_log = TimeLog(
        employee_id=employee_id,
        clock_in=now,
        clock_out=None,
        date=now.date()
    )

    try:
        db.session.add(time_log)
        db.session.commit()

        return jsonify(
            time_log.to_dict()
        ), 201

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.post(
    "/api/timelogs/<int:timelog_id>/clock-out"
)
def clock_out(timelog_id):
    time_log = db.session.get(
        TimeLog,
        timelog_id
    )

    if time_log is None:
        return error_response(
            "Time log not found",
            404
        )

    if time_log.clock_out is not None:
        return error_response(
            "This time log is already closed",
            409
        )

    now = datetime.now()

    if now < time_log.clock_in:
        return error_response(
            "Clock-out cannot be before clock-in"
        )

    time_log.clock_out = now

    try:
        db.session.commit()

        return jsonify(
            time_log.to_dict()
        ), 200

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )