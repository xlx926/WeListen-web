"""排行榜视图数据访问"""
from project.db.base.base_repository import BaseRepository

_EXTERNAL_RANKING_SQL = """
SELECT external_id, platform, title, artist, period_play_count, rank_num
FROM (
  SELECT epr.external_id,
         epr.platform,
         MAX(epr.title) AS title,
         MAX(epr.artist) AS artist,
         COUNT(*) AS period_play_count,
         DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS rank_num
  FROM external_play_records epr
  WHERE epr.platform = %s
    {date_filter}
  GROUP BY epr.platform, epr.external_id
) AS ranked
ORDER BY rank_num ASC, period_play_count DESC
LIMIT %s
"""


class RankingRepository(BaseRepository):

    def _list_external_ranking(self, platform, limit, start_date=None, end_date=None, days=None):
        if start_date and end_date:
            date_filter = "AND epr.played_at >= %s AND epr.played_at < DATE_ADD(%s, INTERVAL 1 DAY)"
            params = (platform, start_date, end_date, limit)
        elif days:
            date_filter = f"AND epr.played_at >= DATE_SUB(NOW(), INTERVAL {int(days)} DAY)"
            params = (platform, limit)
        else:
            date_filter = ""
            params = (platform, limit)

        sql = _EXTERNAL_RANKING_SQL.format(date_filter=date_filter)
        return self.fetch_all(sql, params)

    def list_weekly_songs(self, limit, start_date=None, end_date=None, platform="Neteasemusic"):
        if start_date and end_date:
            return self._list_external_ranking(platform, limit, start_date, end_date)
        return self._list_external_ranking(platform, limit, days=7)

    def list_monthly_songs(self, limit, start_date=None, end_date=None, platform="Neteasemusic"):
        if start_date and end_date:
            return self._list_external_ranking(platform, limit, start_date, end_date)
        return self._list_external_ranking(platform, limit, days=30)

    def list_all_time_by_play_count(self, limit):
        return self.fetch_all(
            """SELECT id AS song_id, title, artist, duration_seconds,
                      play_count, published_at, base_score AS weight_score,
                      DENSE_RANK() OVER (ORDER BY play_count DESC) AS rank_num
               FROM songs
               WHERE status = 'online'
               ORDER BY play_count DESC LIMIT %s""",
            (limit,),
        )

    def list_weighted_songs(self, limit):
        return self.fetch_all(
            """SELECT song_id, title, artist, duration_seconds,
                      play_count, published_at, base_score, weight_score,
                      DENSE_RANK() OVER (ORDER BY weight_score DESC) AS rank_num
               FROM v_songs_weighted
               ORDER BY weight_score DESC LIMIT %s""",
            (limit,),
        )

    def list_user_play_stats(self, user_id):
        return self.fetch_all(
            """SELECT upr.song_id, s.title, s.artist, upr.play_count,
                      upr.last_played_at, upr.play_timestamps_json
               FROM user_play_records upr
               JOIN songs s ON s.id = upr.song_id
               WHERE upr.user_id = %s
               ORDER BY upr.play_count DESC""",
            (user_id,),
        )
