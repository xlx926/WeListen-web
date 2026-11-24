from flask import Blueprint, request
from project.services.artist_service import ArtistService
from project.utils.auth import admin_required
from project.utils.response import success, error

artist_bp = Blueprint("artists", __name__)
service = ArtistService()


@artist_bp.route("", methods=["GET"])
def list_artists():
    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 50)), 100)
    keyword = request.args.get("q", "")
    return success(service.list_all(page, page_size, keyword=keyword))


@artist_bp.route("/<int:artist_id>", methods=["GET"])
def detail(artist_id):
    artist = service.get(artist_id)
    if not artist:
        return error("艺术家不存在", code=404)
    songs = service.get_songs(artist_id)
    artist["songs"] = songs
    return success(artist)


@artist_bp.route("", methods=["POST"])
@admin_required
def create():
    data = request.get_json(silent=True) or {}
    artist, err = service.create(data.get("name"), data.get("bio"), data.get("avatar_url"))
    if err:
        return error(err, code=400)
    return success(artist, message="艺术家创建成功", code=201)
