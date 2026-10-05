import json
import threading
from urllib.request import urlopen

import pytest
from sqlalchemy import inspect
from werkzeug.serving import make_server

from app import create_app
from app.extensions import db
from app.models import Employee
from create_admin import create_local_admin


def test_testing_ignores_development_database_credentials(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "mysql+pymysql://invalid:invalid@invalid/dev")
    monkeypatch.setenv("SECRET_KEY", "development-secret")
    app = create_app("testing")
    assert app.config["SQLALCHEMY_DATABASE_URI"] == "sqlite:///:memory:"
    assert app.config["TESTING"] is True
    assert app.config["DEBUG"] is False
    assert app.config["SECRET_KEY"] != "development-secret"
    assert app.test_client().get("/api/health").status_code == 200


def test_testing_rejects_database_override():
    with pytest.raises(ValueError, match="in-memory"):
        create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///dev.db"})


def test_environment_variable_selects_testing(monkeypatch):
    monkeypatch.setenv("APP_ENV", "testing")
    assert create_app().config["TESTING"]


def test_unknown_environment_fails_fast():
    with pytest.raises(ValueError, match="APP_ENV"):
        create_app("typo")


def test_default_development_config(monkeypatch):
    from app.config import build_config
    monkeypatch.delenv("DATABASE_URL", raising=False)
    config = build_config("development")
    assert config["SQLALCHEMY_DATABASE_URI"] == "sqlite:///beerenberg_dev.db"
    assert config["DEBUG"] is False
    assert config["TESTING"] is False


def test_application_instances_have_independent_databases(app):
    with app.app_context():
        db.session.execute(db.text("CREATE TABLE isolation_probe (id INTEGER)"))
        db.session.commit()
    second = create_app("testing")
    with second.app_context():
        assert "isolation_probe" not in inspect(db.engine).get_table_names()
        db.engine.dispose()


def test_current_model_tables_can_be_created(app):
    with app.app_context():
        tables = set(inspect(db.engine).get_table_names())
        assert tables == set(db.metadata.tables)
        assert "employee" in tables and "user" in tables and "payrollrecord" in tables
        assert Employee.query.count() == 0


def test_health_reports_connected_database(app):
    response = app.test_client().get("/api/health")
    assert response.status_code == 200
    assert response.json["database"] == "connected"


def test_cors_accepts_local_frontend_and_rejects_other_origins(app):
    client = app.test_client()
    accepted = client.get("/api/health", headers={"Origin": "http://127.0.0.1:5173"})
    assert accepted.headers["Access-Control-Allow-Origin"] == "http://127.0.0.1:5173"
    rejected = client.get("/api/health", headers={"Origin": "https://unrelated.example"})
    assert "Access-Control-Allow-Origin" not in rejected.headers


def test_dev_database_initializer_refuses_testing(app):
    result = app.test_cli_runner().invoke(args=["init-dev-db"])
    assert result.exit_code != 0
    assert "only for local development" in result.output


def test_dev_database_initializer_creates_current_schema_and_retains_data(tmp_path):
    app = create_app("development", {"SQLALCHEMY_DATABASE_URI": f"sqlite:///{tmp_path / 'dev.db'}"})
    runner = app.test_cli_runner()
    assert runner.invoke(args=["init-dev-db"]).exit_code == 0
    with app.app_context():
        db.session.execute(db.text("CREATE TABLE retained_data (id INTEGER)"))
        db.session.execute(db.text("INSERT INTO retained_data VALUES (42)"))
        db.session.commit()
    assert runner.invoke(args=["init-dev-db"]).exit_code == 0
    with app.app_context():
        assert db.session.execute(db.text("SELECT id FROM retained_data")).scalar() == 42
        db.session.remove()
        db.engine.dispose()


def test_demo_admin_bootstrap_uses_existing_models_and_authentication(tmp_path):
    app = create_app("development", {"SQLALCHEMY_DATABASE_URI": f"sqlite:///{tmp_path / 'demo.db'}"})
    assert app.test_cli_runner().invoke(args=["init-dev-db"]).exit_code == 0
    create_local_admin(app, "demo@example.test", "Demo Admin", "demo-password-123")
    response = app.test_client().post("/api/login", json={
        "login_id": "demo@example.test", "password": "demo-password-123"
    })
    assert response.status_code == 200
    assert response.json["user"]["is_admin"] is True
    assert response.json["access_token"]
    with pytest.raises(ValueError, match="already exists"):
        create_local_admin(app, "demo@example.test", "Demo Admin", "demo-password-123")
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


def test_demo_admin_bootstrap_refuses_test_environment(app):
    with pytest.raises(ValueError, match="only for local development"):
        create_local_admin(app, "demo@example.test", "Demo Admin", "demo-password-123")


def test_real_http_server_starts(app):
    server = make_server("127.0.0.1", 0, app)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urlopen(f"http://127.0.0.1:{server.server_port}/api/health", timeout=5) as response:
            assert response.status == 200
            assert json.load(response)["database"] == "connected"
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def test_production_requires_explicit_configuration(monkeypatch):
    for key in ("DATABASE_URL", "SECRET_KEY", "JWT_SECRET_KEY", "CORS_ORIGINS"):
        monkeypatch.delenv(key, raising=False)
    from app.config import build_config
    with pytest.raises(ValueError, match="Production requires"):
        build_config("production")
