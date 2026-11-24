"""Repository 基类"""
from contextlib import contextmanager
from mysql.connector.errors import Error as MySQLError

from project.db.connection.mysql_pool import MySQLPool


class BaseRepository:
    """数据访问基类，封装通用 CRUD 操作"""

    def __init__(self, pool=None):
        self._pool = pool or MySQLPool.instance()

    def acquire(self):
        return self._pool.acquire()

    @contextmanager
    def cursor(self, conn):
        cur = conn.cursor(dictionary=True)
        try:
            yield cur
        finally:
            cur.close()

    def fetch_one(self, sql, params=None):
        conn = self.acquire()
        try:
            with self.cursor(conn) as cur:
                cur.execute(sql, params or ())
                return cur.fetchone()
        finally:
            conn.close()

    def fetch_all(self, sql, params=None):
        conn = self.acquire()
        try:
            with self.cursor(conn) as cur:
                cur.execute(sql, params or ())
                return cur.fetchall()
        finally:
            conn.close()

    def execute(self, sql, params=None):
        """执行写操作并提交，返回影响行数"""
        conn = self.acquire()
        try:
            with self.cursor(conn) as cur:
                cur.execute(sql, params or ())
                affected = cur.rowcount
            conn.commit()
            return affected
        except MySQLError:
            conn.rollback()
            raise
        finally:
            conn.close()

    def insert(self, sql, params=None):
        """插入并返回自增 ID"""
        conn = self.acquire()
        try:
            with self.cursor(conn) as cur:
                cur.execute(sql, params or ())
                last_id = cur.lastrowid
            conn.commit()
            return last_id
        except MySQLError:
            conn.rollback()
            raise
        finally:
            conn.close()

    def run_transaction(self, callback):
        """在事务中执行回调 callback(cursor) -> result"""
        conn = self.acquire()
        try:
            with self.cursor(conn) as cur:
                result = callback(cur)
            conn.commit()
            return result
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
