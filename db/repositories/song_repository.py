"""歌曲表数据访问"""
from project.db.base.base_repository import BaseRepository
from project.db.schema_bootstrap import ensure_songs_uploader_schema


class SongRepository(BaseRepository):

    TABLE = "songs"

    def _ready(self):
        ensure_songs_uploader_schema(self)

    def find_by_id(self, song_id, online_only=False):
        self._ready()
        sql = """SELECT id, title, artist, file_path, duration_seconds, uploader_id,
                        status, play_count, published_at, duration_weight, base_score, created_at
                 FROM songs WHERE id = %s"""
        if online_only:
            sql += " AND status = 'online'"
        return self.fetch_one(sql, (song_id,))

    def create(self, title, artist, file_path, duration_seconds, uploader_id=None):
        self._ready()
        return self.insert(
            """INSERT INTO songs (title, artist, file_path, duration_seconds, uploader_id, status, published_at)
               VALUES (%s, %s, %s, %s, %s, 'online', NOW())""",
            (title, artist, file_path, int(duration_seconds or 0), uploader_id),
        )

    def set_offline(self, song_id):
        self._ready()

        def _tx(cur):
            cur.execute(
                "UPDATE songs SET status = 'offline' WHERE id = %s AND status = 'online'",
                (song_id,),
            )
            if cur.rowcount > 0:
                return True
            cur.execute("SELECT status FROM songs WHERE id = %s", (song_id,))
            row = cur.fetchone()
            if not row:
                return None
            return False
        return self.run_transaction(_tx)

    def increment_play_count(self, song_id):
        return self.execute(
            "UPDATE songs SET play_count = play_count + 1 WHERE id = %s",
            (song_id,),
        )

    def list_by_weight(self, page, page_size):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT song_id AS id, title, artist, duration_seconds,
                          play_count, published_at, weight_score, base_score
                   FROM v_songs_weighted ORDER BY weight_score DESC LIMIT %s OFFSET %s""",
                (page_size, offset),
            )
            songs = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM v_songs_weighted")
            total = cur.fetchone()["total"]
            return songs, total
        return self.run_transaction(_tx)

    def list_paginated(self, status, page, page_size, order_clause):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                f"""SELECT id, title, artist, duration_seconds, status,
                           play_count, published_at, duration_weight, base_score
                    FROM songs WHERE status = %s ORDER BY {order_clause}
                    LIMIT %s OFFSET %s""",
                (status, page_size, offset),
            )
            songs = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM songs WHERE status = %s", (status,))
            total = cur.fetchone()["total"]
            return songs, total
        return self.run_transaction(_tx)

    def search(self, keyword, page, page_size):
        offset = (page - 1) * page_size
        like = f"%{keyword}%"
        return self.fetch_all(
            """SELECT song_id AS id, title, artist, duration_seconds, play_count,
                      published_at, weight_score
               FROM v_songs_weighted
               WHERE title LIKE %s OR artist LIKE %s
               ORDER BY weight_score DESC LIMIT %s OFFSET %s""",
            (like, like, page_size, offset),
        )

    def get_user_play_record(self, user_id, song_id):
        return self.fetch_one(
            "SELECT play_timestamps_json FROM user_play_records WHERE user_id = %s AND song_id = %s",
            (user_id, song_id),
        )

    def record_play(self, user_id, song_id, played_at, json_data=None, play_count=1):
        def _tx(cur):
            cur.execute(
                "UPDATE songs SET play_count = play_count + 1 WHERE id = %s",
                (song_id,),
            )
            cur.execute(
                "INSERT INTO play_events (user_id, song_id, played_at) VALUES (%s, %s, %s)",
                (user_id, song_id, played_at),
            )
            if user_id and json_data is not None:
                cur.execute(
                    "SELECT play_timestamps_json FROM user_play_records WHERE user_id = %s AND song_id = %s",
                    (user_id, song_id),
                )
                if cur.fetchone():
                    cur.execute(
                        """UPDATE user_play_records
                           SET play_timestamps_json = %s, play_count = %s, last_played_at = %s
                           WHERE user_id = %s AND song_id = %s""",
                        (json_data, play_count, played_at, user_id, song_id),
                    )
                else:
                    cur.execute(
                        """INSERT INTO user_play_records
                           (user_id, song_id, play_timestamps_json, play_count, last_played_at)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (user_id, song_id, json_data, play_count, played_at),
                    )
        self.run_transaction(_tx)

    def add_favorite(self, user_id, song_id):
        return self.execute(
            "INSERT IGNORE INTO favorites (user_id, song_id) VALUES (%s, %s)",
            (user_id, song_id),
        )

    def remove_favorite(self, user_id, song_id):
        return self.execute(
            "DELETE FROM favorites WHERE user_id = %s AND song_id = %s",
            (user_id, song_id),
        )

    def list_favorites(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT s.id, s.title, s.artist, s.duration_seconds, s.play_count,
                          s.published_at, f.created_at AS favorited_at
                   FROM favorites f
                   JOIN songs s ON s.id = f.song_id AND s.status = 'online'
                   WHERE f.user_id = %s ORDER BY f.created_at DESC LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM favorites WHERE user_id = %s", (user_id,))
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)

    def list_by_uploader(self, user_id, page, page_size):
        self._ready()
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT id, title, artist, duration_seconds, status,
                          play_count, published_at, created_at, base_score
                   FROM songs WHERE uploader_id = %s
                   ORDER BY created_at DESC LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM songs WHERE uploader_id = %s", (user_id,))
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)
