import os
from pathlib import Path

import click
from dotenv import load_dotenv
from flask import Flask

from .config import build_config
from .extensions import cors, db, jwt, migrate


def create_app(environment=None, config_overrides=None):
    """Create independent application instances for development and tests."""
    backend_dir = Path(__file__).resolve().parent.parent
    selected = environment or os.getenv("APP_ENV", "development")
    # Tests never load workstation credentials from dotenv files.
    if selected != "testing":
        load_dotenv(backend_dir / ".env", override=False)
    selected = environment or os.getenv("APP_ENV", "development")

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(build_config(selected))
    if config_overrides:
        app.config.update(config_overrides)
    if selected == "testing":
        if app.config["SQLALCHEMY_DATABASE_URI"] != "sqlite:///:memory:":
            raise ValueError("Testing must use a fresh in-memory SQLite database.")
        app.config.update(TESTING=True, DEBUG=False)

    os.makedirs(app.instance_path, exist_ok=True)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from . import models  # noqa: F401: register model metadata
    from .routes import main_bp

    app.register_blueprint(main_bp)

    @app.cli.command("init-dev-db")
    def init_dev_db():
        """Create current model tables in a disposable local SQLite database."""
        if app.config["APP_ENV"] != "development" or db.engine.dialect.name != "sqlite":
            raise click.ClickException("init-dev-db is only for local development SQLite.")
        db.create_all()
        click.echo("Local development tables created; existing data retained.")

    return app
