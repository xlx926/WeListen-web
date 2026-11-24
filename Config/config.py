#!usr/bin/env python3
# @File: config.py
# 读取 setting.conf 中的 MySQL 等配置

import configparser
import os


def _config_path():
    return os.path.join(os.path.dirname(os.path.realpath(__file__)), "setting.conf")


def getConfig(section, key):
    """读取配置项"""
    cfg = configparser.ConfigParser()
    cfg.read(_config_path(), encoding="utf-8")
    return cfg.get(section, key)


def get_mysql_config():
    """返回 MySQL 连接参数字典"""
    return {
        "host": getConfig("mysql", "host"),
        "port": int(getConfig("mysql", "port")),
        "user": getConfig("mysql", "user"),
        "password": getConfig("mysql", "password"),
        "database": getConfig("mysql", "database"),
        "charset": getConfig("mysql", "charset"),
        "pool_size": int(getConfig("mysql", "pool_size")),
    }
