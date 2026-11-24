import { CONFIG } from "./config";

export interface Song {
  id: number;
  title: string;
  artist: string;
  duration_seconds: number;
  status: "online" | "offline";
  play_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

export interface User {
  id: number;
  username: string;
  role: "user" | "admin";
}

export interface PlaylistSongItem {
  id?: number;
  external_id?: string;
  platform?: string;
  title: string;
  artist: string;
  duration_seconds?: number;
  play_count?: number;
  position?: number;
  added_at?: string;
  source?: "local" | "external";
}

export interface Playlist {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  song_count?: number;
  songs?: PlaylistSongItem[];
}

export interface RankingItem {
  song_id?: number;
  external_id?: string;
  platform?: string;
  title: string;
  artist: string;
  duration_seconds?: number;
  published_at?: string;
  period_play_count: number;
  rank_num: number;
}

export interface Artist {
  id: number;
  name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  song_count?: number;
}

export interface PlayHistoryItem {
  event_id: number;
  user_id: number;
  song_id: number;
  title: string;
  artist: string;
  duration_seconds: number;
  played_at: string;
  source: "local" | "external";
  platform?: string;
  external_id?: string;
  user_total_plays?: number;
}

export interface Video {
  id: number;
  title: string;
  artist: string;
  duration_seconds: number;
  play_count: number;
  published_at: string;
}

export interface CrawlPlatform {
  id: string;
  name: string;
  search: boolean;
  id_search: boolean;
}

export interface CrawlSong {
  id: string;
  title: string;
  artist: string;
  play_url?: string;
  image_url?: string;
  lyric?: string;
}

export interface CrawlSearchResult {
  now_page: number;
  next_page: number;
  before_page?: number;
  totalnum: number;
  songList?: CrawlSong[];
  song?: {
    list?: Array<{ id: string | number; music_name?: string; title?: string; artists?: string; artist?: string }>;
    totalnum?: number;
  };
}

export interface AiRecommendation {
  title: string;
  artist: string;
  reason: string;
  matched: boolean;
  song?: CrawlSong | null;
}

export interface AiRecommendResult {
  mode: "guess" | "prompt";
  summary: string;
  platform: string;
  prompt?: string;
  recommendations: AiRecommendation[];
}

function normalizeCrawlSongList(data: CrawlSearchResult): CrawlSong[] {
  if (data.songList?.length) {
    return data.songList;
  }
  const rawList = data.song?.list ?? [];
  return rawList.map((item) => ({
    id: String(item.id ?? ""),
    title: item.music_name || item.title || "",
    artist: item.artists || item.artist || "",
  }));
}

type ApiResponse<T = unknown> = {
  code: number;
  message?: string;
  data: T;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${CONFIG.API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error("无法连接后端服务，请先启动 project/main.py（8888 端口）");
  }

  let data: ApiResponse<T>;
  try {
    data = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(res.ok ? "服务器响应格式错误" : `请求失败（HTTP ${res.status}）`);
  }

  if (!res.ok) {
    throw new Error(data.message || "请求失败");
  }
  return data;
}

export const api = {
  auth: {
    register(username: string, password: string) {
      return request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    login(username: string, password: string) {
      return request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    logout() {
      return request("/api/auth/logout", { method: "POST" });
    },

    me(): Promise<ApiResponse<User>> {
      return request("/api/auth/me");
    },
  },

  songs: {
    list(params?: {
      page?: number;
      limit?: number;
      order_by?: "weight" | "play_count" | "published";
      search?: string;
    }): Promise<ApiResponse<{ items: Song[]; total: number }>> {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.order_by) query.set("order_by", params.order_by);
      if (params?.search) query.set("search", params.search);
      return request(`/api/songs?${query}`);
    },

    get(id: number): Promise<ApiResponse<Song>> {
      return request(`/api/songs/${id}`);
    },

    play(id: number) {
      return request(`/api/songs/${id}/play`, { method: "POST" });
    },

    getStreamUrl(id: number): string {
      return `${CONFIG.MEDIA_BASE_URL}/api/songs/${id}/stream`;
    },

    favorites(): Promise<ApiResponse<Song[]>> {
      return request("/api/songs/favorites");
    },

    toggleFavorite(id: number): Promise<ApiResponse<{ is_favorite: boolean }>> {
      return request(`/api/songs/${id}/favorite`, { method: "POST" });
    },

    upload(file: File, title: string, artist: string, duration?: number): Promise<ApiResponse<Song>> {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("artist", artist);
      if (duration) formData.append("duration_seconds", String(duration));

      return fetch(`${CONFIG.API_BASE_URL}/api/songs/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(async (res) => {
        let data: ApiResponse<Song>;
        try {
          data = (await res.json()) as ApiResponse<Song>;
        } catch {
          throw new Error(res.ok ? "服务器响应格式错误" : `上传失败（HTTP ${res.status}）`);
        }
        if (!res.ok) {
          throw new Error(data.message || "上传失败");
        }
        return data;
      });
    },

    offline(songId: number): Promise<ApiResponse<{ id: number; status: string }>> {
      return request(`/api/songs/${songId}/offline`, {
        method: "POST",
      });
    },

    myUploads(page?: number): Promise<ApiResponse<{ list: Song[]; total: number; page: number; page_size: number }>> {
      return request(`/api/songs/my-uploads?page=${page || 1}`);
    },
  },

  rankings: {
    weekly(startDate?: string, endDate?: string): Promise<ApiResponse<RankingItem[]>> {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return request(`/api/rankings/weekly?${params}`);
    },

    monthly(startDate?: string, endDate?: string): Promise<ApiResponse<RankingItem[]>> {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return request(`/api/rankings/monthly?${params}`);
    },
  },

  playlists: {
    list(params?: { page?: number; limit?: number }): Promise<ApiResponse<Playlist[]>> {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      return request(`/api/playlists?${query}`);
    },

    get(id: number): Promise<ApiResponse<Playlist>> {
      return request(`/api/playlists/${id}`);
    },

    create(name: string, description?: string): Promise<ApiResponse<Playlist>> {
      return request("/api/playlists", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
    },

    update(id: number, name: string, description?: string): Promise<ApiResponse<Playlist>> {
      return request(`/api/playlists/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, description }),
      });
    },

    delete(id: number): Promise<ApiResponse<void>> {
      return request(`/api/playlists/${id}`, { method: "DELETE" });
    },

    addSong(
      playlistId: number,
      payload:
        | { song_id: number }
        | { external_id: string; title: string; artist?: string; platform?: string }
    ): Promise<ApiResponse<Playlist>> {
      return request(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    removeSong(playlistId: number, songId: number): Promise<ApiResponse<{ removed: boolean }>> {
      return request(`/api/playlists/${playlistId}/songs/${songId}`, { method: "DELETE" });
    },

    removeExternalSong(
      playlistId: number,
      externalId: string,
      platform = "Neteasemusic"
    ): Promise<ApiResponse<{ removed: boolean }>> {
      const params = new URLSearchParams({ platform });
      return request(`/api/playlists/${playlistId}/external-songs/${encodeURIComponent(externalId)}?${params}`, {
        method: "DELETE",
      });
    },
  },

  videos: {
    list(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<{ items: Video[]; total: number }>> {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.search) query.set("search", params.search);
      return request(`/api/videos?${query}`);
    },

    get(id: number): Promise<ApiResponse<Video>> {
      return request(`/api/videos/${id}`);
    },
  },

  crawl: {
    platforms(): Promise<ApiResponse<CrawlPlatform[]>> {
      return request("/api/crawl/platforms");
    },

    async search(title: string, platform: string, page?: number): Promise<ApiResponse<CrawlSearchResult & { songList: CrawlSong[] }>> {
      const res = await request<CrawlSearchResult>("/api/crawl/search", {
        method: "POST",
        body: JSON.stringify({ title, platform, page: page || 1 }),
      });
      return {
        ...res,
        data: {
          ...res.data,
          songList: normalizeCrawlSongList(res.data),
          totalnum: res.data.totalnum ?? res.data.song?.totalnum ?? 0,
        },
      };
    },

    getById(musicId: string, platform: string): Promise<ApiResponse<CrawlSong>> {
      return request("/api/crawl/id", {
        method: "POST",
        body: JSON.stringify({ id: musicId, platform }),
      });
    },

    proxyUrl(audioUrl: string): string {
      const base = CONFIG.API_BASE_URL.replace(/\/$/, "");
      return `${base}/api/crawl/proxy?url=${encodeURIComponent(audioUrl)}`;
    },
  },

  recommend: {
    guess(platform?: string, limit?: number): Promise<ApiResponse<AiRecommendResult>> {
      return request("/api/recommend/guess", {
        method: "POST",
        body: JSON.stringify({ platform: platform || "Neteasemusic", limit: limit || 8 }),
      });
    },

    prompt(text: string, platform?: string, limit?: number): Promise<ApiResponse<AiRecommendResult>> {
      return request("/api/recommend/prompt", {
        method: "POST",
        body: JSON.stringify({
          prompt: text,
          platform: platform || "Neteasemusic",
          limit: limit || 8,
        }),
      });
    },
  },

  playHistory: {
    recent(page?: number): Promise<ApiResponse<{ list: PlayHistoryItem[]; total: number }>> {
      return request(`/api/play-history/recent?page=${page || 1}`);
    },

    summary(page?: number): Promise<ApiResponse<{ list: PlayHistoryItem[]; total: number }>> {
      return request(`/api/play-history/summary?page=${page || 1}`);
    },

    all(page?: number): Promise<ApiResponse<{ list: PlayHistoryItem[]; total: number }>> {
      return request(`/api/play-history/all?page=${page || 1}`);
    },

    recordPlay(songId: number): Promise<ApiResponse<{ success: boolean }>> {
      return request("/api/play-history/record", {
        method: "POST",
        body: JSON.stringify({ song_id: songId }),
      });
    },
  },

  artists: {
    list(page?: number, keyword?: string, pageSize = 50): Promise<ApiResponse<{ list: Artist[]; page: number }>> {
      const params = new URLSearchParams();
      if (page) params.append("page", String(page));
      params.append("page_size", String(pageSize));
      if (keyword) params.append("q", keyword);
      return request(`/api/artists?${params.toString()}`);
    },

    detail(id: number): Promise<ApiResponse<Artist & { songs: Song[] }>> {
      return request(`/api/artists/${id}`);
    },
  },

  follow: {
    followArtist(artistId: number): Promise<ApiResponse<{ user_id: number; artist_id: number }>> {
      return request("/api/follow/artists", {
        method: "POST",
        body: JSON.stringify({ artist_id: artistId }),
      });
    },

    unfollowArtist(artistId: number): Promise<ApiResponse<{ removed: boolean }>> {
      return request(`/api/follow/artists/${artistId}`, {
        method: "DELETE",
      });
    },

    listFollowing(page?: number): Promise<ApiResponse<{ list: Artist[]; total: number }>> {
      return request(`/api/follow/artists?page=${page || 1}`);
    },

    count(): Promise<ApiResponse<{ count: number }>> {
      return request("/api/follow/artists/count");
    },

    status(artistId: number): Promise<ApiResponse<{ is_following: boolean }>> {
      return request(`/api/follow/artists/${artistId}/status`);
    },
  },
};