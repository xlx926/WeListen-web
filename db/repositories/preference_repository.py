"""用户偏好数据访问"""
from project.db.base.base_repository import BaseRepository


class PreferenceRepository(BaseRepository):

    def list_top_artists(self, user_id, limit=10):
        return self.fetch_all(
            """SELECT artist, total_plays, song_count, last_played_at
               FROM v_user_artist_preference WHERE user_id = %s
               ORDER BY total_plays DESC LIMIT %s""",
            (user_id, limit),
        )

    def list_top_songs(self, user_id, limit=10):
        return self.fetch_all(
            """SELECT upr.song_id, s.title, s.artist, upr.play_count, upr.last_played_at
               FROM user_play_records upr JOIN songs s ON s.id = upr.song_id
               WHERE upr.user_id = %s ORDER BY upr.play_count DESC LIMIT %s""",
            (user_id, limit),
        )

    def count_play_events(self, user_id):
        row = self.fetch_one(
            "SELECT COUNT(*) AS event_count FROM play_events WHERE user_id = %s",
            (user_id,),
        )
        return row["event_count"] if row else 0

    def count_unique_songs(self, user_id):
        row = self.fetch_one(
            "SELECT COUNT(DISTINCT song_id) AS unique_songs FROM user_play_records WHERE user_id = %s",
            (user_id,),
        )
        return row["unique_songs"] if row else 0

    def count_favorites(self, user_id):
        row = self.fetch_one(
            "SELECT COUNT(*) AS fav_count FROM favorites WHERE user_id = %s",
            (user_id,),
        )
        return row["fav_count"] if row else 0

    def count_playlists(self, user_id):
        row = self.fetch_one(
            "SELECT COUNT(*) AS playlist_count FROM playlists WHERE user_id = %s",
            (user_id,),
        )
        return row["playlist_count"] if row else 0

    def list_listening_hours(self, user_id, days=30):
        return self.fetch_all(
            """SELECT HOUR(played_at) AS hour, COUNT(*) AS play_count
               FROM play_events WHERE user_id = %s
               AND played_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
               GROUP BY HOUR(played_at) ORDER BY hour""",
            (user_id, days),
        )
