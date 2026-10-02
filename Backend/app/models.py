from datetime import date
from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash

from .extensions import db


class Employee(db.Model):
    __tablename__ = "employees"

    employee_id = db.Column(
        db.Integer,
        primary_key=True
    )

    first_name = db.Column(
        db.String(50),
        nullable=False
    )

    last_name = db.Column(
        db.String(50),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    role = db.Column(
        db.String(50),
        nullable=False
    )

    contract_type = db.Column(
        db.String(30),
        nullable=False
    )

    standard_hours = db.Column(
        db.Float,
        nullable=False
    )

    pay_rate = db.Column(
        db.Float,
        nullable=False
    )

    overtime_pay_rate = db.Column(
        db.Float,
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Active"
    )

    hire_date = db.Column(
        db.Date,
        nullable=False,
        default=date.today
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "employee_id": self.employee_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "contract_type": self.contract_type,
            "standard_hours": self.standard_hours,
            "pay_rate": self.pay_rate,
            "overtime_pay_rate": self.overtime_pay_rate,
            "status": self.status,
            "hire_date": (
                self.hire_date.isoformat()
                if self.hire_date
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }


class AdminUser(UserMixin, db.Model):
    __tablename__ = "admin_users"

    admin_id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    role = db.Column(
        db.String(30),
        nullable=False,
        default="Admin"
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password,
            method="scrypt"
        )

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password
        )

    def get_id(self):
        return str(self.admin_id)

    def to_dict(self):
        return {
            "admin_id": self.admin_id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }