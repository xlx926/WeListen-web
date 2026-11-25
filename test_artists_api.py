import requests

BASE_URL = "http://127.0.0.1:8888"

# 先登录
session = requests.Session()
login_response = session.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser",
    "password": "123456"
})
print(f"登录: {login_response.status_code}")

# 获取艺术家列表
artists_response = session.get(f"{BASE_URL}/api/artists")
print(f"艺术家列表: {artists_response.status_code}")
print(f"内容: {artists_response.json()}")
