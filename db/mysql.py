"""兼容旧导入，请优先使用 project.db"""
from project.db import get_connection, get_raw_connection

__all__ = ["get_connection", "get_raw_connection"]
