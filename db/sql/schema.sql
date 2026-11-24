-- WeListen 用户端音乐点播系统
-- 需要 MySQL 8.0+（窗口函数 dense_rank、JSON 类型、生成列）

CREATE DATABASE IF NOT EXISTS listen_now
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE listen_now;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS songs (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  artist           VARCHAR(255) NOT NULL DEFAULT '未知艺术家',
  file_path        VARCHAR(512) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  uploader_id      BIGINT UNSIGNED NULL,
  status           ENUM('online', 'offline') NOT NULL DEFAULT 'online',
  play_count       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  published_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 生成列：时长权重因子（确定性，可索引）
  duration_weight DECIMAL(10, 6) AS (
    LOG(GREATEST(duration_seconds, 1))
  ) STORED,
  -- 生成列：基础分 = 播放量 × 时长因子（确定性，可索引）
  base_score DECIMAL(16, 6) AS (
    play_count * LOG(GREATEST(duration_seconds, 1))
  ) STORED,
  INDEX idx_status_base_score (status, base_score DESC),
  INDEX idx_play_count (play_count DESC),
  INDEX idx_published (published_at DESC),
  INDEX idx_status_published (status, published_at DESC),
  INDEX idx_uploader (uploader_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS play_events (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NULL,
  song_id    BIGINT UNSIGNED NOT NULL,
  played_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_song_played (song_id, played_at),
  INDEX idx_played_at (played_at),
  INDEX idx_user_played (user_id, played_at),
  CONSTRAINT fk_play_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_play_events_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_play_records (
  user_id               BIGINT UNSIGNED NOT NULL,
  song_id               BIGINT UNSIGNED NOT NULL,
  play_timestamps_json  JSON NOT NULL COMMENT '压缩后的播放时间序列 {"v":1,"alg":"zlib+b64","data":"..."}',
  play_count            INT UNSIGNED NOT NULL DEFAULT 0,
  last_played_at        DATETIME NULL,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  INDEX idx_user_last_played (user_id, last_played_at DESC),
  CONSTRAINT fk_upr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_upr_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  user_id    BIGINT UNSIGNED NOT NULL,
  song_id    BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, song_id),
  INDEX idx_song_fav (song_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS playlists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(128) NOT NULL,
  description TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_playlist_user (user_id),
  CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id BIGINT UNSIGNED NOT NULL,
  song_id     BIGINT UNSIGNED NOT NULL,
  position    INT UNSIGNED NOT NULL DEFAULT 0,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id),
  INDEX idx_ps_song (song_id),
  CONSTRAINT fk_ps_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 综合权重视图：基础分 / 新鲜度衰减（含发布时间因子）
CREATE OR REPLACE VIEW v_songs_weighted AS
SELECT
  id AS song_id,
  title,
  artist,
  duration_seconds,
  play_count,
  published_at,
  duration_weight,
  base_score,
  base_score / (1.0 + TIMESTAMPDIFF(DAY, published_at, NOW()) * 0.02) AS weight_score
FROM songs
WHERE status = 'online';

-- 周榜：dense_rank 窗口函数，单层聚合避免子查询嵌套
CREATE OR REPLACE VIEW v_hot_songs_weekly AS
SELECT
  song_id,
  title,
  artist,
  duration_seconds,
  published_at,
  period_play_count,
  DENSE_RANK() OVER (ORDER BY period_play_count DESC) AS rank_num
FROM (
  SELECT
    s.id AS song_id,
    s.title,
    s.artist,
    s.duration_seconds,
    s.published_at,
    COUNT(pe.id) AS period_play_count
  FROM songs s
  INNER JOIN play_events pe ON pe.song_id = s.id
  WHERE s.status = 'online'
    AND pe.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY s.id, s.title, s.artist, s.duration_seconds, s.published_at
) AS weekly_agg;

-- 月榜：dense_rank 窗口函数
CREATE OR REPLACE VIEW v_hot_songs_monthly AS
SELECT
  song_id,
  title,
  artist,
  duration_seconds,
  published_at,
  period_play_count,
  DENSE_RANK() OVER (ORDER BY period_play_count DESC) AS rank_num
FROM (
  SELECT
    s.id AS song_id,
    s.title,
    s.artist,
    s.duration_seconds,
    s.published_at,
    COUNT(pe.id) AS period_play_count
  FROM songs s
  INNER JOIN play_events pe ON pe.song_id = s.id
  WHERE s.status = 'online'
    AND pe.played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY s.id, s.title, s.artist, s.duration_seconds, s.published_at
) AS monthly_agg;

-- 外部平台播放记录
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
