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
    
    # 检查songs表结构
    cursor.execute("DESCRIBE songs")
    columns = cursor.fetchall()
    print("songs 表结构:")
    for col in columns:
        print(f"  {col['Field']} - {col['Type']}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
