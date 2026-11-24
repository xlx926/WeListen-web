"""歌单表数据访问"""
from project.db.base.base_repository import BaseRepository
from project.db.schema_bootstrap import ensure_playlist_external_schema


class PlaylistRepository(BaseRepository):

    def _ready(self):
        ensure_playlist_external_schema(self)

    def find_by_id(self, playlist_id):
        return self.fetch_one(
            """SELECT id, user_id, name, description, created_at, updated_at
               FROM playlists WHERE id = %s""",
            (playlist_id,),
        )

    def create(self, user_id, name, description=""):
        return self.insert(
            "INSERT INTO playlists (user_id, name, description) VALUES (%s, %s, %s)",
            (user_id, name, description or ""),
        )

    def _next_position(self, cur, playlist_id):
        cur.execute(
            """SELECT GREATEST(
                   COALESCE((SELECT MAX(position) FROM playlist_songs WHERE playlist_id = %s), 0),
                   COALESCE((SELECT MAX(position) FROM playlist_external_songs WHERE playlist_id = %s), 0)
               ) + 1 AS next_pos""",
            (playlist_id, playlist_id),
        )
        return cur.fetchone()["next_pos"]

    def list_songs(self, playlist_id):
        self._ready()
        local = self.fetch_all(
            """SELECT s.id, s.title, s.artist, s.duration_seconds, s.play_count,
                      ps.position, ps.added_at, 'local' AS source
               FROM playlist_songs ps
               JOIN songs s ON s.id = ps.song_id AND s.status = 'online'
               WHERE ps.playlist_id = %s""",
            (playlist_id,),
        )
        external = self.fetch_all(
            """SELECT external_id, platform, title, artist, position, added_at, 'external' AS source
               FROM playlist_external_songs
               WHERE playlist_id = %s""",
            (playlist_id,),
        )
        merged = []
        for row in local:
            merged.append(dict(row))
        for row in external:
            merged.append(dict(row))
        merged.sort(key=lambda r: (r.get("position") or 0, r.get("added_at") or ""))
        return merged

    def list_by_user(self, user_id):
        self._ready()
        return self.fetch_all(
            """SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
                      (
                        (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id)
                        + (SELECT COUNT(*) FROM playlist_external_songs pes WHERE pes.playlist_id = p.id)
                      ) AS song_count
               FROM playlists p
               WHERE p.user_id = %s
               ORDER BY p.updated_at DESC""",
            (user_id,),
        )

    def song_exists_online(self, song_id):
        row = self.fetch_one(
            "SELECT id FROM songs WHERE id = %s AND status = 'online'",
            (song_id,),
        )
        return row is not None

    def add_song(self, playlist_id, song_id):
        self._ready()

        def _tx(cur):
            next_pos = self._next_position(cur, playlist_id)
            cur.execute(
                "INSERT IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (%s, %s, %s)",
                (playlist_id, song_id, next_pos),
            )
            cur.execute("UPDATE playlists SET updated_at = NOW() WHERE id = %s", (playlist_id,))

        self.run_transaction(_tx)

    def add_external_song(self, playlist_id, external_id, title, artist, platform="Neteasemusic"):
        self._ready()
        external_id = str(external_id or "").strip()
        title = (title or "").strip()
        artist = (artist or "").strip() or "未知艺术家"
        platform = (platform or "Neteasemusic").strip()
        if not external_id or not title:
            raise ValueError("外部歌曲信息不完整")

        def _tx(cur):
            next_pos = self._next_position(cur, playlist_id)
            cur.execute(
                """INSERT INTO playlist_external_songs
                   (playlist_id, external_id, platform, title, artist, position)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                     title = VALUES(title),
                     artist = VALUES(artist),
                     position = VALUES(position)""",
                (playlist_id, external_id, platform, title, artist, next_pos),
            )
            cur.execute("UPDATE playlists SET updated_at = NOW() WHERE id = %s", (playlist_id,))

        self.run_transaction(_tx)

    def remove_song(self, playlist_id, song_id):
        self._ready()

        def _tx(cur):
            cur.execute(
                "DELETE FROM playlist_songs WHERE playlist_id = %s AND song_id = %s",
                (playlist_id, song_id),
            )
            affected = cur.rowcount
            cur.execute("UPDATE playlists SET updated_at = NOW() WHERE id = %s", (playlist_id,))
            return affected

        return self.run_transaction(_tx)

    def remove_external_song(self, playlist_id, external_id, platform="Neteasemusic"):
        self._ready()

        def _tx(cur):
            cur.execute(
                """DELETE FROM playlist_external_songs
                   WHERE playlist_id = %s AND external_id = %s AND platform = %s""",
                (playlist_id, str(external_id), platform or "Neteasemusic"),
            )
            affected = cur.rowcount
            cur.execute("UPDATE playlists SET updated_at = NOW() WHERE id = %s", (playlist_id,))
            return affected

        return self.run_transaction(_tx)

    def delete_by_user(self, playlist_id, user_id):
        return self.execute(
            "DELETE FROM playlists WHERE id = %s AND user_id = %s",
            (playlist_id, user_id),
        )
