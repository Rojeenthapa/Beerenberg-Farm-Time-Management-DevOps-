import os

from flask import Flask

from .extensions import db, migrate


def create_app():
    app = Flask(__name__, instance_relative_config=True)

    os.makedirs(app.instance_path, exist_ok=True)

    app.config.from_mapping(
        SECRET_KEY=os.getenv(
            "SECRET_KEY",
            "development-secret-change-before-deployment"
        ),
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL",
            "sqlite:///farm_time.db"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    db.init_app(app)
    migrate.init_app(app, db)

    from . import models
    from .routes import main_bp

    app.register_blueprint(main_bp)

    return app