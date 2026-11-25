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
    # 检查列是否存在
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'songs' AND COLUMN_NAME = 'uploader_id'
        AND TABLE_SCHEMA = 'listen_now'
    """)
    if cursor.fetchone()[0] == 0:
        cursor.execute("ALTER TABLE songs ADD COLUMN uploader_id BIGINT UNSIGNED NULL AFTER duration_seconds")
        print("已添加 uploader_id 列")
    else:
        print("uploader_id 列已存在")

    # 检查索引是否存在
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_NAME = 'songs' AND INDEX_NAME = 'idx_uploader'
        AND TABLE_SCHEMA = 'listen_now'
    """)
    if cursor.fetchone()[0] == 0:
        cursor.execute("ALTER TABLE songs ADD INDEX idx_uploader (uploader_id)")
        print("已添加 idx_uploader 索引")
    else:
        print("idx_uploader 索引已存在")

    conn.commit()
    print("迁移完成")
except Exception as e:
    print(f"迁移失败: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
