"""关注艺术家表数据访问"""
from project.db.base.base_repository import BaseRepository
from project.db.schema_bootstrap import ensure_follow_schema


class FollowRepository(BaseRepository):

    def _ready(self):
        ensure_follow_schema(self)

    def follow(self, user_id, artist_id):
        self._ready()
        return self.execute(
            "INSERT IGNORE INTO follow_artists (user_id, artist_id) VALUES (%s, %s)",
            (user_id, artist_id),
        )

    def unfollow(self, user_id, artist_id):
        self._ready()
        return self.execute(
            "DELETE FROM follow_artists WHERE user_id = %s AND artist_id = %s",
            (user_id, artist_id),
        )

    def is_following(self, user_id, artist_id):
        self._ready()
        row = self.fetch_one(
            "SELECT 1 FROM follow_artists WHERE user_id = %s AND artist_id = %s",
            (user_id, artist_id),
        )
        return row is not None

    def list_following(self, user_id, page=1, page_size=20):
        self._ready()
        offset = (page - 1) * page_size

        def _tx(cur):
            cur.execute(
                """SELECT a.id, a.name, a.bio, a.avatar_url, a.created_at,
                          (SELECT COUNT(*) FROM songs s
                           WHERE s.artist = a.name AND s.status = 'online') AS song_count
                   FROM follow_artists fa
                   JOIN artists a ON a.id = fa.artist_id
                   WHERE fa.user_id = %s
                   ORDER BY fa.followed_at DESC
                   LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM follow_artists WHERE user_id = %s", (user_id,))
            total = cur.fetchone()["total"]
            return items, total

        return self.run_transaction(_tx)

    def get_following_count(self, user_id):
        self._ready()
        row = self.fetch_one(
            "SELECT COUNT(*) AS count FROM follow_artists WHERE user_id = %s",
            (user_id,),
        )
        return row["count"] if row else 0
