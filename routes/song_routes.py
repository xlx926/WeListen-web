import mimetypes
import os
from flask import Blueprint, request, send_file, session
from project.services.song_service import SongService
from project.utils.auth import login_required, admin_required, current_user_id
from project.utils.response import success, error

song_bp = Blueprint("songs", __name__)
song_service = SongService()


@song_bp.route("/upload", methods=["POST"])
@login_required
def upload():
    if "file" not in request.files:
        return error("请上传音频文件", code=400)
    title = (request.form.get("title") or "").strip()
    artist = (request.form.get("artist") or "").strip()
    duration = request.form.get("duration_seconds", 0)
    if not title:
        return error("歌曲标题不能为空", code=400)

    user_id = session.get("user_id")
    is_admin = session.get("role") == "admin"
    song, err = song_service.upload_song(
        request.files["file"], title, artist, duration, uploader_id=user_id
    )
    if err:
        return error(err, code=500)
    return success(song, message="上传成功", code=201)


@song_bp.route("/<int:song_id>/offline", methods=["POST"])
@login_required
def offline(song_id):
    user_id = session.get("user_id")
    is_admin = session.get("role") == "admin"
    result, err = song_service.offline_song(song_id, user_id=user_id, is_admin=is_admin)
    if err:
        return error(err, code=403 if "只能下架自己上传" in err else 404)
    return success(result, message="歌曲已下架")


@song_bp.route("/my-uploads", methods=["GET"])
@login_required
def my_uploads():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    data = song_service.list_user_uploads(session.get("user_id"), page, page_size)
    return success(data)


@song_bp.route("", methods=["GET"])
def list_songs():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    order_by = request.args.get("order_by", "weight")
    status = request.args.get("status", "online")
    data = song_service.list_songs(status=status, page=page, page_size=page_size, order_by=order_by)
    return success(data)


@song_bp.route("/search", methods=["GET"])
def search_songs():
    q = (request.args.get("q") or "").strip()
    if not q:
        return error("请输入搜索关键词", code=400)
    page = int(request.args.get("page", 1))
    return success(song_service.search(q, page))


@song_bp.route("/<int:song_id>", methods=["GET"])
def get_song(song_id):
    song = song_service.get_song(song_id, online_only=True)
    if not song:
        return error("歌曲不存在或已下架", code=404)
    return success(song)


@song_bp.route("/<int:song_id>/play", methods=["POST"])
def play(song_id):
    user_id = session.get("user_id")
    song, err = song_service.play_song(song_id, user_id)
    if err:
        return error(err, code=404)
    return success(song, message="播放记录已更新")


@song_bp.route("/<int:song_id>/stream", methods=["GET"])
def stream(song_id):
    path = song_service.get_file_path(song_id)
    if not path or not os.path.isfile(path):
        return error("歌曲不存在或已下架", code=404)
    mimetype = mimetypes.guess_type(path)[0] or "audio/mpeg"
    return send_file(path, conditional=True, mimetype=mimetype)


@song_bp.route("/<int:song_id>/favorite", methods=["POST"])
@login_required
def add_favorite(song_id):
    result, err = song_service.add_favorite(current_user_id(), song_id)
    if err:
        return error(err, code=404)
    return success(result, message="收藏成功")


@song_bp.route("/<int:song_id>/favorite", methods=["DELETE"])
@login_required
def remove_favorite(song_id):
    result, _ = song_service.remove_favorite(current_user_id(), song_id)
    return success(result, message="已取消收藏")


@song_bp.route("/favorites", methods=["GET"])
@login_required
def list_favorites():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 20)), 100)
    data = song_service.list_favorites(current_user_id(), page, page_size)
    return success(data)
