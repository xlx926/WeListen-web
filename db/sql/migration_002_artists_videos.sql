-- 大作业补充：艺术家、视频实体及关联（在 DataGrip 中执行）
USE listen_now;

-- 艺术家表
CREATE TABLE IF NOT EXISTS artists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(128) NOT NULL,
  bio         TEXT,
  avatar_url  VARCHAR(512) DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_artist_name (name),
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- 歌曲关联艺术家（兼容旧版 MySQL，不用 ADD COLUMN IF NOT EXISTS）
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'listen_now' AND TABLE_NAME = 'songs' AND COLUMN_NAME = 'artist_id'
);
SET @sql_add_col = IF(
  @col_exists = 0,
  'ALTER TABLE songs ADD COLUMN artist_id BIGINT UNSIGNED NULL AFTER artist',
  'SELECT ''artist_id 已存在，跳过'' AS msg'
);
PREPARE stmt FROM @sql_add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'listen_now' AND TABLE_NAME = 'songs' AND INDEX_NAME = 'idx_songs_artist_id'
);
SET @sql_add_idx = IF(
  @idx_exists = 0,
  'ALTER TABLE songs ADD INDEX idx_songs_artist_id (artist_id)',
  'SELECT ''idx_songs_artist_id 已存在，跳过'' AS msg'
);
PREPARE stmt FROM @sql_add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 视频表（结构对齐歌曲，含生成列）
CREATE TABLE IF NOT EXISTS videos (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  artist           VARCHAR(255) NOT NULL DEFAULT '未知艺术家',
  artist_id        BIGINT UNSIGNED NULL,
  file_path        VARCHAR(512) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  status           ENUM('online', 'offline') NOT NULL DEFAULT 'online',
  play_count       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  published_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  duration_weight DECIMAL(10, 6) AS (
    LOG(GREATEST(duration_seconds, 1))
  ) STORED,
  base_score DECIMAL(16, 6) AS (
    play_count * LOG(GREATEST(duration_seconds, 1))
  ) STORED,
  INDEX idx_v_status_base (status, base_score DESC),
  INDEX idx_v_play_count (play_count DESC),
  INDEX idx_v_artist_id (artist_id),
  CONSTRAINT fk_videos_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS video_play_events (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NULL,
  video_id   BIGINT UNSIGNED NOT NULL,
  played_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vp_video (video_id, played_at),
  INDEX idx_vp_user (user_id, played_at),
  CONSTRAINT fk_vpe_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_vpe_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_video_play_records (
  user_id               BIGINT UNSIGNED NOT NULL,
  video_id              BIGINT UNSIGNED NOT NULL,
  play_timestamps_json  JSON NOT NULL,
  play_count            INT UNSIGNED NOT NULL DEFAULT 0,
  last_played_at        DATETIME NULL,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id),
  CONSTRAINT fk_uvpr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uvpr_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS video_favorites (
  user_id    BIGINT UNSIGNED NOT NULL,
  video_id   BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id),
  CONSTRAINT fk_vf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vf_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 视频周榜 / 月榜（dense_rank）
CREATE OR REPLACE VIEW v_hot_videos_weekly AS
SELECT video_id, title, artist, duration_seconds, published_at,
       period_play_count, DENSE_RANK() OVER (ORDER BY period_play_count DESC) AS rank_num
FROM (
  SELECT v.id AS video_id, v.title, v.artist, v.duration_seconds, v.published_at,
         COUNT(vpe.id) AS period_play_count
  FROM videos v
  INNER JOIN video_play_events vpe ON vpe.video_id = v.id
  WHERE v.status = 'online' AND vpe.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY v.id, v.title, v.artist, v.duration_seconds, v.published_at
) AS w;

CREATE OR REPLACE VIEW v_hot_videos_monthly AS
SELECT video_id, title, artist, duration_seconds, published_at,
       period_play_count, DENSE_RANK() OVER (ORDER BY period_play_count DESC) AS rank_num
FROM (
  SELECT v.id AS video_id, v.title, v.artist, v.duration_seconds, v.published_at,
         COUNT(vpe.id) AS period_play_count
  FROM videos v
  INNER JOIN video_play_events vpe ON vpe.video_id = v.id
  WHERE v.status = 'online' AND vpe.played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY v.id, v.title, v.artist, v.duration_seconds, v.published_at
) AS m;

-- 用户听歌偏好视图：最常听艺术家
CREATE OR REPLACE VIEW v_user_artist_preference AS
SELECT upr.user_id, s.artist, SUM(upr.play_count) AS total_plays,
       COUNT(DISTINCT upr.song_id) AS song_count,
       MAX(upr.last_played_at) AS last_played_at
FROM user_play_records upr
JOIN songs s ON s.id = upr.song_id
GROUP BY upr.user_id, s.artist;
