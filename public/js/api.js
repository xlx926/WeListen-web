/**
 * 后端 API 封装
 * 所有请求自动携带 Cookie（Session 登录态）
 */
const api = {
  async request(path, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${path}`;
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "请求失败");
    }
    return data;
  },

  // 认证
  register(username, password) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  login(username, password) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  },
  me() {
    return this.request("/api/auth/me");
  },

  // 歌曲
  listSongs(page = 1, orderBy = "weight") {
    return this.request(`/api/songs?page=${page}&order_by=${orderBy}`);
  },
  playSong(id) {
    return this.request(`/api/songs/${id}/play`, { method: "POST" });
  },
  streamUrl(id) {
    return `${CONFIG.API_BASE_URL}/api/songs/${id}/stream`;
  },
  addFavorite(id) {
    return this.request(`/api/songs/${id}/favorite`, { method: "POST" });
  },
  removeFavorite(id) {
    return this.request(`/api/songs/${id}/favorite`, { method: "DELETE" });
  },
  listFavorites(page = 1) {
    return this.request(`/api/songs/favorites?page=${page}`);
  },

  // 歌单
  createPlaylist(name, description = "") {
    return this.request("/api/playlists", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },
  listPlaylists() {
    return this.request("/api/playlists");
  },
  getPlaylist(id) {
    return this.request(`/api/playlists/${id}`);
  },

  // 排行榜
  weeklyRanking(limit = 50) {
    return this.request(`/api/rankings/weekly?limit=${limit}`);
  },
  monthlyRanking(limit = 50) {
    return this.request(`/api/rankings/monthly?limit=${limit}`);
  },
  allTimeRanking(limit = 50) {
    return this.request(`/api/rankings/all-time?limit=${limit}`);
  },

  // 平台爬虫（网易云/QQ/酷狗等）
  crawlPlatforms() {
    return this.request("/api/crawl/platforms");
  },
  crawlSearch(title, platform, page = 1) {
    return this.request("/api/crawl/search", {
      method: "POST",
      body: JSON.stringify({ title, platform, page }),
    });
  },
  crawlById(id, platform) {
    return this.request("/api/crawl/id", {
      method: "POST",
      body: JSON.stringify({ id, platform }),
    });
  },
  kugouTopSonglists() {
    return this.request("/api/crawl/kugou/top-songlists");
  },

  // 播放记录
  playHistoryRecent(page = 1) {
    return this.request(`/api/play-history/recent?page=${page}`);
  },
  playHistorySummary(page = 1) {
    return this.request(`/api/play-history/summary?page=${page}`);
  },
  playHistoryAll(page = 1) {
    return this.request(`/api/play-history/all?page=${page}`);
  },
  playHistoryExternal(page = 1) {
    return this.request(`/api/play-history/external?page=${page}`);
  },
};
