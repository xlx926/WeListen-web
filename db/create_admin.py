"""兼容旧路径：python -m db.create_admin"""
from project.db.scripts.create_admin import main

if __name__ == "__main__":
    main()
