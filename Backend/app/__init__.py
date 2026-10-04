import os

from flask import Flask

from .extensions import cors
from .extensions import db
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
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root:password@127.0.0.1:3306/beerenberg_tms"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    db.init_app(app)
    migrate.init_app(app, db)

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