from flask import Blueprint, request
from project.services.play_history_service import PlayHistoryService
from project.utils.auth import login_required, current_user_id
from project.utils.response import success

play_history_bp = Blueprint("play_history", __name__)
service = PlayHistoryService()


@play_history_bp.route("/recent", methods=["GET"])
@login_required
def recent():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    return success(service.list_recent(current_user_id(), page, page_size))


@play_history_bp.route("/summary", methods=["GET"])
@login_required
def summary():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    return success(service.list_summary(current_user_id(), page, page_size))


@play_history_bp.route("/external", methods=["GET"])
@login_required
def external():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    return success(service.list_external(current_user_id(), page, page_size))


@play_history_bp.route("/all", methods=["GET"])
@login_required
def all_records():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 30)), 100)
    return success(service.list_all_merged(current_user_id(), page, page_size))


@play_history_bp.route("/song/<int:song_id>/timestamps", methods=["GET"])
@login_required
def song_timestamps(song_id):
    data = service.get_song_timestamps(current_user_id(), song_id)
    if not data:
        return success({"timestamps": [], "play_count": 0})
    return success(data)


@play_history_bp.route("/record", methods=["POST"])
@login_required
def record_play():
    """记录播放事件，用于排行榜计算"""
    song_id = request.json.get("song_id")
    if not song_id:
        return success({"success": False, "message": "缺少 song_id"}, 400)
    service.record_play_event(current_user_id(), song_id)
    return success({"success": True})
