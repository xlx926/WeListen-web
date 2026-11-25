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
    
    # 检查歌曲表
    cursor.execute("SELECT COUNT(*) AS count FROM songs")
    result = cursor.fetchone()
    print(f"songs 表记录数: {result['count']}")
    
    # 查看所有歌曲状态
    cursor.execute("SELECT status, COUNT(*) AS count FROM songs GROUP BY status")
    status_counts = cursor.fetchall()
    print("\n歌曲状态分布:")
    for sc in status_counts:
        print(f"  {sc['status']}: {sc['count']}")
    
    # 查看歌曲详情
    cursor.execute("SELECT id, title, artist, status FROM songs LIMIT 10")
    songs = cursor.fetchall()
    print("\n歌曲列表:")
    for s in songs:
        print(f"  id={s['id']}, title={s['title']}, artist={s['artist']}, status={s['status']}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
