import mysql.connector

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="12648765431gft@",
        database="listen_now"
    )
    cursor = conn.cursor(dictionary=True)
    
    # 检查播放事件表
    cursor.execute("SELECT COUNT(*) AS count FROM play_events")
    result = cursor.fetchone()
    print(f"play_events: {result['count']}")
    
    # 检查外部播放记录表
    cursor.execute("SELECT COUNT(*) AS count FROM external_play_records")
    result = cursor.fetchone()
    print(f"external_play_records: {result['count']}")
    
    # 检查用户表
    cursor.execute("SELECT id, username FROM users LIMIT 5")
    users = cursor.fetchall()
    print(f"users: {[(u['id'], u['username']) for u in users]}")
    
    # 检查外部播放记录
    cursor.execute("SELECT user_id, title, artist, platform, played_at FROM external_play_records ORDER BY played_at DESC LIMIT 5")
    records = cursor.fetchall()
    print(f"recent external records: {len(records)}")
    for r in records:
        print(f"  user={r['user_id']}, title={r['title']}, platform={r['platform']}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
