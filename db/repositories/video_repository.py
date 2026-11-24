"""视频表数据访问"""
from project.db.base.base_repository import BaseRepository


class VideoRepository(BaseRepository):

    TABLE = "videos"

    def find_by_id(self, video_id, online_only=False):
        sql = """SELECT id, title, artist, artist_id, file_path, duration_seconds,
                        status, play_count, published_at, duration_weight, base_score
                 FROM videos WHERE id = %s"""
        if online_only:
            sql += " AND status = 'online'"
        return self.fetch_one(sql, (video_id,))

    def create(self, title, artist, artist_id, file_path, duration_seconds):
        return self.insert(
            """INSERT INTO videos (title, artist, artist_id, file_path, duration_seconds, published_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            (title, artist, artist_id, file_path, int(duration_seconds or 0)),
        )

    def set_offline(self, video_id):
        return self.execute(
            "UPDATE videos SET status = 'offline' WHERE id = %s AND status = 'online'",
            (video_id,),
        )

    def list_paginated(self, page, page_size, order_clause):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                f"""SELECT id, title, artist, duration_seconds, play_count, published_at, base_score
                    FROM videos WHERE status = 'online' ORDER BY {order_clause}
                    LIMIT %s OFFSET %s""",
                (page_size, offset),
            )
            items = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total FROM videos WHERE status = 'online'")
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)

    def search(self, keyword, page, page_size):
        offset = (page - 1) * page_size
        like = f"%{keyword}%"
        return self.fetch_all(
            """SELECT id, title, artist, duration_seconds, play_count
               FROM videos WHERE status = 'online' AND (title LIKE %s OR artist LIKE %s)
               ORDER BY play_count DESC LIMIT %s OFFSET %s""",
            (like, like, page_size, offset),
        )

    def record_play(self, user_id, video_id, played_at, json_data=None, play_count=1):
        def _tx(cur):
            cur.execute("UPDATE videos SET play_count = play_count + 1 WHERE id = %s", (video_id,))
            cur.execute(
                "INSERT INTO video_play_events (user_id, video_id, played_at) VALUES (%s, %s, %s)",
                (user_id, video_id, played_at),
            )
            if user_id and json_data is not None:
                cur.execute(
                    "SELECT 1 FROM user_video_play_records WHERE user_id=%s AND video_id=%s",
                    (user_id, video_id),
                )
                if cur.fetchone():
                    cur.execute(
                        """UPDATE user_video_play_records
                           SET play_timestamps_json=%s, play_count=%s, last_played_at=%s
                           WHERE user_id=%s AND video_id=%s""",
                        (json_data, play_count, played_at, user_id, video_id),
                    )
                else:
                    cur.execute(
                        """INSERT INTO user_video_play_records
                           (user_id, video_id, play_timestamps_json, play_count, last_played_at)
                           VALUES (%s,%s,%s,%s,%s)""",
                        (user_id, video_id, json_data, play_count, played_at),
                    )
        self.run_transaction(_tx)

    def get_user_video_record(self, user_id, video_id):
        return self.fetch_one(
            "SELECT play_timestamps_json FROM user_video_play_records WHERE user_id=%s AND video_id=%s",
            (user_id, video_id),
        )

    def add_favorite(self, user_id, video_id):
        return self.execute(
            "INSERT IGNORE INTO video_favorites (user_id, video_id) VALUES (%s,%s)",
            (user_id, video_id),
        )

    def remove_favorite(self, user_id, video_id):
        return self.execute(
            "DELETE FROM video_favorites WHERE user_id=%s AND video_id=%s",
            (user_id, video_id),
        )

    def list_favorites(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        return self.fetch_all(
            """SELECT v.id, v.title, v.artist, v.play_count, vf.created_at AS favorited_at
               FROM video_favorites vf
               JOIN videos v ON v.id = vf.video_id AND v.status='online'
               WHERE vf.user_id=%s ORDER BY vf.created_at DESC LIMIT %s OFFSET %s""",
            (user_id, page_size, offset),
        )

    def list_weekly_ranking(self, limit):
        return self.fetch_all(
            """SELECT video_id, title, artist, period_play_count, rank_num
               FROM v_hot_videos_weekly ORDER BY rank_num LIMIT %s""",
            (limit,),
        )

    def list_monthly_ranking(self, limit):
        return self.fetch_all(
            """SELECT video_id, title, artist, period_play_count, rank_num
               FROM v_hot_videos_monthly ORDER BY rank_num LIMIT %s""",
            (limit,),
        )
