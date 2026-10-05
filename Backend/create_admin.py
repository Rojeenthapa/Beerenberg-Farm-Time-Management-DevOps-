"""Bootstrap a demo administrator in the disposable local development DB."""
import getpass
from datetime import date

from app import create_app
from app.extensions import db
from app.models import Employee, User


def create_local_admin(app, email, full_name, password):
    # Demo fields must never be inserted into a shared MySQL or production DB.
    if app.config["APP_ENV"] != "development":
        raise ValueError("Demo administrator setup is only for local development.")
    email = email.strip().lower()
    names = full_name.strip().split(maxsplit=1)
    if not email or "@" not in email or len(names) != 2:
        raise ValueError("Provide an email and a first and last name.")
    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")
    with app.app_context():
        if db.engine.dialect.name != "sqlite":
            raise ValueError("Demo administrator setup is only for local SQLite.")
        if Employee.query.filter_by(email=email).first() or User.query.filter_by(login_id=email).first():
            raise ValueError("This email already exists; no account was changed.")
        # Zero pay values are explicit demo fixtures, not real payroll data.
        employee = Employee(
            first_name=names[0], last_name=names[1], email=email,
            role="Admin", contract_type="Full Time", standard_hours=38,
            pay_rate=0, overtime_pay_rate=0, status="Active", hire_date=date.today(),
        )
        user = User(employee=employee, login_id=email, role="Admin")
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user.user_id


def main():
    app = create_app()
    email = input("Demo admin email (used as login ID): ")
    full_name = input("Demo admin first and last name: ")
    password = getpass.getpass("Demo admin password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise ValueError("Passwords do not match.")
    create_local_admin(app, email, full_name, password)
    print("Local demo administrator created. Log in using the email you entered.")


if __name__ == "__main__":
    main()
