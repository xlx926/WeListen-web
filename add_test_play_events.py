import mysql.connector
from datetime import datetime, timedelta
import random

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="12648765431gft@",
        database="listen_now"
    )
    cursor = conn.cursor()
    
    # 获取歌曲列表
    cursor.execute("SELECT id FROM songs WHERE status = 'online'")
    songs = [row[0] for row in cursor.fetchall()]
    
    if not songs:
        print("没有在线歌曲")
        exit()
    
    print(f"找到 {len(songs)} 首在线歌曲")
    
    # 添加测试播放事件（模拟最近一周的数据）
    now = datetime.now()
    test_events = []
    
    for song_id in songs[:10]:  # 取前10首歌
        # 每首歌随机播放几次
        play_count = random.randint(1, 50)
        for _ in range(play_count):
            # 随机时间（最近一周内）
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            played_at = now - timedelta(days=days_ago, hours=hours_ago)
            test_events.append((1, song_id, played_at))  # user_id=1
    
    # 批量插入
    cursor.executemany(
        "INSERT INTO play_events (user_id, song_id, played_at) VALUES (%s, %s, %s)",
        test_events
    )
    conn.commit()
    
    print(f"添加了 {len(test_events)} 条播放事件")
    
    # 验证周榜
    cursor.execute("SELECT * FROM v_hot_songs_weekly ORDER BY rank_num LIMIT 10")
    weekly = cursor.fetchall()
    print(f"\n周榜数据 ({len(weekly)} 条):")
    for w in weekly:
        print(f"  rank={w[6]}, song={w[1]}, artist={w[2]}, plays={w[5]}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
