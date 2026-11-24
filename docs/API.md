# API 文档

基础地址：`http://127.0.0.1:8888`

## 认证

登录后使用 Cookie Session，跨域请求需设置 `credentials: 'include'`。

### 注册
```http
POST /api/auth/register
Content-Type: application/json

{"username": "user1", "password": "123456"}
```

### 登录
```http
POST /api/auth/login
Content-Type: application/json

{"username": "admin", "password": "admin123"}
```

## 歌曲

### 上传（管理员）
```http
POST /api/songs/upload
Content-Type: multipart/form-data

file: <音频文件>
title: 歌曲名
artist: 艺术家
duration_seconds: 240
```

### 下架（管理员）
```http
POST /api/songs/1/offline
```

### 播放（记录播放量 + JSON 时间序列）
```http
POST /api/songs/1/play
```

### 获取音频流
```http
GET /api/songs/1/stream
```

### 收藏
```http
POST /api/songs/1/favorite
DELETE /api/songs/1/favorite
GET /api/songs/favorites
```

## 歌单

```http
POST /api/playlists          {"name": "我的歌单", "description": ""}
GET  /api/playlists
GET  /api/playlists/1
POST /api/playlists/1/songs   {"song_id": 1}
DELETE /api/playlists/1/songs/1
DELETE /api/playlists/1
```

## 排行榜

```http
GET /api/rankings/weekly      # 近7天 dense_rank 周榜
GET /api/rankings/monthly     # 近30天 dense_rank 月榜
GET /api/rankings/all-time    # 总播放量排行
GET /api/rankings/weight      # 权重分排行（生成列）
GET /api/rankings/my-stats    # 当前用户听歌统计（需登录）
```

## 平台爬虫（多平台搜索/播放外链）

从网易云、QQ、酷狗等平台实时爬取歌曲信息，与本地曲库（`/api/songs`）并存。

```http
GET  /api/crawl/platforms
POST /api/crawl/search   {"title":"成都","platform":"Neteasemusic","page":1}
POST /api/crawl/id       {"id":"123456","platform":"Neteasemusic"}
GET  /api/crawl/kugou/top-songlists
```

支持平台：`Neteasemusic`、`QQmusic`、`Kugoumusic`、`Kuwomusic`、`Migumusic`、`Baidumusic`、`Xiamimusic`（虾米已停运）

## 播放记录（需登录）

```http
GET /api/play-history/recent      # 最近每次播放
GET /api/play-history/summary     # 按歌曲汇总
GET /api/play-history/all         # 本地+外部平台合并
GET /api/play-history/external    # 外部平台播放记录
GET /api/play-history/song/<id>/timestamps  # 某首歌的时间序列
```

播放本地歌曲时调用 `POST /api/songs/<id>/play` 会自动写入 `play_events` 和 `user_play_records`。
登录用户调用 `POST /api/crawl/id` 会自动写入 `external_play_records`。
