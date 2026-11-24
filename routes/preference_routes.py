from flask import Blueprint, request
from project.services.preference_service import PreferenceService
from project.utils.auth import login_required, current_user_id
from project.utils.response import success

preference_bp = Blueprint("preferences", __name__)
service = PreferenceService()


@preference_bp.route("/me", methods=["GET"])
@login_required
def my_preferences():
    return success(service.get_user_preferences(current_user_id()))


@preference_bp.route("/me/hours", methods=["GET"])
@login_required
def listening_hours():
    days = min(int(request.args.get("days", 30)), 365)
    return success(service.get_listening_hours(current_user_id(), days))
