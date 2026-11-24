import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { api, CrawlSong } from "../api";
import { FullscreenPlayer } from "./FullscreenPlayer";
import type { Song } from "../types";

interface MusicPlayerProps {
  song: CrawlSong | null;
  playlist: CrawlSong[];
  currentIndex: number;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSelectSong: (index: number) => void;
  onClose: () => void;
  platform: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  visible?: boolean;
  onProgressChange?: (percent: number) => void;
}

function toPlayerSong(s: CrawlSong, platform: string): Song {
  return {
    id: String(s.id),
    title: s.title,
    artist: s.artist,
    source: platform === "Neteasemusic" ? "netease" : "local",
    cover: s.image_url ? (
      <img
        src={s.image_url}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
      />
    ) : (
      "🎵"
    ),
  };
}

function isLocalPlatform(platform: string) {
  return !platform || platform === "local";
}

export default function MusicPlayer({
  song,
  playlist,
  currentIndex: _currentIndex,
  onPlayNext,
  onPlayPrev,
  onSelectSong,
  onClose,
  platform,
  isPlaying,
  onPlayStateChange,
  visible = true,
  onProgressChange,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadTokenRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [playUrl, setPlayUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!song) return;

    const token = ++loadTokenRef.current;
    setPlayUrl("");
    setLoadError("");
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setCurrentLyricIndex(-1);
    setImageUrl(song.image_url);

    const loadSong = async () => {
      try {
        if (isLocalPlatform(platform)) {
          if (!/^\d+$/.test(String(song.id))) {
            throw new Error("本地歌曲 ID 无效");
          }
          if (token !== loadTokenRef.current) return;
          setPlayUrl(api.songs.getStreamUrl(parseInt(String(song.id), 10)));
          setLyrics([]);
          return;
        }

        const res = await api.crawl.getById(String(song.id), platform);
        if (token !== loadTokenRef.current) return;

        if (!res.data.play_url) {
          throw new Error("无法获取播放地址，请换一首歌曲");
        }

        setPlayUrl(api.crawl.proxyUrl(res.data.play_url));
        setLyrics(res.data.lyric ? parseLyrics(res.data.lyric) : []);
        if (res.data.image_url) {
          setImageUrl(res.data.image_url);
        }
      } catch (err) {
        if (token !== loadTokenRef.current) return;
        const message = err instanceof Error ? err.message : "加载歌曲失败";
        setLoadError(message);
        setPlayUrl("");
        onPlayStateChange(false);
      } finally {
        if (token === loadTokenRef.current) {
          setLoading(false);
        }
      }
    };

    loadSong();
  }, [song, platform, onPlayStateChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playUrl) return;

    audio.load();
    if (isPlaying) {
      audio.play().catch((e) => {
        console.error("播放失败:", e);
        onPlayStateChange(false);
      });
    }
  }, [playUrl, isPlaying, onPlayStateChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      onPlayStateChange(false);
      onPlayNext();
    };
    const handleError = () => {
      setLoadError("音频加载失败，请换一首或稍后重试");
      onPlayStateChange(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [onPlayNext, onPlayStateChange, playUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playUrl || loading || loadError) return;

    if (isPlaying) {
      audio.play().catch((e) => {
        console.error("播放失败:", e);
        onPlayStateChange(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, playUrl, loading, loadError, onPlayStateChange]);

  useEffect(() => {
    if (lyrics.length === 0) {
      setCurrentLyricIndex(-1);
      return;
    }
    const index = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return currentTime >= l.time && (!next || currentTime < next.time);
    });
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
    }
  }, [currentTime, lyrics, currentLyricIndex]);

  useEffect(() => {
    if (!onProgressChange) return;
    onProgressChange(duration > 0 ? (currentTime / duration) * 100 : 0);
  }, [currentTime, duration, onProgressChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, playUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playerSong = useMemo(() => {
    if (!song) return null;
    return toPlayerSong({ ...song, image_url: imageUrl ?? song.image_url }, platform);
  }, [song, platform, imageUrl]);

  const queueSongs = useMemo(
    () => playlist.map((item) => toPlayerSong(item, platform)),
    [playlist, platform]
  );

  const lyricLines = useMemo(() => lyrics.map((line) => line.text), [lyrics]);

  const handleSeekPercent = useCallback(
    (percent: number) => {
      if (!audioRef.current || duration <= 0) return;
      const time = (percent / 100) * duration;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    },
    [duration]
  );

  const handleVolumeChange = useCallback((value: number) => {
    const vol = value / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  if (!song || !playerSong) return null;

  return (
    <>
      <audio ref={audioRef} src={playUrl || undefined} preload="auto" crossOrigin="anonymous" />

      {visible && (
        <FullscreenPlayer
          song={playerSong}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          queue={queueSongs}
          lyrics={lyricLines}
          activeLyricLine={currentLyricIndex}
          loading={loading}
          loadError={loadError}
          volume={Math.round((isMuted ? 0 : volume) * 100)}
          muted={isMuted}
          onTogglePlay={() => {
            if (loading || loadError) return;
            onPlayStateChange(!isPlaying);
          }}
          onPrev={onPlayPrev}
          onNext={onPlayNext}
          onClose={onClose}
          onSeek={handleSeekPercent}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onSelectQueueItem={onSelectSong}
        />
      )}
    </>
  );
}

function parseLyrics(lyricText: string): { time: number; text: string }[] {
  const lines = lyricText.split("\n");
  const result: { time: number; text: string }[] = [];
  const timeRegex = /\[(\d{2}):(\d{2}\.?\d*)\](.*)/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({ time: minutes * 60 + seconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
