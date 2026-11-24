"""播放记录数据访问"""
from project.db.base.base_repository import BaseRepository


class PlayHistoryRepository(BaseRepository):

    def list_recent(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT event_id, song_id, title, artist, duration_seconds,
                          played_at, source, platform, user_total_plays
                   FROM v_user_play_history
                   WHERE user_id = %s ORDER BY played_at DESC LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute(
                "SELECT COUNT(*) AS total FROM play_events WHERE user_id = %s",
                (user_id,),
            )
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)

    def list_summary(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT song_id, title, artist, duration_seconds,
                          play_count, last_played_at, source
                   FROM v_user_play_summary
                   WHERE user_id = %s ORDER BY last_played_at DESC LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute(
                "SELECT COUNT(*) AS total FROM user_play_records WHERE user_id = %s",
                (user_id,),
            )
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)

    def list_external(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        def _tx(cur):
            cur.execute(
                """SELECT id, platform, external_id, title, artist, play_url, played_at
                   FROM external_play_records
                   WHERE user_id = %s ORDER BY played_at DESC LIMIT %s OFFSET %s""",
                (user_id, page_size, offset),
            )
            items = cur.fetchall()
            cur.execute(
                "SELECT COUNT(*) AS total FROM external_play_records WHERE user_id = %s",
                (user_id,),
            )
            total = cur.fetchone()["total"]
            return items, total
        return self.run_transaction(_tx)

    def list_all_merged(self, user_id, page, page_size):
        offset = (page - 1) * page_size
        return self.fetch_all(
            """SELECT * FROM (
                 SELECT pe.id AS event_id, pe.user_id, pe.song_id,
                        s.title, s.artist, s.duration_seconds,
                        pe.played_at, 'local' AS source, NULL AS platform,
                        NULL AS external_id
                 FROM play_events pe
                 JOIN songs s ON s.id = pe.song_id
                 WHERE pe.user_id = %s
                 UNION ALL
                 SELECT id AS event_id, user_id, 0 AS song_id,
                        title, artist, 0 AS duration_seconds,
                        played_at, 'external' AS source, platform, external_id
                 FROM external_play_records
                 WHERE user_id = %s
               ) AS merged
               ORDER BY played_at DESC LIMIT %s OFFSET %s""",
            (user_id, user_id, page_size, offset),
        )

    def record_external_play(self, user_id, platform, external_id, title, artist, play_url, played_at):
        return self.insert(
            """INSERT INTO external_play_records
               (user_id, platform, external_id, title, artist, play_url, played_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (user_id, platform, external_id, title or "", artist or "", play_url or "", played_at),
        )

    def get_song_timestamps(self, user_id, song_id):
        return self.fetch_one(
            """SELECT play_timestamps_json, play_count, last_played_at
               FROM user_play_records WHERE user_id = %s AND song_id = %s""",
            (user_id, song_id),
        )

    def record_play_event(self, user_id, song_id):
        """记录播放事件，用于排行榜计算"""
        return self.insert(
            """INSERT INTO play_events (user_id, song_id) VALUES (%s, %s)""",
            (user_id, song_id),
        )
