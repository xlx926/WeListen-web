from flask import Blueprint, request
from project.services.playlist_service import PlaylistService
from project.utils.auth import login_required, current_user_id
from project.utils.response import success, error

playlist_bp = Blueprint("playlists", __name__)
playlist_service = PlaylistService()


@playlist_bp.route("", methods=["POST"])
@login_required
def create():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    if not name:
        return error("歌单名称不能为空", code=400)
    playlist, err = playlist_service.create_playlist(current_user_id(), name, description)
    if err:
        return error(err, code=500)
    return success(playlist, message="歌单创建成功", code=201)


@playlist_bp.route("", methods=["GET"])
@login_required
def list_mine():
    playlists = playlist_service.list_user_playlists(current_user_id())
    return success(playlists)


@playlist_bp.route("/<int:playlist_id>", methods=["GET"])
@login_required
def detail(playlist_id):
    playlist = playlist_service.get_playlist(playlist_id, current_user_id())
    if not playlist:
        return error("歌单不存在或无权限", code=404)
    return success(playlist)


@playlist_bp.route("/<int:playlist_id>/songs", methods=["POST"])
@login_required
def add_song(playlist_id):
    data = request.get_json(silent=True) or {}
    external_id = data.get("external_id")
    if external_id:
        playlist, err = playlist_service.add_external_song(
            playlist_id,
            current_user_id(),
            external_id,
            data.get("title"),
            data.get("artist"),
            data.get("platform") or "Neteasemusic",
        )
    else:
        song_id = data.get("song_id")
        if not song_id:
            return error("请提供 song_id 或 external_id", code=400)
        playlist, err = playlist_service.add_song(playlist_id, current_user_id(), int(song_id))
    if err:
        return error(err, code=400)
    return success(playlist, message="已添加到歌单")


@playlist_bp.route("/<int:playlist_id>/songs/<int:song_id>", methods=["DELETE"])
@login_required
def remove_song(playlist_id, song_id):
    result, err = playlist_service.remove_song(playlist_id, current_user_id(), song_id)
    if err:
        return error(err, code=404)
    return success(result, message="已从歌单移除")


@playlist_bp.route("/<int:playlist_id>/external-songs/<external_id>", methods=["DELETE"])
@login_required
def remove_external_song(playlist_id, external_id):
    platform = request.args.get("platform") or "Neteasemusic"
    result, err = playlist_service.remove_external_song(
        playlist_id, current_user_id(), external_id, platform
    )
    if err:
        return error(err, code=404)
    return success(result, message="已从歌单移除")


@playlist_bp.route("/<int:playlist_id>", methods=["DELETE"])
@login_required
def delete(playlist_id):
    result, err = playlist_service.delete_playlist(playlist_id, current_user_id())
    if err:
        return error(err, code=404)
    return success(result, message="歌单已删除")
