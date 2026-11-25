import requests

# 测试创建歌单
BASE_URL = "http://127.0.0.1:8888"

# 先登录
login_data = {
    "username": "testuser",
    "password": "123456"
}

session = requests.Session()

# 登录
login_response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
print(f"登录响应: {login_response.status_code}")
print(f"登录内容: {login_response.json()}")

# 创建歌单
playlist_data = {
    "name": "测试歌单",
    "description": "测试描述"
}

create_response = session.post(f"{BASE_URL}/api/playlists", json=playlist_data)
print(f"\n创建歌单响应: {create_response.status_code}")
print(f"创建歌单内容: {create_response.json()}")

# 获取用户歌单列表
list_response = session.get(f"{BASE_URL}/api/playlists")
print(f"\n获取歌单列表响应: {list_response.status_code}")
print(f"歌单列表内容: {list_response.json()}")
