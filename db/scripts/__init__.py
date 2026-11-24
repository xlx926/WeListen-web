"""数据库脚本入口"""
from project.db.scripts.init_db import init_database
from project.db.scripts.create_admin import main as create_admin

__all__ = ["init_database", "create_admin"]
