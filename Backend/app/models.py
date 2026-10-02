from datetime import date, datetime, timezone

from .extensions import db


class Employee(db.Model):
    __tablename__ = "employee"

    employee_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    role = db.Column(db.String(50), nullable=False)
    contract_type = db.Column(db.String(20), nullable=False)
    standard_hours = db.Column(db.Numeric(5, 2), nullable=False)
    pay_rate = db.Column(db.Numeric(10, 2), nullable=False)
    overtime_pay_rate = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Active")
    hire_date = db.Column(db.Date, nullable=False, default=date.today)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User",
        back_populates="employee",
        uselist=False
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
            "standard_hours": float(self.standard_hours),
            "pay_rate": float(self.pay_rate),
            "overtime_pay_rate": float(self.overtime_pay_rate),
            "status": self.status,
            "hire_date": (
                self.hire_date.isoformat()
                if self.hire_date else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            )
        }


class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employee.employee_id"),
        unique=True,
        nullable=False
    )
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Admin")

    employee = db.relationship(
        "Employee",
        back_populates="user"
    )