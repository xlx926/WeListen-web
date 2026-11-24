"""启动时确保关注相关表存在"""
from typing import Optional

from project.db.base.base_repository import BaseRepository

_ARTISTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS artists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(512) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_artist_name (name),
  INDEX idx_name (name)
) ENGINE=InnoDB
"""

_FOLLOW_ARTISTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS follow_artists (
  user_id BIGINT UNSIGNED NOT NULL,
  artist_id BIGINT UNSIGNED NOT NULL,
  followed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, artist_id),
  INDEX idx_fa_artist (artist_id),
  CONSTRAINT fk_fa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fa_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB
"""

_ready = False
_playlist_ready = False
_songs_ready = False


def ensure_songs_uploader_schema(repo: Optional[BaseRepository] = None) -> None:
    """确保 songs 表有 uploader_id，用于「我的上传」"""
    global _songs_ready
    if _songs_ready:
        return
    db = repo or BaseRepository()
    row = db.fetch_one(
        """SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'songs'
             AND COLUMN_NAME = 'uploader_id'"""
    )
    if not row or row.get("cnt", 0) == 0:
        db.execute(
            "ALTER TABLE songs ADD COLUMN uploader_id BIGINT UNSIGNED NULL AFTER duration_seconds"
        )
    idx = db.fetch_one(
        """SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'songs'
             AND INDEX_NAME = 'idx_uploader'"""
    )
    if not idx or idx.get("cnt", 0) == 0:
        db.execute("ALTER TABLE songs ADD INDEX idx_uploader (uploader_id)")
    _songs_ready = True


def ensure_follow_schema(repo: Optional[BaseRepository] = None) -> None:
    global _ready
    if _ready:
        return
    db = repo or BaseRepository()
    db.execute(_ARTISTS_TABLE_SQL)
    db.execute(_FOLLOW_ARTISTS_TABLE_SQL)
    _ready = True


_PLAYLIST_EXTERNAL_SQL = """
CREATE TABLE IF NOT EXISTS playlist_external_songs (
  playlist_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'Neteasemusic',
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL DEFAULT '',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, platform, external_id),
  INDEX idx_pes_playlist (playlist_id),
  CONSTRAINT fk_pes_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
) ENGINE=InnoDB
"""


def ensure_playlist_external_schema(repo: Optional[BaseRepository] = None) -> None:
    global _playlist_ready
    if _playlist_ready:
        return
    db = repo or BaseRepository()
    db.execute(_PLAYLIST_EXTERNAL_SQL)
    _playlist_ready = True
