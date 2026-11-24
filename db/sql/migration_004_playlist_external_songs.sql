-- 歌单支持网易云等外部歌曲（在 DataGrip 中执行，或由后端启动时自动创建）
USE listen_now;

CREATE TABLE IF NOT EXISTS playlist_external_songs (
  playlist_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'Neteasemusic',
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL DEFAULT '',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, platform, external_id),
  INDEX idx_pes_playlist (playlist_id),
  CONSTRAINT fk_pes_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
) ENGINE=InnoDB;
