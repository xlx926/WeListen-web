import { useState, useEffect, useMemo } from "react";
import { api, CrawlSong, Artist as ApiArtist, PlayHistoryItem, Song as ApiSong } from "./api";
import MusicPlayer from "./components/MusicPlayer";
import { MiniPlayer } from "./components/MiniPlayer";
import { TopNav } from "./components/TopNav";
import { SearchPage } from "./pages/SearchPage";
import { ChartsPage } from "./pages/ChartsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { UploadPage } from "./pages/UploadPage";
import { ProfilePage } from "./pages/ProfilePage";
import {
  apiArtistToUi,
  apiPlaylistDetailToUi,
  apiPlaylistToUi,
  apiUploadToUi,
  crawlToUiSong,
  playHistoryToUi,
  uiToCrawlSong,
  uploadToUiSong,
} from "./utils/songMapper";
import type { Song as UiSong, Playlist as UiPlaylist, UploadedSong, NavPage } from "./types";

const CRAWL_PLATFORM = "Neteasemusic";

export default function App() {
  const [username, setUsername] = useState("用户");
  const [activePage, setActivePage] = useState<NavPage>("search");

  const [playSource, setPlaySource] = useState(CRAWL_PLATFORM);
  const [playlist, setPlaylist] = useState<CrawlSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [favorites, setFavorites] = useState<CrawlSong[]>([]);
  const [playlistsUi, setPlaylistsUi] = useState<UiPlaylist[]>([]);
  const [uploadsUi, setUploadsUi] = useState<UploadedSong[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([]);
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [followingArtists, setFollowingArtists] = useState<ApiArtist[]>([]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      window.location.reload();
    } catch {
      alert("退出失败");
    }
  };

  const handleSearchPlay = (song: UiSong, queue: UiSong[]) => {
    const crawlQueue = queue.map(uiToCrawlSong);
    const crawlSong = uiToCrawlSong(song);
    const index = crawlQueue.findIndex((item) => item.id === crawlSong.id);
    setPlaylist(crawlQueue);
    setCurrentIndex(index >= 0 ? index : 0);
    setPlaySource(CRAWL_PLATFORM);
    setPlayerVisible(true);
    setIsPlaying(true);
  };

  const handleChartsPlay = (song: UiSong, queue: UiSong[]) => {
    const crawlQueue = queue.map(uiToCrawlSong);
    const crawlSong = uiToCrawlSong(song);
    const index = crawlQueue.findIndex((item) => item.id === crawlSong.id);
    setPlaylist(crawlQueue);
    setCurrentIndex(index >= 0 ? index : 0);
    setPlaySource(CRAWL_PLATFORM);
    setPlayerVisible(true);
    setIsPlaying(true);
  };

  const handleLocalQueuePlay = (song: UiSong, queue: UiSong[]) => {
    const crawlQueue = queue.map(uiToCrawlSong);
    const crawlSong = uiToCrawlSong(song);
    const index = crawlQueue.findIndex((item) => item.id === crawlSong.id);
    setPlaylist(crawlQueue);
    setCurrentIndex(index >= 0 ? index : 0);
    setPlaySource("local");
    setPlayerVisible(true);
    setIsPlaying(true);

    const songId = parseInt(crawlSong.id, 10);
    if (!isNaN(songId)) {
      api.playHistory.recordPlay(songId).catch((err: unknown) => {
        console.warn("记录播放事件失败:", err);
      });
    }
  };

  const handleSmartPlay = (song: UiSong, queue: UiSong[]) => {
    if (song.source === "local") {
      handleLocalQueuePlay(song, queue);
    } else {
      handleSearchPlay(song, queue);
    }
  };

  const handleAddSongToPlaylist = async (playlistId: string, song: UiSong, silent = false) => {
    try {
      const isLocal = song.source === "local" && /^\d+$/.test(song.id);
      if (isLocal) {
        await api.playlists.addSong(parseInt(playlistId, 10), { song_id: parseInt(song.id, 10) });
      } else {
        await api.playlists.addSong(parseInt(playlistId, 10), {
          external_id: song.id,
          title: song.title,
          artist: song.artist,
          platform: "Neteasemusic",
        });
      }
      if (!silent) alert("已添加到歌单");
      await loadPlaylists(true);
    } catch (err) {
      alert("添加失败: " + (err instanceof Error ? err.message : err));
      throw err;
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId: string, song: UiSong) => {
    try {
      if (song.source === "netease") {
        await api.playlists.removeExternalSong(parseInt(playlistId, 10), song.id, "Neteasemusic");
      } else {
        await api.playlists.removeSong(parseInt(playlistId, 10), parseInt(song.id, 10));
      }
      await loadPlaylists(true);
    } catch (err) {
      alert("移除失败: " + (err instanceof Error ? err.message : err));
      throw err;
    }
  };

  const handlePlayNext = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const handlePlayPrev = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleSelectSong = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const toggleFavorite = (song: CrawlSong) => {
    const exists = favorites.find((f) => f.id === song.id);
    if (exists) {
      setFavorites(favorites.filter((f) => f.id !== song.id));
    } else {
      setFavorites([...favorites, song]);
    }
  };

  const toggleFavoriteFromUi = (song: UiSong) => {
    toggleFavorite(uiToCrawlSong(song));
  };

  const loadPlaylists = async (full = false) => {
    try {
      const res = await api.playlists.list();
      const list = res.data || [];
      if (!full) {
        setPlaylistsUi(list.map((pl) => apiPlaylistToUi(pl)));
        return;
      }
      const enriched = await Promise.all(
        list.map(async (pl) => {
          try {
            const detail = await api.playlists.get(pl.id);
            const payload = detail.data;
            const songs = payload.songs || [];
            return apiPlaylistDetailToUi(payload, songs);
          } catch {
            return apiPlaylistToUi(pl);
          }
        })
      );
      setPlaylistsUi(enriched);
    } catch (err) {
      console.error("加载歌单失败:", err);
    }
  };

  const handleCreatePlaylistUi = async (name: string, desc: string) => {
    try {
      const res = await api.playlists.create(name.trim(), desc.trim());
      const created = apiPlaylistToUi(res.data);
      setPlaylistsUi((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [created, ...prev];
      });
      await loadPlaylists(activePage === "playlist");
    } catch (err) {
      alert("创建歌单失败: " + (err instanceof Error ? err.message : err));
    }
  };

  const handleDeletePlaylistUi = async (id: string) => {
    if (!confirm("确定要删除这个歌单吗？")) return;
    try {
      await api.playlists.delete(parseInt(id, 10));
      await loadPlaylists(activePage === "playlist");
    } catch (err) {
      alert("删除失败: " + (err instanceof Error ? err.message : err));
    }
  };

  const loadMyUploads = async () => {
    try {
      const res = await api.songs.myUploads();
      setUploadsUi((res.data?.list || []).map(apiUploadToUi));
    } catch (err) {
      console.error("加载上传列表失败:", err);
    }
  };

  const handleUploaded = async (created?: ApiSong) => {
    if (created) {
      const item = apiUploadToUi(created);
      setUploadsUi((prev) => (prev.some((u) => u.id === item.id) ? prev : [item, ...prev]));
    }
    await loadMyUploads();
  };

  const handleToggleUploadStatus = async (id: string) => {
    const item = uploadsUi.find((u) => u.id === id);
    if (!item || item.status !== "online") return;
    if (!confirm("确定要下架这首歌曲吗？")) return;
    try {
      await api.songs.offline(parseInt(id, 10));
      setUploadsUi((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "offline" as const } : u))
      );
      await loadMyUploads();
    } catch (err) {
      alert("下架失败: " + (err instanceof Error ? err.message : err));
    }
  };

  const handleUploadPlay = (upload: UploadedSong) => {
    if (upload.status !== "online") return;
    const song = uploadToUiSong(upload);
    const queue = uploadsUi.filter((u) => u.status === "online").map(uploadToUiSong);
    handleLocalQueuePlay(song, queue);
  };

  const loadPlayHistory = async () => {
    try {
      const res = await api.playHistory.all();
      setPlayHistory(res.data.list || []);
    } catch (err) {
      console.error("加载播放记录失败:", err);
    }
  };

  const loadArtists = async () => {
    try {
      const res = await api.artists.list();
      setArtists(res.data?.list || []);
    } catch (err) {
      console.error("加载艺术家列表失败:", err);
    }
  };

  const loadFollowingArtists = async () => {
    try {
      const res = await api.follow.listFollowing();
      setFollowingArtists(res.data?.list || []);
    } catch (err) {
      console.error("加载关注列表失败:", err);
    }
  };

  const handleToggleFollowUi = async (id: string) => {
    const artist =
      artists.find((a) => String(a.id) === id) ?? followingArtists.find((a) => String(a.id) === id);
    if (!artist) return;

    const isFollowing = followingArtists.some((a) => a.id === artist.id);
    if (isFollowing) {
      setFollowingArtists((prev) => prev.filter((a) => a.id !== artist.id));
    } else {
      setFollowingArtists((prev) => [artist, ...prev]);
    }

    try {
      if (isFollowing) {
        await api.follow.unfollowArtist(artist.id);
      } else {
        await api.follow.followArtist(artist.id);
      }
    } catch (err) {
      if (isFollowing) {
        setFollowingArtists((prev) => [artist, ...prev]);
      } else {
        setFollowingArtists((prev) => prev.filter((a) => a.id !== artist.id));
      }
      alert("操作失败: " + (err instanceof Error ? err.message : err));
    }
  };

  const playHistoryUi = useMemo(() => playHistory.map(playHistoryToUi), [playHistory]);

  const followedArtistsUi = useMemo(
    () => followingArtists.map((a) => apiArtistToUi(a, true)),
    [followingArtists]
  );

  const discoverArtistsUi = useMemo(() => {
    const followingIds = new Set(followingArtists.map((a) => a.id));
    return artists.filter((a) => !followingIds.has(a.id)).map((a) => apiArtistToUi(a, false));
  }, [artists, followingArtists]);

  const favoritesUi = useMemo(() => favorites.map(crawlToUiSong), [favorites]);

  useEffect(() => {
    api.auth
      .me()
      .then((res) => setUsername(res.data.username))
      .catch(() => setUsername("用户"));
  }, []);

  useEffect(() => {
    if (activePage === "search") {
      loadPlaylists(false);
    } else if (activePage === "playlist") {
      loadPlaylists(true);
    }
    if (activePage === "upload") {
      loadMyUploads();
    }
    if (activePage === "profile") {
      loadPlayHistory();
      loadFollowingArtists();
      loadArtists();
      loadPlaylists(false);
    }
  }, [activePage]);

  const currentSong = playlist.length > 0 ? playlist[currentIndex] : null;

  const miniPlayerSong = useMemo((): UiSong | null => {
    if (!currentSong) return null;
    return {
      ...crawlToUiSong(currentSong),
      source: playSource === CRAWL_PLATFORM ? "netease" : "local",
      cover: currentSong.image_url ? (
        <img
          src={currentSong.image_url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        "🎵"
      ),
    };
  }, [currentSong, playSource]);

  const showMiniPlayer = Boolean(currentSong && !playerVisible);

  const pages: Record<NavPage, React.ReactNode> = {
    search: (
      <SearchPage
        onPlay={handleSearchPlay}
        favorites={favoritesUi}
        onFavorite={toggleFavoriteFromUi}
        playlists={playlistsUi}
        onAddToPlaylist={handleAddSongToPlaylist}
      />
    ),
    charts: (
      <ChartsPage
        onPlay={handleChartsPlay}
        favorites={favoritesUi}
        onFavorite={toggleFavoriteFromUi}
      />
    ),
    favorites: (
      <FavoritesPage
        favorites={favoritesUi}
        onPlay={handleSearchPlay}
        onRemoveFavorite={toggleFavoriteFromUi}
        onNavigateSearch={() => setActivePage("search")}
      />
    ),
    playlist: (
      <PlaylistPage
        playlists={playlistsUi}
        onPlay={handleSmartPlay}
        onDelete={handleDeletePlaylistUi}
        onCreate={handleCreatePlaylistUi}
        onAddSong={(pid, song) => handleAddSongToPlaylist(pid, song, true)}
        onRemoveSong={handleRemoveSongFromPlaylist}
      />
    ),
    upload: (
      <UploadPage
        uploads={uploadsUi}
        onToggleStatus={handleToggleUploadStatus}
        onUploaded={handleUploaded}
        onPlay={handleUploadPlay}
      />
    ),
    profile: (
      <ProfilePage
        username={username}
        favorites={favoritesUi}
        playlists={playlistsUi}
        playHistory={playHistoryUi}
        discoverArtists={discoverArtistsUi}
        followedArtists={followedArtistsUi}
        onPlay={handleSmartPlay}
        onToggleFollow={handleToggleFollowUi}
      />
    ),
  };

  return (
    <>
      {currentSong && (
        <MusicPlayer
          song={currentSong}
          playlist={playlist}
          currentIndex={currentIndex}
          onPlayNext={handlePlayNext}
          onPlayPrev={handlePlayPrev}
          onSelectSong={handleSelectSong}
          onClose={() => setPlayerVisible(false)}
          platform={playSource}
          isPlaying={isPlaying}
          onPlayStateChange={setIsPlaying}
          visible={playerVisible}
          onProgressChange={setPlayProgress}
        />
      )}

      <TopNav activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} username={username} />

      <main
        style={{
          paddingTop: "64px",
          paddingBottom: showMiniPlayer ? "72px" : "0",
          minHeight: "100vh",
          background: "#f8f7ff",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 20px" }}>{pages[activePage]}</div>
      </main>

      {showMiniPlayer && (
        <MiniPlayer
          song={miniPlayerSong}
          isPlaying={isPlaying}
          progress={playProgress}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onPrev={handlePlayPrev}
          onNext={handlePlayNext}
          onOpenFull={() => setPlayerVisible(true)}
        />
      )}
    </>
  );
}
