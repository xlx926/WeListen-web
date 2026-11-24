-- 用户关注歌手表（在 DataGrip 中执行，或由后端启动时自动创建）
USE listen_now;

CREATE TABLE IF NOT EXISTS artists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(128) NOT NULL,
  bio         TEXT,
  avatar_url  VARCHAR(512) DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_artist_name (name),
  INDEX idx_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS follow_artists (
  user_id     BIGINT UNSIGNED NOT NULL,
  artist_id   BIGINT UNSIGNED NOT NULL,
  followed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, artist_id),
  INDEX idx_fa_artist (artist_id),
  CONSTRAINT fk_fa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fa_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;
