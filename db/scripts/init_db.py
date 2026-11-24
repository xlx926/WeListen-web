#!/usr/bin/env python3
"""初始化 MySQL 数据库：执行 sql/schema.sql"""
import os
from project.db import get_raw_connection


def init_database():
    schema_path = os.path.join(os.path.dirname(__file__), "..", "sql", "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    conn = get_raw_connection(database=None)
    try:
        with conn.cursor() as cursor:
            for statement in _split_sql(sql_content):
                if statement.strip():
                    cursor.execute(statement)
        conn.commit()
        print("[+] MySQL 数据库初始化成功")
    finally:
        conn.close()


def _split_sql(content):
    statements = []
    current = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or stripped.startswith(";"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []
    if current:
        statements.append("\n".join(current))
    return statements


if __name__ == "__main__":
    init_database()
