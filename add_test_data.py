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
    
    # 添加测试歌曲
    test_songs = [
        ("晴天", "周杰伦", "/music/qingtian.mp3", 269),
        ("七里香", "周杰伦", "/music/qilixiang.mp3", 299),
        ("夜曲", "周杰伦", "/music/yequ.mp3", 249),
        ("江南", "林俊杰", "/music/jiangnan.mp3", 285),
        ("曹操", "林俊杰", "/music/caocao.mp3", 270),
        ("小酒窝", "林俊杰", "/music/xiaojiuwo.mp3", 247),
        ("光年之外", "邓紫棋", "/music/guangnianzhiwai.mp3", 265),
        ("喜欢你", "邓紫棋", "/music/xihuanni.mp3", 296),
        ("体面", "于文文", "/music/timian.mp3", 268),
        ("后来", "刘若英", "/music/houlai.mp3", 336),
        ("遇见", "孙燕姿", "/music/yujian.mp3", 249),
        ("勇气", "梁静茹", "/music/yongqi.mp3", 272),
        ("可惜不是你", "梁静茹", "/music/kexibushini.mp3", 285),
        ("十年", "陈奕迅", "/music/shinian.mp3", 259),
        ("浮夸", "陈奕迅", "/music/fukua.mp3", 266),
    ]
    
    # 计算发布时间（随机在最近1年内）
    now = datetime.now()
    songs_data = []
    for title, artist, file_path, duration in test_songs:
        days_ago = random.randint(1, 365)
        published_at = now - timedelta(days=days_ago)
        play_count = random.randint(100, 10000)
        songs_data.append((title, artist, file_path, duration, play_count, published_at))
    
    cursor.executemany(
        "INSERT INTO songs (title, artist, file_path, duration_seconds, play_count, published_at) VALUES (%s, %s, %s, %s, %s, %s)",
        songs_data
    )
    conn.commit()
    
    print(f"添加了 {len(test_songs)} 首测试歌曲")
    
    # 添加播放事件
    cursor.execute("SELECT id FROM songs")
    song_ids = [row[0] for row in cursor.fetchall()]
    
    test_events = []
    for song_id in song_ids:
        play_count = random.randint(5, 80)
        for _ in range(play_count):
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            played_at = now - timedelta(days=days_ago, hours=hours_ago)
            test_events.append((1, song_id, played_at))
    
    cursor.executemany(
        "INSERT INTO play_events (user_id, song_id, played_at) VALUES (%s, %s, %s)",
        test_events
    )
    conn.commit()
    
    print(f"添加了 {len(test_events)} 条播放事件")
    
    # 验证周榜
    cursor.execute("SELECT * FROM v_hot_songs_weekly ORDER BY rank_num LIMIT 10")
    weekly = cursor.fetchall()
    print("\n周榜数据:")
    for w in weekly:
        print(f"  rank={w[6]}, song={w[1]}, artist={w[2]}, plays={w[5]}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
