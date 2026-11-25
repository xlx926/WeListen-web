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
    
    # 检查播放事件
    cursor.execute("SELECT COUNT(*) AS count FROM play_events")
    result = cursor.fetchone()
    print(f"play_events 表记录数: {result['count']}")
    
    # 查看最近的播放事件
    cursor.execute("SELECT * FROM play_events ORDER BY played_at DESC LIMIT 5")
    events = cursor.fetchall()
    print(f"\n最近播放事件:")
    for e in events:
        print(f"  id={e['id']}, user_id={e['user_id']}, song_id={e['song_id']}, played_at={e['played_at']}")
    
    # 检查周榜视图
    cursor.execute("SELECT * FROM v_hot_songs_weekly LIMIT 10")
    weekly = cursor.fetchall()
    print(f"\n周榜数据 ({len(weekly)} 条):")
    for w in weekly:
        print(f"  rank={w['rank_num']}, song={w['title']}, plays={w['period_play_count']}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
