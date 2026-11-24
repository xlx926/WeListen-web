"""数据访问层 Repository 导出"""
from project.db.repositories.user_repository import UserRepository
from project.db.repositories.artist_repository import ArtistRepository
from project.db.repositories.song_repository import SongRepository
from project.db.repositories.video_repository import VideoRepository
from project.db.repositories.playlist_repository import PlaylistRepository
from project.db.repositories.play_history_repository import PlayHistoryRepository
from project.db.repositories.ranking_repository import RankingRepository
from project.db.repositories.preference_repository import PreferenceRepository

__all__ = [
    "UserRepository",
    "ArtistRepository",
    "SongRepository",
    "VideoRepository",
    "PlaylistRepository",
    "PlayHistoryRepository",
    "RankingRepository",
    "PreferenceRepository",
]
