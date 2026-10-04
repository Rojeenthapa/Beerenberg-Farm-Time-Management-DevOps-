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


def get_authenticated_user():
    user_id = request.headers.get(
        "X-User-Id"
    )

    if not user_id:
        return None

    try:
        user_id = int(user_id)

    except (
        TypeError,
        ValueError
    ):
        return None

    return db.session.get(
        User,
        user_id
    )


def require_authenticated_user():
    user = get_authenticated_user()

    if user is None:
        return (
            None,
            error_response(
                "Authentication required",
                401
            )
        )

    return user, None


def require_admin_user():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return None, response

    if not user.is_admin:
        return (
            None,
            error_response(
                "Administrator access required",
                403
            )
        )

    return user, None


def time_to_seconds(value):
    if value is None:
        return 0

    return (
        value.hour * 3600
        + value.minute * 60
        + value.second
    )


def calculate_break_hours(time_log):
    break_seconds = 0

    for break_record in time_log.breaks:
        if (
            break_record.start_time is None
            or break_record.end_time is None
        ):
            continue

        start_seconds = time_to_seconds(
            break_record.start_time
        )

        end_seconds = time_to_seconds(
            break_record.end_time
        )

        duration = end_seconds - start_seconds

        if duration < 0:
            duration += 24 * 60 * 60

        break_seconds += duration

    return round(
        break_seconds / 3600,
        2
    )


def calculate_worked_hours(time_log):
    if (
        time_log.clock_in is None
        or time_log.clock_out is None
    ):
        return 0

    total_seconds = (
        time_log.clock_out
        - time_log.clock_in
    ).total_seconds()

    gross_hours = total_seconds / 3600

    break_hours = calculate_break_hours(
        time_log
    )

    return max(
        round(
            gross_hours - break_hours,
            2
        ),
        0
    )


def format_hours(hours):
    total_minutes = round(
        hours * 60
    )

    whole_hours = total_minutes // 60
    minutes = total_minutes % 60

    return (
        f"{whole_hours}h "
        f"{minutes:02d}m"
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

    if employee.status.strip().lower() != "active":
        return error_response(
            "This account is inactive",
            403
        )

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict()
    }), 200


@main_bp.get("/api/me")
def get_current_user():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    return jsonify(
        user.to_dict()
    ), 200


@main_bp.get("/api/users")
def get_users():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    users = User.query.join(
        Employee
    ).order_by(
        Employee.last_name,
        Employee.first_name
    ).all()

    return jsonify([
        user.to_dict()
        for user in users
    ]), 200


@main_bp.get("/api/employees")
def get_employees():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

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


@main_bp.get(
    "/api/employees/<int:employee_id>"
)
def get_employee(employee_id):
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    if not user.is_admin:
        if user.employee_id != employee_id:
            return error_response(
                "You can only view your own employee profile",
                403
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

    return jsonify(
        employee.to_dict()
    ), 200


@main_bp.get("/api/timelogs")
def get_time_logs():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    requested_employee_id = request.args.get(
        "employee_id",
        type=int
    )

    log_date = request.args.get(
        "date",
        ""
    ).strip()

    query = TimeLog.query

    if user.is_admin:
        if requested_employee_id is not None:
            query = query.filter(
                TimeLog.employee_id ==
                requested_employee_id
            )
    else:
        query = query.filter(
            TimeLog.employee_id ==
            user.employee_id
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


@main_bp.get("/api/hours")
def get_hours_report():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    from_date_value = request.args.get(
        "from_date"
    )

    to_date_value = request.args.get(
        "to_date"
    )

    requested_employee_id = request.args.get(
        "employee_id",
        type=int
    )

    if not from_date_value:
        return error_response(
            "from_date is required"
        )

    if not to_date_value:
        return error_response(
            "to_date is required"
        )

    try:
        from_date = parse_date(
            from_date_value,
            "from_date"
        )

        to_date = parse_date(
            to_date_value,
            "to_date"
        )

    except ValueError as error:
        return error_response(
            str(error)
        )

    if to_date < from_date:
        return error_response(
            "to_date cannot be before from_date"
        )

    if user.is_admin:
        employee_id = requested_employee_id

    else:
        employee_id = user.employee_id

    employee_query = Employee.query

    if employee_id is not None:
        employee_query = employee_query.filter(
            Employee.employee_id == employee_id
        )

    employees = employee_query.order_by(
        Employee.last_name,
        Employee.first_name
    ).all()

    employee_results = []

    total_worked_hours = 0
    total_break_hours = 0

    for employee in employees:
        time_logs = TimeLog.query.filter(
            TimeLog.employee_id ==
            employee.employee_id,
            TimeLog.date >= from_date,
            TimeLog.date <= to_date
        ).order_by(
            TimeLog.date,
            TimeLog.clock_in
        ).all()

        employee_worked_hours = 0
        employee_break_hours = 0
        completed_logs = 0
        open_logs = 0
        daily_records = []

        for time_log in time_logs:
            break_hours = calculate_break_hours(
                time_log
            )

            employee_break_hours += break_hours

            if time_log.clock_out is None:
                worked_hours = 0
                open_logs += 1

            else:
                worked_hours = calculate_worked_hours(
                    time_log
                )
                completed_logs += 1

            employee_worked_hours += worked_hours

            daily_records.append({
                "timelog_id": time_log.timelog_id,
                "date": (
                    time_log.date.isoformat()
                    if time_log.date is not None
                    else None
                ),
                "clock_in": (
                    time_log.clock_in.isoformat()
                    if time_log.clock_in is not None
                    else None
                ),
                "clock_out": (
                    time_log.clock_out.isoformat()
                    if time_log.clock_out is not None
                    else None
                ),
                "break_hours": break_hours,
                "break_hours_display": format_hours(
                    break_hours
                ),
                "worked_hours": round(
                    worked_hours,
                    2
                ),
                "worked_display": format_hours(
                    worked_hours
                )
            })

        employee_worked_hours = round(
            employee_worked_hours,
            2
        )

        employee_break_hours = round(
            employee_break_hours,
            2
        )

        total_worked_hours += (
            employee_worked_hours
        )

        total_break_hours += (
            employee_break_hours
        )

        employee_results.append({
            "employee_id": employee.employee_id,
            "display_id": employee.display_id,
            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),
            "role": employee.role,
            "standard_hours": float(
                employee.standard_hours
            ),
            "regular_hours": employee_worked_hours,
            "break_hours": employee_break_hours,
            "total_hours": employee_worked_hours,
            "regular_hours_display": format_hours(
                employee_worked_hours
            ),
            "break_hours_display": format_hours(
                employee_break_hours
            ),
            "total_hours_display": format_hours(
                employee_worked_hours
            ),
            "completed_log_count": completed_logs,
            "open_log_count": open_logs,
            "daily_records": daily_records
        })

    total_worked_hours = round(
        total_worked_hours,
        2
    )

    total_break_hours = round(
        total_break_hours,
        2
    )

    return jsonify({
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "total_hours": total_worked_hours,
        "total_regular_hours": total_worked_hours,
        "total_break_hours": total_break_hours,
        "total_hours_display": format_hours(
            total_worked_hours
        ),
        "total_regular_hours_display": format_hours(
            total_worked_hours
        ),
        "total_break_hours_display": format_hours(
            total_break_hours
        ),
        "employees": employee_results
    }), 200


@main_bp.post(
    "/api/timelogs/clock-in"
)
def clock_in():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    data = request.get_json(
        silent=True
    ) or {}

    requested_employee_id = data.get(
        "employee_id"
    )

    if user.is_admin:
        employee_id = requested_employee_id

        if employee_id in (
            None,
            ""
        ):
            return error_response(
                "employee_id is required"
            )

    else:
        employee_id = user.employee_id

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
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    time_log = db.session.get(
        TimeLog,
        timelog_id
    )

    if time_log is None:
        return error_response(
            "Time log not found",
            404
        )

    if not user.is_admin:
        if time_log.employee_id != user.employee_id:
            return error_response(
                "Users can only clock out their own time log",
                403
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