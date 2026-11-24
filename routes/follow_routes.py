from flask import Blueprint, request
from project.services.follow_service import FollowService
from project.utils.auth import login_required, current_user_id
from project.utils.response import success, error

follow_bp = Blueprint("follow", __name__)
service = FollowService()


@follow_bp.route("/artists", methods=["POST"])
@login_required
def follow_artist():
    data = request.get_json(silent=True) or {}
    artist_id = data.get("artist_id")
    if not artist_id:
        return error("请提供 artist_id", code=400)
    result, err = service.follow(current_user_id(), int(artist_id))
    if err:
        return error(err, code=500)
    return success(result, message="关注成功")


@follow_bp.route("/artists/<int:artist_id>", methods=["DELETE"])
@login_required
def unfollow_artist(artist_id):
    result = service.unfollow(current_user_id(), artist_id)
    return success(result, message="已取消关注")


@follow_bp.route("/artists", methods=["GET"])
@login_required
def list_following():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    try:
        return success(service.list_following(current_user_id(), page, page_size))
    except Exception as e:
        return error(f"加载关注列表失败: {e}", code=500)


@follow_bp.route("/artists/count", methods=["GET"])
@login_required
def following_count():
    count = service.get_following_count(current_user_id())
    return success({"count": count})


@follow_bp.route("/artists/<int:artist_id>/status", methods=["GET"])
@login_required
def follow_status(artist_id):
    is_following = service.is_following(current_user_id(), artist_id)
    return success({"is_following": is_following})
