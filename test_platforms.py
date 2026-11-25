import requests

platforms = ["QQmusic", "Kugoumusic", "Kuwomusic", "Migumusic"]

for platform in platforms:
    print(f"=== {platform} ===")
    try:
        r = requests.post('http://127.0.0.1:8888/api/crawl/search', 
                         json={'title': '可惜不是你', 'platform': platform, 'page': 1},
                         timeout=10)
        data = r.json()
        songs = data.get('data', {}).get('songList', [])
        if songs:
            song = songs[0]
            print(f"Found: {song['title']} - {song['artist']} (ID: {song['id']})")
            r2 = requests.post('http://127.0.0.1:8888/api/crawl/id',
                              json={'id': song['id'], 'platform': platform},
                              timeout=10)
            data2 = r2.json()
            play_url = data2.get('data', {}).get('play_url', '')
            if play_url:
                print(f"Play URL: {play_url[:100]}...")
                # 测试代理
                proxy_url = f"http://127.0.0.1:8888/api/crawl/proxy?url={requests.utils.quote(play_url)}"
                r3 = requests.get(proxy_url, stream=True, timeout=10)
                ct = r3.headers.get('Content-Type', '')
                print(f"Proxy Status: {r3.status_code}, Content-Type: {ct}")
            else:
                print("No play URL")
        else:
            print("No songs found")
    except Exception as e:
        print(f"Error: {e}")
    print()
