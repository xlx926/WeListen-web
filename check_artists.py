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
    
    # 检查表结构
    cursor.execute("DESCRIBE artists")
    columns = cursor.fetchall()
    print("artists 表结构:")
    for col in columns:
        print(f"  {col['Field']} - {col['Type']}")
    
    # 添加一些测试艺术家
    test_artists = [
        ("周杰伦", "华语流行音乐天王，创作型歌手"),
        ("林俊杰", "新加坡华语流行音乐歌手"),
        ("邓紫棋", "香港创作型歌手"),
        ("薛之谦", "华语流行音乐歌手"),
        ("毛不易", "华语流行音乐创作歌手"),
    ]
    
    for name, bio in test_artists:
        try:
            cursor.execute(
                "INSERT INTO artists (name, bio) VALUES (%s, %s)",
                (name, bio)
            )
            print(f"添加艺术家: {name}")
        except Exception as e:
            if "Duplicate" in str(e):
                print(f"艺术家已存在: {name}")
            else:
                print(f"添加失败 {name}: {e}")
    
    conn.commit()
    
    # 查看结果
    cursor.execute("SELECT id, name, bio FROM artists")
    artists = cursor.fetchall()
    print(f"\n艺术家列表 ({len(artists)} 条):")
    for a in artists:
        print(f"  id={a['id']}, name={a['name']}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
