import mysql.connector

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="12648765431gft@",
        database="listen_now"
    )
    cursor = conn.cursor()

    # 创建 artists 表（如果不存在）
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS artists (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            bio TEXT,
            avatar_url VARCHAR(512),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_name (name)
        ) ENGINE=InnoDB
    """)
    print("已创建 artists 表")

    # 创建关注表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS follow_artists (
            user_id BIGINT UNSIGNED NOT NULL,
            artist_id BIGINT UNSIGNED NOT NULL,
            followed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, artist_id),
            INDEX idx_fa_artist (artist_id),
            CONSTRAINT fk_fa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_fa_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    """)
    print("已创建 follow_artists 表")

    conn.commit()
    print("迁移完成")
except Exception as e:
    print(f"迁移失败: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
