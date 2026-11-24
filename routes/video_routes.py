from flask import Blueprint, request, send_file, session
from project.services.video_service import VideoService
from project.utils.auth import login_required, admin_required, current_user_id
from project.utils.response import success, error

video_bp = Blueprint("videos", __name__)
service = VideoService()


@video_bp.route("/upload", methods=["POST"])
@admin_required
def upload():
    if "file" not in request.files:
        return error("请上传视频文件", code=400)
    title = (request.form.get("title") or "").strip()
    if not title:
        return error("视频标题不能为空", code=400)
    video, err = service.upload(
        request.files["file"], title,
        request.form.get("artist"), request.form.get("duration_seconds", 0),
        request.form.get("artist_id"),
    )
    if err:
        return error(err, code=500)
    return success(video, message="视频上传成功", code=201)


@video_bp.route("/<int:video_id>/offline", methods=["POST"])
@admin_required
def offline(video_id):
    result, err = service.offline(video_id)
    if err:
        return error(err, code=404)
    return success(result, message="视频已下架")


@video_bp.route("", methods=["GET"])
def list_videos():
    page = int(request.args.get("page", 1))
    order_by = request.args.get("order_by", "play_count")
    return success(service.list_videos(page, order_by=order_by))


@video_bp.route("/search", methods=["GET"])
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return error("请输入搜索关键词", code=400)
    return success(service.search(q, int(request.args.get("page", 1))))


@video_bp.route("/<int:video_id>", methods=["GET"])
def get_video(video_id):
    video = service.get(video_id, online_only=True)
    if not video:
        return error("视频不存在或已下架", code=404)
    return success(video)


@video_bp.route("/<int:video_id>/play", methods=["POST"])
def play(video_id):
    video, err = service.play(video_id, session.get("user_id"))
    if err:
        return error(err, code=404)
    return success(video, message="播放记录已更新")


@video_bp.route("/<int:video_id>/stream", methods=["GET"])
def stream(video_id):
    path = service.get_file_path(video_id)
    if not path:
        return error("视频不存在或已下架", code=404)
    return send_file(path, conditional=True)


@video_bp.route("/<int:video_id>/favorite", methods=["POST"])
@login_required
def add_fav(video_id):
    result, err = service.add_favorite(current_user_id(), video_id)
    if err:
        return error(err, code=404)
    return success(result, message="收藏成功")


@video_bp.route("/<int:video_id>/favorite", methods=["DELETE"])
@login_required
def remove_fav(video_id):
    return success(service.remove_favorite(current_user_id(), video_id)[0])


@video_bp.route("/favorites", methods=["GET"])
@login_required
def list_favs():
    return success(service.list_favorites(current_user_id()))


@video_bp.route("/rankings/weekly", methods=["GET"])
def weekly():
    return success(service.weekly_ranking(int(request.args.get("limit", 50))))


@video_bp.route("/rankings/monthly", methods=["GET"])
def monthly():
    return success(service.monthly_ranking(int(request.args.get("limit", 50))))
