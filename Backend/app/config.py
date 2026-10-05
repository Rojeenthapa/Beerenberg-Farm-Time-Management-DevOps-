import os
from datetime import timedelta


def build_config(environment):
    if environment not in {"development", "testing", "production"}:
        raise ValueError("APP_ENV must be development, testing, or production.")

    config = {
        "APP_ENV": environment,
        "DEBUG": False,
        "TESTING": environment == "testing",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_ACCESS_TOKEN_EXPIRES": timedelta(minutes=30),
        "CORS_ORIGINS": [origin.strip() for origin in os.getenv(
            "CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
        ).split(",") if origin.strip()],
    }
    if environment == "testing":
        config.update(
            SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
            SECRET_KEY="test-only-secret-key-not-for-production",
            JWT_SECRET_KEY="test-only-jwt-key-not-for-production",
        )
    elif environment == "development":
        config.update(
            SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL") or "sqlite:///beerenberg_dev.db",
            SECRET_KEY=os.getenv("SECRET_KEY") or "local-development-secret-key-only",
            JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY") or "local-development-jwt-secret-key-only",
        )
    else:
        values = {key: os.getenv(key, "").strip() for key in (
            "DATABASE_URL", "SECRET_KEY", "JWT_SECRET_KEY", "CORS_ORIGINS"
        )}
        if not all(values.values()):
            raise ValueError("Production requires DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY and CORS_ORIGINS.")
        if any(len(values[key]) < 32 or values[key].startswith(("local-", "test-", "change-"))
               for key in ("SECRET_KEY", "JWT_SECRET_KEY")):
            raise ValueError("Production keys must be unique secrets of at least 32 characters.")
        if "*" in config["CORS_ORIGINS"]:
            raise ValueError("Production CORS_ORIGINS must specify explicit frontend origins.")
        config.update(
            SQLALCHEMY_DATABASE_URI=values["DATABASE_URL"],
            SECRET_KEY=values["SECRET_KEY"],
            JWT_SECRET_KEY=values["JWT_SECRET_KEY"],
        )
    return config
