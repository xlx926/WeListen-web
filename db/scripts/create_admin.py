#!/usr/bin/env python3
"""创建管理员账户: python -m db.scripts.create_admin admin admin123"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from project.services.auth_service import AuthService
from project.db.repositories.user_repository import UserRepository


def main():
    username = sys.argv[1] if len(sys.argv) > 1 else "admin"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin123"
    service = AuthService()
    user, err = service.register(username, password, role="admin")
    if err and "已存在" in err:
        UserRepository().update_role(username, "admin")
        print(f"[+] 已将用户 {username} 提升为管理员")
    elif err:
        print(f"[-] 失败: {err}")
    else:
        print(f"[+] 管理员创建成功: {username}")


if __name__ == "__main__":
    main()
