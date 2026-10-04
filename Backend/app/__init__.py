import os
from datetime import timedelta

from flask import Flask

from .extensions import cors
from .extensions import db
from .extensions import jwt
from .extensions import migrate


def create_app():
    app = Flask(
        __name__,
        instance_relative_config=True
    )

    os.makedirs(
        app.instance_path,
        exist_ok=True
    )

    app.config.from_mapping(
        SECRET_KEY=os.getenv(
            "SECRET_KEY",
            "change-this-secret-key"
        ),
        JWT_SECRET_KEY=os.getenv(
            "JWT_SECRET_KEY",
            "change-this-jwt-secret-key"
        ),
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(
            minutes=30
        ),
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root:password@127.0.0.1:3306/beerenberg_tms"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": "*"
            }
        }
    )

    from . import models

    from .routes import main_bp

    app.register_blueprint(
        main_bp
    )

    return app