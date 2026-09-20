from flask import Blueprint, jsonify

main_bp = Blueprint("main", __name__)


@main_bp.get("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Farm Time Management API is running"
    }), 200