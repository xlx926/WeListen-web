"""MySQL 连接池（单例）"""
import mysql.connector
from mysql.connector import pooling
from mysql.connector.errors import Error as MySQLError

from project.Config.config import get_mysql_config


class MySQLPool:
    """MySQL 连接池管理类"""

    _instance = None

    def __init__(self):
        cfg = get_mysql_config()
        self._pool = pooling.MySQLConnectionPool(
            pool_name="welisten_pool",
            pool_size=cfg["pool_size"],
            pool_reset_session=True,
            host=cfg["host"],
            port=cfg["port"],
            user=cfg["user"],
            password=cfg["password"],
            database=cfg["database"],
            charset=cfg["charset"],
            autocommit=False,
        )
        self._cfg = cfg

    @classmethod
    def instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def acquire(self):
        """从连接池获取连接"""
        return self._pool.get_connection()

    def acquire_raw(self, database=None):
        """获取裸连接（初始化数据库时使用）"""
        return mysql.connector.connect(
            host=self._cfg["host"],
            port=self._cfg["port"],
            user=self._cfg["user"],
            password=self._cfg["password"],
            database=database,
            charset=self._cfg["charset"],
            autocommit=False,
        )
