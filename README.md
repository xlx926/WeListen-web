# WeListen 用户端音乐点播系统

基于 **Flask + MySQL 8** 的音乐点播后端，数据库统一使用 MySQL，驱动为官方 `mysql-connector-python`，支持歌曲上传/下架、用户注册登录、播放、收藏、歌单管理与多维度排行榜。

## 技术特性

- **MySQL 窗口函数** `DENSE_RANK()`：周榜、月榜动态排行，避免嵌套子查询
- **JSON 压缩时间序列**：`user_play_records.play_timestamps_json` 使用 zlib+base64 存储播放记录
- **生成列 `weight_score`**：根据播放量、发布时间、歌曲时长自动计算权重，并建索引优化查询

## 环境要求

- Python 3.8+
- MySQL 8.0+（数据库唯一存储，无 Redis/MongoDB）
- mysql-connector-python 8.x

## 项目结构

```
welisten/
├── project/     # 后端（Flask + MySQL）
├── frontend/    # 前端（待开发）
└── docs/        # 文档
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置数据库

编辑 `project/Config/setting.conf` 中的 `[mysql]` 段：

```ini
[mysql]
host=127.0.0.1
port=3306
user=root
password=你的密码
database=listen_now
```

### 3. 初始化数据库

```bash
cd project
python -m db.init_db
python -m db.create_admin admin admin123
```

### 4. 启动服务

```bash
cd project
python main.py
```

服务默认运行在 `http://127.0.0.1:8888`

## API 概览

| 功能    | 方法          | 路径                             |
| ----- | ----------- | ------------------------------ |
| 注册    | POST        | `/api/auth/register`           |
| 登录    | POST        | `/api/auth/login`              |
| 上传歌曲  | POST        | `/api/songs/upload`（管理员）       |
| 下架歌曲  | POST        | `/api/songs/<id>/offline`（管理员） |
| 歌曲列表  | GET         | `/api/songs?order_by=weight`   |
| 播放记录  | POST        | `/api/songs/<id>/play`         |
| 音频流   | GET         | `/api/songs/<id>/stream`       |
| 收藏    | POST/DELETE | `/api/songs/<id>/favorite`     |
| 创建歌单  | POST        | `/api/playlists`               |
| 周榜    | GET         | `/api/rankings/weekly`         |
| 月榜    | GET         | `/api/rankings/monthly`        |
| 总播放量榜 | GET         | `/api/rankings/all-time`       |
| 权重榜   | GET         | `/api/rankings/weight`         |

详细说明见 [docs/API.md](docs/API.md)
# WeListen-web
