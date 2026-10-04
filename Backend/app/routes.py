from datetime import date
from datetime import datetime
from datetime import time
from decimal import Decimal
from decimal import ROUND_HALF_UP

from flask import Blueprint
from flask import jsonify
from flask import request

from .extensions import db
from .models import AdminAdjustment
from .models import Break
from .models import ComplianceException
from .models import ComplianceRule
from .models import Credential
from .models import Employee
from .models import PayrollRecord
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


def get_request_data():
    return request.get_json(
        silent=True
    ) or {}


def parse_date(
    value,
    field_name
):
    if value in (
        None,
        ""
    ):
        raise ValueError(
            f"{field_name} is required"
        )

    try:
        return date.fromisoformat(
            str(value)
        )

    except ValueError:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        )


def parse_time(
    value,
    field_name
):
    if value in (
        None,
        ""
    ):
        raise ValueError(
            f"{field_name} is required"
        )

    try:
        return time.fromisoformat(
            str(value)
        )

    except ValueError:
        raise ValueError(
            f"{field_name} must use HH:MM or HH:MM:SS format"
        )


def parse_integer(
    value,
    field_name
):
    try:
        return int(value)

    except (
        TypeError,
        ValueError
    ):
        raise ValueError(
            f"{field_name} must be an integer"
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


def get_employee_or_404(
    employee_id
):
    employee = db.session.get(
        Employee,
        employee_id
    )

    if employee is None:
        return (
            None,
            error_response(
                "Employee not found",
                404
            )
        )

    return employee, None


def employee_can_access(
    user,
    employee_id
):
    return (
        user.is_admin
        or user.employee_id == employee_id
    )


def decimal_money(value):
    if value is None:
        return Decimal("0.00")

    return Decimal(
        str(value)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


def decimal_hours(value):
    if value is None:
        return Decimal("0.00")

    return Decimal(
        str(value)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


def time_to_seconds(value):
    if value is None:
        return 0

    return (
        value.hour * 3600
        + value.minute * 60
        + value.second
    )


def calculate_break_hours(
    time_log
):
    total_seconds = 0

    for break_record in time_log.breaks:
        if (
            break_record.start_time is None
            or break_record.end_time is None
        ):
            continue

        start = time_to_seconds(
            break_record.start_time
        )

        end = time_to_seconds(
            break_record.end_time
        )

        duration = end - start

        if duration < 0:
            duration += 24 * 60 * 60

        total_seconds += duration

    return round(
        total_seconds / 3600,
        2
    )


def calculate_worked_hours(
    time_log
):
    if (
        time_log.clock_in is None
        or time_log.clock_out is None
    ):
        return 0

    total_seconds = (
        time_log.clock_out -
        time_log.clock_in
    ).total_seconds()

    gross_hours = (
        total_seconds / 3600
    )

    break_hours = calculate_break_hours(
        time_log
    )

    return max(
        round(
            gross_hours -
            break_hours,
            2
        ),
        0
    )


def format_hours(
    hours
):
    total_minutes = round(
        float(hours) * 60
    )

    whole_hours = (
        total_minutes // 60
    )

    minutes = (
        total_minutes % 60
    )

    return (
        f"{whole_hours}h "
        f"{minutes:02d}m"
    )


def calculate_payroll_amounts(
    employee,
    total_hours
):
    total_hours = decimal_hours(
        total_hours
    )

    standard_hours = decimal_hours(
        employee.standard_hours
    )

    standard_rate = decimal_money(
        employee.pay_rate
    )

    overtime_rate = decimal_money(
        employee.overtime_pay_rate
    )

    regular_hours = min(
        total_hours,
        standard_hours
    )

    overtime_hours = max(
        total_hours -
        standard_hours,
        Decimal("0.00")
    )

    regular_pay = (
        regular_hours *
        standard_rate
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    overtime_pay = (
        overtime_hours *
        overtime_rate
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    gross_pay = (
        regular_pay +
        overtime_pay
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    return {
        "regular_hours": regular_hours,
        "overtime_hours": overtime_hours,
        "regular_rate": standard_rate,
        "overtime_rate": overtime_rate,
        "regular_pay": regular_pay,
        "overtime_pay": overtime_pay,
        "gross_pay": gross_pay
    }


def calculate_employee_hours(
    employee_id,
    period_start,
    period_end
):
    time_logs = TimeLog.query.filter(
        TimeLog.employee_id == employee_id,
        TimeLog.date >= period_start,
        TimeLog.date <= period_end,
        TimeLog.clock_out.isnot(None)
    ).all()

    total_hours = Decimal("0.00")

    for time_log in time_logs:
        total_hours += Decimal(
            str(
                calculate_worked_hours(
                    time_log
                )
            )
        )

    return decimal_hours(
        total_hours
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
    data = get_request_data()

    login_id = str(
        data.get(
            "login_id",
            ""
        )
    ).strip()

    password = data.get(
        "password",
        ""
    )

    if not login_id or not password:
        return error_response(
            "User ID and password are required"
        )

    user = User.query.filter_by(
        login_id=login_id
    ).first()

    if user is None:
        return error_response(
            "Invalid user ID or password",
            401
        )

    if not user.check_password(
        password
    ):
        return error_response(
            "Invalid user ID or password",
            401
        )

    employee = user.employee

    if employee is None:
        return error_response(
            "Employee account not found",
            404
        )

    if employee.status.lower() != "active":
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
def get_employee_count():
    user, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    count = Employee.query.filter_by(
        status="Active"
    ).count()

    return jsonify({
        "employee_count": count
    }), 200


@main_bp.get("/api/employees")
def get_employees():
    user, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    employees = Employee.query.order_by(
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

    if not employee_can_access(
        user,
        employee_id
    ):
        return error_response(
            "You can only view your own employee record",
            403
        )

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

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

    data = get_request_data()

    required_fields = [
        "first_name",
        "last_name",
        "email",
        "password",
        "user_id",
        "role",
        "employee_role",
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

    email = str(
        data["email"]
    ).strip().lower()

    login_id = str(
        data["user_id"]
    ).strip()

    password = str(
        data["password"]
    )

    if len(password) < 8:
        return error_response(
            "Password must contain at least 8 characters"
        )

    if Employee.query.filter_by(
        email=email
    ).first() is not None:
        return error_response(
            "This email already exists",
            409
        )

    if User.query.filter_by(
        login_id=login_id
    ).first() is not None:
        return error_response(
            "This User ID already exists",
            409
        )

    try:
        hire_date = parse_date(
            data["hire_date"],
            "hire_date"
        )

        employee_code = (
            f"{str(data['last_name']).strip()[:3].upper()}"
            f"{hire_date.strftime('%d%m')}"
        )

        if Employee.query.filter_by(
            employee_code=employee_code
        ).first() is not None:
            return error_response(
                (
                    "Generated employee ID "
                    f"{employee_code} already exists"
                ),
                409
            )

        employee = Employee(
            employee_code=employee_code,
            first_name=str(
                data["first_name"]
            ).strip(),
            last_name=str(
                data["last_name"]
            ).strip(),
            email=email,
            phone=data.get("phone"),
            role=str(
                data["employee_role"]
            ).strip(),
            contract_type=data[
                "contract_type"
            ],
            standard_hours=data[
                "standard_hours"
            ],
            pay_rate=data[
                "pay_rate"
            ],
            overtime_pay_rate=data[
                "overtime_pay_rate"
            ],
            status=data.get(
                "status",
                "Active"
            ),
            hire_date=hire_date
        )

        db.session.add(
            employee
        )

        db.session.flush()

        user = User(
            login_id=login_id,
            employee_id=employee.employee_id,
            role=str(
                data["role"]
            ).strip()
        )

        user.set_password(
            password
        )

        db.session.add(
            user
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Employee and login account created successfully"
            ),
            "employee": employee.to_dict(),
            "user": user.to_dict()
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


@main_bp.put(
    "/api/employees/<int:employee_id>"
)
def update_employee(employee_id):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

    data = get_request_data()

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

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

    try:
        db.session.delete(
            employee
        )

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


@main_bp.post(
    "/api/employees/<int:employee_id>/login-account"
)
def create_employee_login_account(
    employee_id
):
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

    existing_user = User.query.filter_by(
        employee_id=employee.employee_id
    ).first()

    if existing_user is not None:
        return error_response(
            "This employee already has login credentials",
            409
        )

    data = get_request_data()

    login_id = str(
        data.get(
            "user_id",
            ""
        )
    ).strip()

    password = str(
        data.get(
            "password",
            ""
        )
    )

    role = str(
        data.get(
            "role",
            "Staff"
        )
    ).strip()

    if not login_id:
        return error_response(
            "User ID is required"
        )

    if len(password) < 8:
        return error_response(
            "Password must contain at least 8 characters"
        )

    if User.query.filter_by(
        login_id=login_id
    ).first() is not None:
        return error_response(
            "This User ID already exists",
            409
        )

    try:
        user = User(
            login_id=login_id,
            employee_id=employee.employee_id,
            role=role
        )

        user.set_password(
            password
        )

        db.session.add(
            user
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Login account created successfully"
            ),
            "employee": employee.to_dict(),
            "user": user.to_dict()
        }), 201

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

    employee_id = request.args.get(
        "employee_id",
        type=int
    )

    query = Shift.query

    if user.is_admin:
        if employee_id is not None:
            query = query.filter(
                Shift.employee_id ==
                employee_id
            )

    else:
        query = query.filter(
            Shift.employee_id ==
            user.employee_id
        )

    shifts = query.order_by(
        Shift.date,
        Shift.start_time
    ).all()

    return jsonify([
        shift.to_dict()
        for shift in shifts
    ]), 200


@main_bp.post("/api/shifts")
def create_shift():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    data = get_request_data()

    try:
        employee_id = parse_integer(
            data.get("employee_id"),
            "employee_id"
        )

        shift_date = parse_date(
            data.get("date"),
            "date"
        )

        start_time = parse_time(
            data.get("start_time"),
            "start_time"
        )

        end_time = parse_time(
            data.get("end_time"),
            "end_time"
        )

    except ValueError as error:
        return error_response(
            str(error)
        )

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

    if end_time <= start_time:
        return error_response(
            "end_time must be later than start_time"
        )

    shift = Shift(
        employee_id=employee_id,
        date=shift_date,
        start_time=start_time,
        end_time=end_time,
        status=data.get(
            "status",
            "Scheduled"
        )
    )

    try:
        db.session.add(
            shift
        )

        db.session.commit()

        return jsonify(
            shift.to_dict()
        ), 201

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
        db.session.delete(
            shift
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Shift deleted successfully"
            )
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

    employee_id = request.args.get(
        "employee_id",
        type=int
    )

    query = TimeLog.query

    if user.is_admin:
        if employee_id is not None:
            query = query.filter(
                TimeLog.employee_id ==
                employee_id
            )

    else:
        query = query.filter(
            TimeLog.employee_id ==
            user.employee_id
        )

    time_logs = query.order_by(
        TimeLog.clock_in.desc()
    ).all()

    return jsonify([
        time_log.to_dict()
        for time_log in time_logs
    ]), 200


@main_bp.post(
    "/api/timelogs/clock-in"
)
def clock_in():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    data = get_request_data()

    if user.is_admin:
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
            employee_id = parse_integer(
                employee_id,
                "employee_id"
            )

        except ValueError as error:
            return error_response(
                str(error)
            )

    else:
        employee_id = user.employee_id

    employee, response = (
        get_employee_or_404(
            employee_id
        )
    )

    if response is not None:
        return response

    existing_log = TimeLog.query.filter(
        TimeLog.employee_id == employee_id,
        TimeLog.clock_out.is_(None)
    ).first()

    if existing_log is not None:
        return error_response(
            "This employee is already clocked in",
            409
        )

    now = datetime.now()

    time_log = TimeLog(
        employee_id=employee_id,
        clock_in=now,
        date=now.date()
    )

    try:
        db.session.add(
            time_log
        )

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

    if not employee_can_access(
        user,
        time_log.employee_id
    ):
        return error_response(
            "You cannot access this time log",
            403
        )

    if time_log.clock_out is not None:
        return error_response(
            "This time log is already closed",
            409
        )

    time_log.clock_out = datetime.now()

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


@main_bp.get("/api/hours")
def get_hours():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    try:
        from_date = parse_date(
            request.args.get("from_date"),
            "from_date"
        )

        to_date = parse_date(
            request.args.get("to_date"),
            "to_date"
        )

    except ValueError as error:
        return error_response(
            str(error)
        )

    employee_id = request.args.get(
        "employee_id",
        type=int
    )

    if not user.is_admin:
        employee_id = user.employee_id

    query = Employee.query

    if employee_id is not None:
        query = query.filter(
            Employee.employee_id ==
            employee_id
        )

    employees = query.all()

    results = []
    total_hours = Decimal("0.00")

    for employee in employees:
        employee_hours = Decimal("0.00")

        logs = TimeLog.query.filter(
            TimeLog.employee_id ==
            employee.employee_id,
            TimeLog.date >= from_date,
            TimeLog.date <= to_date
        ).all()

        for time_log in logs:
            employee_hours += Decimal(
                str(
                    calculate_worked_hours(
                        time_log
                    )
                )
            )

        employee_hours = decimal_hours(
            employee_hours
        )

        total_hours += employee_hours

        results.append({
            "employee_id": employee.employee_id,
            "display_id": employee.display_id,
            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),
            "role": employee.role,
            "total_hours": float(
                employee_hours
            ),
            "total_hours_display": format_hours(
                employee_hours
            )
        })

    total_hours = decimal_hours(
        total_hours
    )

    return jsonify({
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "total_hours": float(
            total_hours
        ),
        "total_hours_display": format_hours(
            total_hours
        ),
        "employees": results
    }), 200


@main_bp.get("/api/payroll")
def get_payroll():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    try:
        period_start = parse_date(
            request.args.get("period_start"),
            "period_start"
        )

        period_end = parse_date(
            request.args.get("period_end"),
            "period_end"
        )

    except ValueError as error:
        return error_response(
            str(error)
        )

    if period_end < period_start:
        return error_response(
            "period_end cannot be before period_start"
        )

    employee_id = request.args.get(
        "employee_id",
        type=int
    )

    if not user.is_admin:
        employee_id = user.employee_id

    query = Employee.query

    if employee_id is not None:
        query = query.filter(
            Employee.employee_id ==
            employee_id
        )

    employees = query.all()

    results = []

    total_hours = Decimal("0.00")
    total_gross_pay = Decimal("0.00")

    for employee in employees:
        employee_hours = calculate_employee_hours(
            employee.employee_id,
            period_start,
            period_end
        )

        amounts = calculate_payroll_amounts(
            employee,
            employee_hours
        )

        total_hours += employee_hours
        total_gross_pay += amounts[
            "gross_pay"
        ]

        results.append({
            "employee_id": employee.employee_id,
            "display_id": employee.display_id,
            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),
            "total_hours": float(
                employee_hours
            ),
            "total_hours_display": format_hours(
                employee_hours
            ),
            "regular_hours": float(
                amounts["regular_hours"]
            ),
            "overtime_hours": float(
                amounts["overtime_hours"]
            ),
            "regular_rate": float(
                amounts["regular_rate"]
            ),
            "overtime_rate": float(
                amounts["overtime_rate"]
            ),
            "regular_pay": float(
                amounts["regular_pay"]
            ),
            "overtime_pay": float(
                amounts["overtime_pay"]
            ),
            "gross_pay": float(
                amounts["gross_pay"]
            ),
            "gross_pay_display": (
                f"${amounts['gross_pay']:.2f}"
            )
        })

    total_hours = decimal_hours(
        total_hours
    )

    total_gross_pay = decimal_money(
        total_gross_pay
    )

    return jsonify({
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "total_hours": float(
            total_hours
        ),
        "total_hours_display": format_hours(
            total_hours
        ),
        "total_gross_pay": float(
            total_gross_pay
        ),
        "total_gross_pay_display": (
            f"${total_gross_pay:.2f}"
        ),
        "employees": results
    }), 200


@main_bp.post(
    "/api/payroll/generate"
)
def generate_payroll():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    data = get_request_data()

    try:
        period_start = parse_date(
            data.get("period_start"),
            "period_start"
        )

        period_end = parse_date(
            data.get("period_end"),
            "period_end"
        )

    except ValueError as error:
        return error_response(
            str(error)
        )

    if period_end < period_start:
        return error_response(
            "period_end cannot be before period_start"
        )

    employee_id = data.get(
        "employee_id"
    )

    query = Employee.query

    if employee_id not in (
        None,
        "",
        0
    ):
        try:
            employee_id = parse_integer(
                employee_id,
                "employee_id"
            )

        except ValueError as error:
            return error_response(
                str(error)
            )

        query = query.filter(
            Employee.employee_id ==
            employee_id
        )

    employees = query.all()

    if not employees:
        return error_response(
            "No employees found",
            404
        )

    records = []

    try:
        for employee in employees:
            employee_hours = calculate_employee_hours(
                employee.employee_id,
                period_start,
                period_end
            )

            amounts = calculate_payroll_amounts(
                employee,
                employee_hours
            )

            record = PayrollRecord.query.filter_by(
                employee_id=employee.employee_id,
                period_start=period_start,
                period_end=period_end
            ).first()

            if record is None:
                record = PayrollRecord(
                    employee_id=employee.employee_id,
                    period_start=period_start,
                    period_end=period_end,
                    total_hours=employee_hours,
                    gross_pay=amounts[
                        "gross_pay"
                    ],
                    status="Calculated"
                )

                db.session.add(
                    record
                )

            else:
                record.total_hours = (
                    employee_hours
                )

                record.gross_pay = (
                    amounts["gross_pay"]
                )

                record.status = (
                    "Calculated"
                )

            records.append(
                record
            )

        db.session.commit()

        return jsonify({
            "message": (
                "Payroll generated successfully"
            ),
            "records": [
                record.to_dict()
                for record in records
            ]
        }), 201

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            500
        )


@main_bp.get(
    "/api/compliance/exceptions"
)
def get_compliance_exceptions():
    user, response = (
        require_authenticated_user()
    )

    if response is not None:
        return response

    status = request.args.get(
        "status"
    )

    query = ComplianceException.query

    if not user.is_admin:
        query = query.filter(
            ComplianceException.employee_id ==
            user.employee_id
        )

    if status:
        query = query.filter(
            ComplianceException.status ==
            status
        )

    exceptions = query.order_by(
        ComplianceException.exception_id.desc()
    ).all()

    return jsonify([
        exception.to_dict()
        for exception in exceptions
    ]), 200


@main_bp.get(
    "/api/admin-adjustments"
)
def get_admin_adjustments():
    admin, response = (
        require_admin_user()
    )

    if response is not None:
        return response

    adjustments = AdminAdjustment.query.order_by(
        AdminAdjustment.timestamp.desc()
    ).all()

    return jsonify([
        adjustment.to_dict()
        for adjustment in adjustments
    ]), 200


@main_bp.post(
    "/api/timelogs/<int:timelog_id>/adjust"
)
def adjust_time_log(timelog_id):
    admin, response = (
        require_admin_user()
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

    data = get_request_data()

    reason = str(
        data.get(
            "reason",
            ""
        )
    ).strip()

    if not reason:
        return error_response(
            "reason is required"
        )

    before_value = str(
        time_log.to_dict()
    )

    try:
        if data.get("clock_in"):
            time_log.clock_in = (
                datetime.fromisoformat(
                    data["clock_in"]
                )
            )

        if "clock_out" in data:
            time_log.clock_out = (
                datetime.fromisoformat(
                    data["clock_out"]
                )
                if data["clock_out"]
                else None
            )

        if data.get("date"):
            time_log.date = parse_date(
                data["date"],
                "date"
            )

        if (
            time_log.clock_out is not None
            and time_log.clock_out <
            time_log.clock_in
        ):
            return error_response(
                "clock_out cannot be before clock_in"
            )

        after_value = str(
            time_log.to_dict()
        )

        adjustment = AdminAdjustment(
            timelog_id=timelog_id,
            before_value=before_value,
            after_value=after_value,
            reason=reason,
            adjusted_by=(
                admin.employee.email
                if admin.employee
                else str(admin.user_id)
            ),
            timestamp=datetime.now()
        )

        db.session.add(
            adjustment
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Time log adjusted successfully"
            ),
            "timelog": time_log.to_dict(),
            "adjustment": adjustment.to_dict()
        }), 200

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