import os

from flask import Flask
from flask_cors import CORS

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
            "development-secret-change-before-deployment"
        ),
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL",
            (
                "mysql+pymysql://root:"
                "Parthiv%40admin@127.0.0.1:3306/"
                "beerenberg_tms"
            )
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://127.0.0.1:5173",
                    "http://localhost:5173"
                ]
            }
        }
    )

    db.init_app(app)
    migrate.init_app(app, db)

    from . import models
    from .routes import main_bp

    app.register_blueprint(
        main_bp
    )

    return app