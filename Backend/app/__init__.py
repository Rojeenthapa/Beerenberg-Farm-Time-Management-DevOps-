import os

from flask import Flask
from flask import jsonify

from .extensions import db
from .extensions import login_manager
from .extensions import migrate
from .models import AdminUser


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
            "sqlite:///farm_time.db"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        return jsonify({
            "error": "Authentication required."
        }), 401

    login_manager.login_view = None

    @login_manager.user_loader
    def load_admin(admin_id):
        return db.session.get(
            AdminUser,
            int(admin_id)
        )

    from .routes import main_bp

    app.register_blueprint(main_bp)

    return app