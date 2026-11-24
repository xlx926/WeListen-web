"""艺术家表数据访问"""
from project.db.base.base_repository import BaseRepository

PRESET_ARTISTS = [
    ("周杰伦", "华语流行音乐天王，创作型歌手"),
    ("林俊杰", "新加坡华语流行音乐歌手"),
    ("邓紫棋", "香港创作型歌手"),
    ("薛之谦", "华语流行音乐歌手"),
    ("毛不易", "华语流行音乐创作歌手"),
    ("陈奕迅", "香港华语流行音乐歌手"),
    ("李荣浩", "华语流行音乐创作歌手"),
    ("张杰", "华语流行音乐歌手"),
]


class ArtistRepository(BaseRepository):

    TABLE = "artists"

    def find_by_id(self, artist_id):
        return self.fetch_one(
            f"SELECT id, name, bio, avatar_url, created_at FROM {self.TABLE} WHERE id = %s",
            (artist_id,),
        )

    def find_by_name(self, name):
        return self.fetch_one(
            f"SELECT id, name FROM {self.TABLE} WHERE name = %s",
            (name,),
        )

    def create(self, name, bio="", avatar_url=""):
        return self.insert(
            f"INSERT INTO {self.TABLE} (name, bio, avatar_url) VALUES (%s, %s, %s)",
            (name, bio or "", avatar_url or ""),
        )

    def list_paginated(self, page=1, page_size=20, keyword=""):
        offset = (page - 1) * page_size
        if keyword:
            like = f"%{keyword}%"
            return self.fetch_all(
                """SELECT a.id, a.name, a.bio, a.avatar_url, a.created_at,
                          (SELECT COUNT(*) FROM songs s WHERE s.artist = a.name AND s.status = 'online') AS song_count
                   FROM artists a
                   WHERE a.name LIKE %s
                   ORDER BY a.name LIMIT %s OFFSET %s""",
                (like, page_size, offset),
            )
        return self.fetch_all(
            """SELECT a.id, a.name, a.bio, a.avatar_url, a.created_at,
                      (SELECT COUNT(*) FROM songs s WHERE s.artist = a.name AND s.status = 'online') AS song_count
               FROM artists a
               ORDER BY a.name LIMIT %s OFFSET %s""",
            (page_size, offset),
        )

    def ensure_presets(self):
        for name, bio in PRESET_ARTISTS:
            if self.find_by_name(name):
                continue
            try:
                self.create(name, bio)
            except Exception:
                pass

    def list_songs_by_artist(self, artist_id, page=1, page_size=20):
        offset = (page - 1) * page_size
        # 先获取艺术家名称，再用名称匹配歌曲
        artist = self.find_by_id(artist_id)
        if not artist:
            return []
        return self.fetch_all(
            """SELECT id, title, artist, duration_seconds, play_count, published_at
               FROM songs WHERE artist = %s AND status = 'online'
               ORDER BY play_count DESC LIMIT %s OFFSET %s""",
            (artist["name"], page_size, offset),
        )
