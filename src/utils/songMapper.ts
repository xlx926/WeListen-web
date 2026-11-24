import type { CrawlSong, Playlist as ApiPlaylist, PlaylistSongItem, AiRecommendation, RankingItem, Song as ApiSong, Artist as ApiArtist, PlayHistoryItem } from "../api";
import type { Song, Playlist, UploadedSong, PlayRecord, Artist } from "../types";

function formatDuration(seconds?: number): string | undefined {
  if (seconds == null || seconds <= 0) return undefined;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function rankingToUiSong(item: RankingItem): Song {
  return {
    id: item.external_id || String(item.song_id ?? ""),
    title: item.title,
    artist: item.artist,
    duration: formatDuration(item.duration_seconds),
    source: item.platform === "Neteasemusic" || item.external_id ? "netease" : "local",
    playCount: item.period_play_count,
  };
}

export function crawlToUiSong(song: CrawlSong): Song {
  return {
    id: String(song.id),
    title: song.title,
    artist: song.artist,
    source: "netease",
  };
}

export function uiToCrawlSong(song: Song): CrawlSong {
  return {
    id: String(song.id),
    title: song.title,
    artist: song.artist,
  };
}

function formatUploadDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("zh-CN");
}

export function apiUploadToUi(song: ApiSong): UploadedSong {
  return {
    id: String(song.id),
    title: song.title,
    artist: song.artist,
    status: song.status,
    uploadedAt: formatUploadDate(song.created_at || song.published_at),
  };
}

export function uploadToUiSong(upload: UploadedSong): Song {
  return {
    id: upload.id,
    title: upload.title,
    artist: upload.artist,
    source: "local",
  };
}

export function apiSongToUi(song: ApiSong): Song {
  return {
    id: String(song.id),
    title: song.title,
    artist: song.artist,
    duration: formatDuration(song.duration_seconds),
    source: "local",
  };
}

export function apiPlaylistToUi(playlist: ApiPlaylist, songs: Song[] = []): Playlist {
  return {
    id: String(playlist.id),
    name: playlist.name,
    description: playlist.description || undefined,
    songCount: songs.length || playlist.song_count || 0,
    songs,
  };
}

export function apiPlaylistSongToUi(item: PlaylistSongItem): Song {
  if (item.source === "external" || item.external_id) {
    return {
      id: String(item.external_id || item.id || ""),
      title: item.title,
      artist: item.artist,
      source: "netease",
    };
  }
  return apiSongToUi({
    id: item.id!,
    title: item.title,
    artist: item.artist,
    duration_seconds: item.duration_seconds || 0,
    status: "online",
    play_count: item.play_count || 0,
    published_at: item.added_at || "",
    created_at: item.added_at || "",
    updated_at: item.added_at || "",
  });
}

export function apiPlaylistDetailToUi(playlist: ApiPlaylist, songs: PlaylistSongItem[]): Playlist {
  return apiPlaylistToUi(playlist, songs.map(apiPlaylistSongToUi));
}

export function aiRecommendationToUi(item: AiRecommendation): Song {
  return {
    id: item.song?.id ? String(item.song.id) : `${item.title}-${item.artist}`,
    title: item.song?.title || item.title,
    artist: item.song?.artist || item.artist,
    reason: item.reason,
    matched: item.matched,
    source: item.matched ? "netease" : undefined,
  };
}

function formatPlayTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function playHistoryToUi(item: PlayHistoryItem): PlayRecord {
  const isExternal = item.source === "external";
  const songId = isExternal ? item.external_id || String(item.song_id) : String(item.song_id);
  return {
    id: String(item.event_id ?? `${item.song_id}-${item.played_at}`),
    song: {
      id: songId,
      title: item.title,
      artist: item.artist,
      source: isExternal ? "netease" : "local",
    },
    playedAt: formatPlayTime(item.played_at),
  };
}

export function apiArtistToUi(artist: ApiArtist, followed: boolean): Artist {
  return {
    id: String(artist.id),
    name: artist.name,
    songCount: artist.song_count || 0,
    followed,
  };
}
