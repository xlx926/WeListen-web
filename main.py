#!/usr/bin/env python3
"""WeListen 用户端音乐点播系统 API（Flask + MySQL）"""
import os
import sys
from datetime import date, datetime
from decimal import Decimal

sys.path.append("..")

from flask import Flask
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS


class CustomJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

import project.Config.config as config_module
from project.Log.Logger import Logger
from project.routes.auth_routes import auth_bp
from project.routes.song_routes import song_bp
from project.routes.playlist_routes import playlist_bp
from project.routes.ranking_routes import ranking_bp
from project.routes.crawl_routes import crawl_bp
from project.routes.play_history_routes import play_history_bp
from project.routes.artist_routes import artist_bp
from project.routes.video_routes import video_bp
from project.routes.preference_routes import preference_bp
from project.routes.follow_routes import follow_bp
from project.routes.recommend_routes import recommend_bp
from project.utils.response import success
from project.db.schema_bootstrap import ensure_follow_schema, ensure_playlist_external_schema, ensure_songs_uploader_schema
from project.services.artist_service import ArtistService

log_dir = config_module.getConfig("app", "log_dir")
os.makedirs(os.path.join(os.path.dirname(__file__), log_dir), exist_ok=True)
log_path = os.path.join(os.path.dirname(__file__), log_dir, "welisten.log")

logger = Logger(log_path, level="info")

app = Flask(__name__)
app.json = CustomJSONProvider(app)
app.secret_key = config_module.getConfig("app", "secret_key")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["PERMANENT_SESSION_LIFETIME"] = 3600
CORS(app, resources=r"/*", supports_credentials=True)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(song_bp, url_prefix="/api/songs")
app.register_blueprint(playlist_bp, url_prefix="/api/playlists")
app.register_blueprint(ranking_bp, url_prefix="/api/rankings")
app.register_blueprint(crawl_bp, url_prefix="/api/crawl")
app.register_blueprint(play_history_bp, url_prefix="/api/play-history")
app.register_blueprint(artist_bp, url_prefix="/api/artists")
app.register_blueprint(video_bp, url_prefix="/api/videos")
app.register_blueprint(preference_bp, url_prefix="/api/preferences")
app.register_blueprint(follow_bp, url_prefix="/api/follow")
app.register_blueprint(recommend_bp, url_prefix="/api/recommend")


@app.route("/")
def index():
    return success({
        "name": "WeListen Music API",
        "version": "2.2.0",
        "features": {
            "entities": ["users", "songs", "videos", "artists", "play_records", "favorites", "playlists"],
            "tech": ["dense_rank周/月榜", "JSON压缩播放时间序列", "生成列weight_score"],
        },
        "endpoints": {
            "auth": "/api/auth/register, /api/auth/login",
            "songs": "/api/songs, /api/songs/search, /api/songs/<id>/play",
            "videos": "/api/videos, /api/videos/search, /api/videos/<id>/play",
            "artists": "/api/artists",
            "playlists": "/api/playlists",
            "rankings": "/api/rankings/weekly, /api/rankings/monthly, /api/rankings/weight",
            "preferences": "/api/preferences/me",
            "play_history": "/api/play-history/recent, /api/play-history/all",
            "crawl": "/api/crawl/search, /api/crawl/id",
            "recommend": "/api/recommend/guess, /api/recommend/prompt",
        },
    })


if __name__ == "__main__":
    try:
        ensure_follow_schema()
        ensure_playlist_external_schema()
        ensure_songs_uploader_schema()
        ArtistService().ensure_presets()
        logger.logger.info("数据库关注模块已就绪")
    except Exception as exc:
        logger.logger.warning("关注模块初始化跳过: %s", exc)

    host = config_module.getConfig("apptest", "apphost")
    port = int(config_module.getConfig("apptest", "appport"))
    logger.logger.info("启动 WeListen API %s:%s", host, port)
    app.run(host=host, port=port, debug=True)
