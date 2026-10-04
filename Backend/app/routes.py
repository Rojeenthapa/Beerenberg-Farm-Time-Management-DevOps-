from datetime import date
from datetime import datetime
from datetime import time

from flask import Blueprint
from flask import jsonify
from flask import request

from .extensions import db
from .models import Employee
from .models import Shift
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


def parse_time(
    value,
    field_name
):
    if not value:
        raise ValueError(
            f"{field_name} is required"
        )

    try:
        return time.fromisoformat(value)

    except ValueError:
        raise ValueError(
            f"{field_name} must use HH:MM or HH:MM:SS format"
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


@main_bp.get(
    "/api/dashboard/employee-count"
)
def get_dashboard_employee_count():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    admin_employee_ids = db.session.query(
        User.employee_id
    ).filter(
        User.role.in_([
            "Admin",
            "Administrator"
        ])
    )

    employee_count = Employee.query.filter(
        Employee.status == "Active",
        ~Employee.employee_id.in_(
            admin_employee_ids
        )
    ).count()

    return jsonify({
        "employee_count": employee_count
    }), 200


@main_bp.post("/api/users")
def create_user():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "first_name",
        "last_name",
        "email",
        "password",
        "role"
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

    password = data["password"]

    if len(password) < 8:
        return error_response(
            "Password must contain at least 8 characters"
        )

    email = data["email"].strip().lower()
    role = data["role"].strip()

    allowed_roles = {
        "Admin",
        "Staff",
        "User"
    }

    if role not in allowed_roles:
        return error_response(
            "Role must be Admin, Staff, or User"
        )

    existing_employee = Employee.query.filter_by(
        email=email
    ).first()

    if existing_employee is not None:
        existing_user = User.query.filter_by(
            employee_id=existing_employee.employee_id
        ).first()

        if existing_user is not None:
            return error_response(
                "An account already exists for this email",
                409
            )

        return error_response(
            "An employee already exists with this email",
            409
        )

    try:
        employee = Employee(
            first_name=data["first_name"].strip(),
            last_name=data["last_name"].strip(),
            email=email,
            phone=data.get("phone"),
            role=data.get(
                "employee_role",
                "Farm Staff"
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
            role=role
        )

        user.set_password(
            password
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": user.to_dict(),
            "created_by": admin.user_id
        }), 201

    except ValueError as error:
        db.session.rollback()

        return error_response(
            str(error)
        )

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


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


@main_bp.post("/api/password/change")
def change_password():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    data = request.get_json(
        silent=True
    ) or {}

    current_password = data.get(
        "current_password",
        ""
    )

    new_password = data.get(
        "new_password",
        ""
    )

    confirm_password = data.get(
        "confirm_password",
        ""
    )

    if not current_password:
        return error_response(
            "Current password is required"
        )

    if not new_password:
        return error_response(
            "New password is required"
        )

    if len(new_password) < 8:
        return error_response(
            "New password must contain at least 8 characters"
        )

    if new_password != confirm_password:
        return error_response(
            "New passwords do not match"
        )

    if not user.check_password(
        current_password
    ):
        return error_response(
            "Current password is incorrect",
            401
        )

    if user.check_password(
        new_password
    ):
        return error_response(
            "New password must be different"
        )

    try:
        user.set_password(
            new_password
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Password changed successfully"
            )
        }), 200

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


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


@main_bp.post("/api/employees")
def create_employee():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    data = request.get_json(
        silent=True
    ) or {}

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
        if data.get(field) in (
            None,
            ""
        )
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
            role=data["role"].strip(),
            contract_type=data["contract_type"],
            standard_hours=data["standard_hours"],
            pay_rate=data["pay_rate"],
            overtime_pay_rate=data[
                "overtime_pay_rate"
            ],
            status=data.get(
                "status",
                "Active"
            ),
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

        return error_response(
            str(error)
        )

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.put(
    "/api/employees/<int:employee_id>"
)
def update_employee(employee_id):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    employee = db.session.get(
        Employee,
        employee_id
    )

    if employee is None:
        return error_response(
            "Employee not found",
            404
        )

    data = request.get_json(
        silent=True
    ) or {}

    editable_fields = [
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

    for field in editable_fields:
        if field in data:
            value = data[field]

            if isinstance(value, str):
                value = value.strip()

            setattr(
                employee,
                field,
                value
            )

    if "hire_date" in data:
        try:
            employee.hire_date = parse_date(
                data["hire_date"],
                "hire_date"
            )

        except ValueError as error:
            return error_response(
                str(error)
            )

    try:
        db.session.commit()

        return jsonify(
            employee.to_dict()
        ), 200

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.delete(
    "/api/employees/<int:employee_id>"
)
def delete_employee(employee_id):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    employee = db.session.get(
        Employee,
        employee_id
    )

    if employee is None:
        return error_response(
            "Employee not found",
            404
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

        return error_response(
            str(error),
            500
        )


@main_bp.get("/api/shifts")
def get_shifts():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    requested_employee_id = request.args.get(
        "employee_id",
        type=int
    )

    start_date_value = request.args.get(
        "start_date"
    )

    end_date_value = request.args.get(
        "end_date"
    )

    status = request.args.get(
        "status",
        ""
    ).strip()

    query = Shift.query

    if user.is_admin:
        if requested_employee_id is not None:
            query = query.filter(
                Shift.employee_id ==
                requested_employee_id
            )
    else:
        query = query.filter(
            Shift.employee_id ==
            user.employee_id
        )

    if start_date_value:
        try:
            query = query.filter(
                Shift.date >= parse_date(
                    start_date_value,
                    "start_date"
                )
            )

        except ValueError as error:
            return error_response(
                str(error)
            )

    if end_date_value:
        try:
            query = query.filter(
                Shift.date <= parse_date(
                    end_date_value,
                    "end_date"
                )
            )

        except ValueError as error:
            return error_response(
                str(error)
            )

    if status:
        query = query.filter(
            Shift.status == status
        )

    shifts = query.order_by(
        Shift.date,
        Shift.start_time
    ).all()

    return jsonify([
        shift.to_dict()
        for shift in shifts
    ]), 200


@main_bp.get(
    "/api/shifts/<int:shift_id>"
)
def get_shift(shift_id):
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    shift = db.session.get(
        Shift,
        shift_id
    )

    if shift is None:
        return error_response(
            "Shift not found",
            404
        )

    if not user.is_admin:
        if shift.employee_id != user.employee_id:
            return error_response(
                "You can only view your own shifts",
                403
            )

    return jsonify(
        shift.to_dict()
    ), 200


@main_bp.post("/api/shifts")
def create_shift():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "employee_id",
        "date",
        "start_time",
        "end_time"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (
            None,
            ""
        )
    ]

    if missing_fields:
        return error_response(
            "Missing fields: "
            + ", ".join(missing_fields)
        )

    employee = db.session.get(
        Employee,
        data["employee_id"]
    )

    if employee is None:
        return error_response(
            "Employee not found",
            404
        )

    try:
        shift_date = parse_date(
            data["date"],
            "date"
        )

        start_time = parse_time(
            data["start_time"],
            "start_time"
        )

        end_time = parse_time(
            data["end_time"],
            "end_time"
        )

        if end_time <= start_time:
            return error_response(
                "end_time must be later than start_time"
            )

        shift = Shift(
            employee_id=employee.employee_id,
            date=shift_date,
            start_time=start_time,
            end_time=end_time,
            status=data.get(
                "status",
                "Scheduled"
            )
        )

        db.session.add(shift)
        db.session.commit()

        return jsonify(
            shift.to_dict()
        ), 201

    except ValueError as error:
        db.session.rollback()

        return error_response(
            str(error)
        )

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.put(
    "/api/shifts/<int:shift_id>"
)
def update_shift(shift_id):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    shift = db.session.get(
        Shift,
        shift_id
    )

    if shift is None:
        return error_response(
            "Shift not found",
            404
        )

    data = request.get_json(
        silent=True
    ) or {}

    try:
        if "employee_id" in data:
            employee = db.session.get(
                Employee,
                data["employee_id"]
            )

            if employee is None:
                return error_response(
                    "Employee not found",
                    404
                )

            shift.employee_id = employee.employee_id

        if "date" in data:
            shift.date = parse_date(
                data["date"],
                "date"
            )

        if "start_time" in data:
            shift.start_time = parse_time(
                data["start_time"],
                "start_time"
            )

        if "end_time" in data:
            shift.end_time = parse_time(
                data["end_time"],
                "end_time"
            )

        if "status" in data:
            shift.status = data["status"]

        if shift.end_time <= shift.start_time:
            return error_response(
                "end_time must be later than start_time"
            )

        db.session.commit()

        return jsonify(
            shift.to_dict()
        ), 200

    except ValueError as error:
        db.session.rollback()

        return error_response(
            str(error)
        )

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.delete(
    "/api/shifts/<int:shift_id>"
)
def delete_shift(shift_id):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    shift = db.session.get(
        Shift,
        shift_id
    )

    if shift is None:
        return error_response(
            "Shift not found",
            404
        )

    try:
        db.session.delete(shift)
        db.session.commit()

        return jsonify({
            "message": "Shift deleted successfully"
        }), 200

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


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