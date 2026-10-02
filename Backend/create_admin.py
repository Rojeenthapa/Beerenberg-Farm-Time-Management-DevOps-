import getpass

from app import create_app
from app.extensions import db
from app.models import AdminUser


def main():
    app = create_app()

    with app.app_context():
        db.create_all()

        email = input(
            "Admin email: "
        ).strip().lower()

        full_name = input(
            "Admin full name: "
        ).strip()

        password = getpass.getpass(
            "Admin password: "
        )

        confirm_password = getpass.getpass(
            "Confirm admin password: "
        )

        if not email or not full_name:
            raise ValueError(
                "Email and full name are required."
            )

        if len(password) < 8:
            raise ValueError(
                "Password must contain at least 8 characters."
            )

        if password != confirm_password:
            raise ValueError(
                "Passwords do not match."
            )

        existing_admin = AdminUser.query.filter_by(
            email=email
        ).first()

        if existing_admin:
            raise ValueError(
                "An admin with this email already exists."
            )

        admin = AdminUser(
            email=email,
            full_name=full_name,
            role="Admin",
            is_active=True
        )

        admin.set_password(
            password
        )

        db.session.add(admin)
        db.session.commit()

        print(
            "Admin account created successfully."
        )


if __name__ == "__main__":
    main()