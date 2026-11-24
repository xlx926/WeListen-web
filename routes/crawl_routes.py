from flask import Blueprint, request, session, Response
import requests
from project.services.crawl_service import CrawlService
from project.services.play_history_service import PlayHistoryService
from project.utils.response import success, error
from project.utils.external_play_url import referer_for_url

crawl_bp = Blueprint("crawl", __name__)
crawl_service = CrawlService()
history_service = PlayHistoryService()


@crawl_bp.route("/platforms", methods=["GET"])
def platforms():
    return success(crawl_service.list_platforms())


@crawl_bp.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True) or {}
    title = data.get("title") or data.get("keyword") or ""
    platform = data.get("platform") or "Neteasemusic"
    page = int(data.get("page", 1))

    result, err = crawl_service.search(title, platform, page)
    if err:
        return error(err, code=400)

    song_list = []
    if result and result.get("song") and result["song"].get("list"):
        for song in result["song"]["list"]:
            song_list.append({
                "id": str(song.get("id", "")),
                "title": song.get("music_name", ""),
                "artist": song.get("artists", ""),
            })
    
    return success({
        "songList": song_list,
        "totalnum": result.get("song", {}).get("totalnum", 0),
        "now_page": result.get("now_page", page),
        "next_page": result.get("next_page", page + 1),
    })


@crawl_bp.route("/id", methods=["POST"])
def get_by_id():
    data = request.get_json(silent=True) or {}
    music_id = data.get("id") or data.get("music_id") or ""
    platform = data.get("platform") or "Neteasemusic"

    result, err = crawl_service.get_by_id(music_id, platform)
    if err:
        return error(err, code=404)

    user_id = session.get("user_id")
    if user_id:
        title = result.get("music_name") or result.get("title") or ""
        artist = result.get("artists") or result.get("artist") or ""
        play_url = result.get("play_url") or ""
        history_service.record_external_play(
            user_id, platform, str(music_id), title, artist, play_url
        )

    response_data = {
        "id": result.get("id", ""),
        "title": result.get("music_name", "") or result.get("title", ""),
        "artist": result.get("artists", "") or result.get("artist", ""),
        "play_url": result.get("play_url", ""),
        "image_url": result.get("image_url", ""),
        "lyric": result.get("lyric", ""),
    }

    return success(response_data)


@crawl_bp.route("/proxy", methods=["GET"])
def proxy_audio():
    audio_url = request.args.get("url", "")
    if not audio_url:
        return error("缺少音频URL参数", code=400)

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": referer_for_url(audio_url),
        }
        range_header = request.headers.get("Range")
        if range_header:
            headers["Range"] = range_header

        resp = requests.get(audio_url, headers=headers, stream=True, timeout=30, allow_redirects=True, proxies={"http": None, "https": None})
        resp.raise_for_status()

        content_type = (resp.headers.get("Content-Type") or "audio/mpeg").lower()
        if ";" in content_type:
            content_type = content_type.split(";", 1)[0].strip()
        if content_type.startswith(("text/html", "application/json")):
            return error("音频链接已失效，请重新搜索歌曲", code=502)

        def generate():
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        response_headers = {
            "Content-Type": content_type,
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Range",
        }

        if "Content-Length" in resp.headers:
            response_headers["Content-Length"] = resp.headers["Content-Length"]
        if "Content-Range" in resp.headers:
            response_headers["Content-Range"] = resp.headers["Content-Range"]

        return Response(
            generate(),
            status=resp.status_code,
            headers=response_headers,
        )
    except requests.exceptions.RequestException as e:
        return error(f"音频代理请求失败: {str(e)}", code=500)
    except Exception as e:
        return error(f"音频代理异常: {str(e)}", code=500)
