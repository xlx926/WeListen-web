-- 播放记录功能迁移（在 DataGrip 中执行，已有 listen_now 库时运行此文件）
USE listen_now;

-- 外部平台（爬虫）播放记录表
CREATE TABLE IF NOT EXISTS external_play_records (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  platform      VARCHAR(32)  NOT NULL,
  external_id   VARCHAR(128) NOT NULL,
  title         VARCHAR(255) NOT NULL DEFAULT '',
  artist        VARCHAR(255) NOT NULL DEFAULT '',
  play_url      TEXT,
  played_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_played (user_id, played_at DESC),
  INDEX idx_platform (platform, external_id),
  CONSTRAINT fk_epr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 本地歌曲播放历史视图（方便查询）
CREATE OR REPLACE VIEW v_user_play_history AS
SELECT
  pe.id AS event_id,
  pe.user_id,
  pe.song_id,
  s.title,
  s.artist,
  s.duration_seconds,
  pe.played_at,
  'local' AS source,
  NULL AS platform,
  upr.play_count AS user_total_plays
FROM play_events pe
INNER JOIN songs s ON s.id = pe.song_id
LEFT JOIN user_play_records upr ON upr.user_id = pe.user_id AND upr.song_id = pe.song_id
WHERE pe.user_id IS NOT NULL;

-- 用户播放汇总视图（按歌曲聚合）
CREATE OR REPLACE VIEW v_user_play_summary AS
SELECT
  upr.user_id,
  upr.song_id,
  s.title,
  s.artist,
  s.duration_seconds,
  upr.play_count,
  upr.last_played_at,
  'local' AS source
FROM user_play_records upr
INNER JOIN songs s ON s.id = upr.song_id;
