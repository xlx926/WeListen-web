"""数据库模块统一导出"""
from project.db.connection.mysql_pool import MySQLPool
from project.db.base.base_repository import BaseRepository
from project.db.repositories.user_repository import UserRepository
from project.db.repositories.song_repository import SongRepository
from project.db.repositories.video_repository import VideoRepository
from project.db.repositories.artist_repository import ArtistRepository
from project.db.repositories.playlist_repository import PlaylistRepository
from project.db.repositories.play_history_repository import PlayHistoryRepository
from project.db.repositories.ranking_repository import RankingRepository
from project.db.repositories.preference_repository import PreferenceRepository

# 兼容旧代码
def get_connection():
    return MySQLPool.instance().acquire()

def get_raw_connection(database=None):
    return MySQLPool.instance().acquire_raw(database)

__all__ = [
    "MySQLPool",
    "BaseRepository",
    "UserRepository",
    "SongRepository",
    "VideoRepository",
    "ArtistRepository",
    "PlaylistRepository",
    "PlayHistoryRepository",
    "RankingRepository",
    "PreferenceRepository",
    "get_connection",
    "get_raw_connection",
]
