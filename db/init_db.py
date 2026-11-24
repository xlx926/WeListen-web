#!/usr/bin/env python3
"""初始化数据库表结构"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pymysql
from project.Config import config

def init_database():
    # 读取 SQL 文件
    sql_file = os.path.join(os.path.dirname(__file__), 'sql', 'schema.sql')
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # 连接数据库（不指定数据库，因为 SQL 里会创建）
    conn = pymysql.connect(
        host=config.getConfig("mysql", "host"),
        port=int(config.getConfig("mysql", "port")),
        user=config.getConfig("mysql", "user"),
        password=config.getConfig("mysql", "password"),
        charset='utf8mb4',
    )
    
    cursor = conn.cursor()
    
    # 分割 SQL 语句并执行
    statements = sql_content.split(';')
    for stmt in statements:
        stmt = stmt.strip()
        if stmt and not stmt.startswith('--'):
            try:
                cursor.execute(stmt)
                print(f"✓ 执行成功: {stmt[:50]}...")
            except Exception as e:
                # 忽略 "已存在" 类型的错误
                if 'already exists' in str(e).lower() or 'Duplicate' in str(e):
                    print(f"○ 已存在，跳过: {stmt[:50]}...")
                else:
                    print(f"✗ 执行失败: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("\n数据库初始化完成！")

if __name__ == '__main__':
    init_database()
