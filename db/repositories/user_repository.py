"""用户表数据访问"""
from project.db.base.base_repository import BaseRepository


class UserRepository(BaseRepository):

    TABLE = "users"

    def find_by_username(self, username):
        return self.fetch_one(
            f"SELECT id, username, password_hash, role FROM {self.TABLE} WHERE username = %s",
            (username,),
        )

    def find_by_id(self, user_id):
        return self.fetch_one(
            f"SELECT id, username, role, created_at FROM {self.TABLE} WHERE id = %s",
            (user_id,),
        )

    def exists_by_username(self, username):
        row = self.fetch_one(f"SELECT id FROM {self.TABLE} WHERE username = %s", (username,))
        return row is not None

    def create(self, username, password_hash, role="user"):
        return self.insert(
            f"INSERT INTO {self.TABLE} (username, password_hash, role) VALUES (%s, %s, %s)",
            (username, password_hash, role),
        )

    def update_role(self, username, role):
        return self.execute(
            f"UPDATE {self.TABLE} SET role = %s WHERE username = %s",
            (role, username),
        )
