from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash

from .extensions import db


class Employee(db.Model):
    __tablename__ = "employee"

    employee_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_code = db.Column(
        db.String(20),
        nullable=True,
        unique=True
    )

    first_name = db.Column(
        db.String(100),
        nullable=False
    )

    last_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    role = db.Column(
        db.String(100),
        nullable=False
    )

    contract_type = db.Column(
        db.String(50),
        nullable=False
    )

    standard_hours = db.Column(
        db.Numeric(5, 2),
        nullable=False
    )

    pay_rate = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    overtime_pay_rate = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Active"
    )

    hire_date = db.Column(
        db.Date,
        nullable=False
    )

    users = db.relationship(
        "User",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    credentials = db.relationship(
        "Credential",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    shifts = db.relationship(
        "Shift",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    time_logs = db.relationship(
        "TimeLog",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    payroll_records = db.relationship(
        "PayrollRecord",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    exceptions = db.relationship(
        "ComplianceException",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    @property
    def display_id(self):
        if self.employee_code:
            return self.employee_code

        surname_part = (
            self.last_name.strip()[:3].upper()
        )

        joining_part = self.hire_date.strftime(
            "%d%m"
        )

        return (
            f"{surname_part}"
            f"{joining_part}"
        )

    def to_dict(self):
        login_user = (
            self.users[0]
            if self.users
            else None
        )

        return {
            "employee_id": self.employee_id,
            "employee_code": self.employee_code,
            "display_id": self.display_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "name": (
                f"{self.first_name} "
                f"{self.last_name}"
            ),
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "contract_type": self.contract_type,
            "standard_hours": float(
                self.standard_hours or 0
            ),
            "pay_rate": float(
                self.pay_rate or 0
            ),
            "overtime_pay_rate": float(
                self.overtime_pay_rate or 0
            ),
            "status": self.status,
            "hire_date": (
                self.hire_date.isoformat()
                if self.hire_date
                else None
            ),
            "has_login_account": (
                login_user is not None
            ),
            "user_id": (
                login_user.user_id
                if login_user
                else None
            ),
            "login_id": (
                login_user.login_id
                if login_user
                else None
            ),
            "login_role": (
                login_user.role
                if login_user
                else None
            )
        }


class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(
        db.Integer,
        primary_key=True
    )

    login_id = db.Column(
        db.String(100),
        nullable=True,
        unique=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(100),
        nullable=False
    )

    employee = db.relationship(
        "Employee",
        back_populates="users"
    )

    @property
    def is_admin(self):
        return self.role.strip().lower() in {
            "admin",
            "administrator"
        }

    def set_password(self, password):
        self.password_hash = (
            generate_password_hash(
                password
            )
        )

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password
        )

    def to_dict(self):
        employee = self.employee

        return {
            "user_id": self.user_id,
            "login_id": self.login_id,
            "employee_id": self.employee_id,
            "employee_code": (
                employee.employee_code
                if employee
                else None
            ),
            "display_id": (
                employee.display_id
                if employee
                else None
            ),
            "first_name": (
                employee.first_name
                if employee
                else None
            ),
            "last_name": (
                employee.last_name
                if employee
                else None
            ),
            "email": (
                employee.email
                if employee
                else None
            ),
            "role": self.role,
            "is_admin": self.is_admin
        }


class Credential(db.Model):
    __tablename__ = "credential"

    credential_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    method_type = db.Column(
        db.String(50),
        nullable=False
    )

    external_ref = db.Column(
        db.String(255),
        nullable=False,
        unique=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Active"
    )

    issued_at = db.Column(
        db.DateTime,
        nullable=False
    )

    replaced_at = db.Column(
        db.DateTime,
        nullable=True
    )

    employee = db.relationship(
        "Employee",
        back_populates="credentials"
    )

    def to_dict(self):
        return {
            "credential_id": self.credential_id,
            "employee_id": self.employee_id,
            "method_type": self.method_type,
            "external_ref": self.external_ref,
            "status": self.status,
            "issued_at": (
                self.issued_at.isoformat()
                if self.issued_at
                else None
            ),
            "replaced_at": (
                self.replaced_at.isoformat()
                if self.replaced_at
                else None
            )
        }


class Shift(db.Model):
    __tablename__ = "shift"

    shift_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Scheduled"
    )

    employee = db.relationship(
        "Employee",
        back_populates="shifts"
    )

    def to_dict(self):
        return {
            "shift_id": self.shift_id,
            "employee_id": self.employee_id,
            "employee_name": (
                f"{self.employee.first_name} "
                f"{self.employee.last_name}"
                if self.employee
                else None
            ),
            "date": (
                self.date.isoformat()
                if self.date
                else None
            ),
            "start_time": (
                self.start_time.isoformat()
                if self.start_time
                else None
            ),
            "end_time": (
                self.end_time.isoformat()
                if self.end_time
                else None
            ),
            "status": self.status
        }


class TimeLog(db.Model):
    __tablename__ = "timelog"

    timelog_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    clock_in = db.Column(
        db.DateTime,
        nullable=False
    )

    clock_out = db.Column(
        db.DateTime,
        nullable=True
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    employee = db.relationship(
        "Employee",
        back_populates="time_logs"
    )

    breaks = db.relationship(
        "Break",
        back_populates="time_log",
        cascade="all, delete-orphan"
    )

    adjustments = db.relationship(
        "AdminAdjustment",
        back_populates="time_log",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "timelog_id": self.timelog_id,
            "employee_id": self.employee_id,
            "employee_name": (
                f"{self.employee.first_name} "
                f"{self.employee.last_name}"
                if self.employee
                else None
            ),
            "clock_in": (
                self.clock_in.isoformat()
                if self.clock_in
                else None
            ),
            "clock_out": (
                self.clock_out.isoformat()
                if self.clock_out
                else None
            ),
            "date": (
                self.date.isoformat()
                if self.date
                else None
            )
        }


class Break(db.Model):
    __tablename__ = "break"

    break_id = db.Column(
        db.Integer,
        primary_key=True
    )

    timelog_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "timelog.timelog_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=True
    )

    reason = db.Column(
        db.String(255),
        nullable=True
    )

    time_log = db.relationship(
        "TimeLog",
        back_populates="breaks"
    )

    def to_dict(self):
        return {
            "break_id": self.break_id,
            "timelog_id": self.timelog_id,
            "start_time": (
                self.start_time.isoformat()
                if self.start_time
                else None
            ),
            "end_time": (
                self.end_time.isoformat()
                if self.end_time
                else None
            ),
            "reason": self.reason
        }


class AdminAdjustment(db.Model):
    __tablename__ = "adminadjustment"

    adjustment_id = db.Column(
        db.Integer,
        primary_key=True
    )

    timelog_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "timelog.timelog_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    before_value = db.Column(
        db.String(255),
        nullable=False
    )

    after_value = db.Column(
        db.String(255),
        nullable=False
    )

    reason = db.Column(
        db.String(500),
        nullable=False
    )

    adjusted_by = db.Column(
        db.String(255),
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    time_log = db.relationship(
        "TimeLog",
        back_populates="adjustments"
    )

    def to_dict(self):
        return {
            "adjustment_id": self.adjustment_id,
            "timelog_id": self.timelog_id,
            "before_value": self.before_value,
            "after_value": self.after_value,
            "reason": self.reason,
            "adjusted_by": self.adjusted_by,
            "timestamp": (
                self.timestamp.isoformat()
                if self.timestamp
                else None
            )
        }


class PayrollRecord(db.Model):
    __tablename__ = "payrollrecord"

    payroll_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    period_start = db.Column(
        db.Date,
        nullable=False
    )

    period_end = db.Column(
        db.Date,
        nullable=False
    )

    total_hours = db.Column(
        db.Numeric(8, 2),
        nullable=False
    )

    gross_pay = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Pending"
    )

    employee = db.relationship(
        "Employee",
        back_populates="payroll_records"
    )

    def to_dict(self):
        return {
            "payroll_id": self.payroll_id,
            "employee_id": self.employee_id,
            "employee_name": (
                f"{self.employee.first_name} "
                f"{self.employee.last_name}"
                if self.employee
                else None
            ),
            "period_start": (
                self.period_start.isoformat()
                if self.period_start
                else None
            ),
            "period_end": (
                self.period_end.isoformat()
                if self.period_end
                else None
            ),
            "total_hours": float(
                self.total_hours or 0
            ),
            "gross_pay": float(
                self.gross_pay or 0
            ),
            "gross_pay_display": (
                f"${float(self.gross_pay or 0):.2f}"
            ),
            "status": self.status
        }


class ComplianceRule(db.Model):
    __tablename__ = "compliancerule"

    rule_id = db.Column(
        db.Integer,
        primary_key=True
    )

    rule_code = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    threshold_value = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    applies_to = db.Column(
        db.String(100),
        nullable=False
    )

    effective_from = db.Column(
        db.Date,
        nullable=False
    )

    effective_to = db.Column(
        db.Date,
        nullable=True
    )

    exceptions = db.relationship(
        "ComplianceException",
        back_populates="rule"
    )


class ComplianceException(db.Model):
    __tablename__ = "exception"

    exception_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "employee.employee_id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    rule_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "compliancerule.rule_id",
            ondelete="RESTRICT",
            onupdate="CASCADE"
        ),
        nullable=False
    )

    type = db.Column(
        db.String(100),
        nullable=False
    )

    severity = db.Column(
        db.String(30),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Open"
    )

    resolved_by = db.Column(
        db.String(255),
        nullable=True
    )

    resolved_at = db.Column(
        db.DateTime,
        nullable=True
    )

    employee = db.relationship(
        "Employee",
        back_populates="exceptions"
    )

    rule = db.relationship(
        "ComplianceRule",
        back_populates="exceptions"
    )