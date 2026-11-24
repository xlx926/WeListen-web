import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Volume2, VolumeX, ListMusic } from "lucide-react";
import type { Song } from "../types";

const C = { primary: "#7c3aed", primaryLight: "#a855f7", muted: "#9ca3af" };

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function FullscreenPlayer({
  song,
  isPlaying,
  progress,
  queue,
  onTogglePlay,
  onPrev,
  onNext,
  onClose,
  onSeek,
  currentTime,
  duration,
  lyrics = [],
  activeLyricLine = -1,
  loadError,
  loading,
  onSelectQueueItem,
  volume: volumeProp,
  muted: mutedProp,
  onVolumeChange,
  onToggleMute,
}: {
  song: Song;
  isPlaying: boolean;
  progress: number;
  queue: Song[];
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onSeek: (p: number) => void;
  currentTime?: number;
  duration?: number;
  lyrics?: string[];
  activeLyricLine?: number;
  loadError?: string;
  loading?: boolean;
  onSelectQueueItem?: (index: number) => void;
  volume?: number;
  muted?: boolean;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
}) {
  const [volumeLocal, setVolumeLocal] = useState(80);
  const [mutedLocal, setMutedLocal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const lyricRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const volume = volumeProp ?? volumeLocal;
  const muted = mutedProp ?? mutedLocal;
  const totalSecs = duration && duration > 0 ? duration : 0;
  const currentSecs = currentTime ?? (totalSecs > 0 ? (progress / 100) * totalSecs : 0);

  useEffect(() => {
    if (showQueue || activeLyricLine < 0) return;
    lyricRefs.current[activeLyricLine]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLyricLine, showQueue]);

  const handleVolume = (value: number) => {
    if (onVolumeChange) {
      onVolumeChange(value);
    } else {
      setVolumeLocal(value);
      setMutedLocal(value === 0);
    }
  };

  const handleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setMutedLocal((m) => !m);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "linear-gradient(145deg, #1a0533 0%, #0d0d1a 50%, #1a0d2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: C.primary,
          opacity: 0.15,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0%",
          right: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: C.primaryLight,
          opacity: 0.1,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "100px",
          padding: "8px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.85rem",
          backdropFilter: "blur(8px)",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
      >
        <ChevronDown size={16} />
        收起
      </button>

      <div
        style={{
          display: "flex",
          gap: "64px",
          alignItems: "center",
          width: "100%",
          maxWidth: "900px",
          padding: "0 40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: "240px", height: "240px" }}>
            <div
              className={isPlaying ? "animate-spin-vinyl" : undefined}
              style={{
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 50% 50%, #3a1a5e 0%, #1a0833 40%, #0d0620 100%)",
                border: "3px solid rgba(168,85,247,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(124,58,237,0.3)",
              }}
            >
              {[80, 100, 120, 140, 160].map((r) => (
                <div
                  key={r}
                  style={{
                    position: "absolute",
                    width: r,
                    height: r,
                    borderRadius: "50%",
                    border: "1px solid rgba(168,85,247,0.12)",
                  }}
                />
              ))}
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                  zIndex: 1,
                  overflow: "hidden",
                }}
              >
                {song.cover ?? "🎵"}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                color: "#fff",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: "1.6rem",
                marginBottom: "6px",
                marginTop: 0,
              }}
            >
              {song.title}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", margin: 0 }}>{song.artist}</p>
            <span
              style={{
                display: "inline-block",
                marginTop: "8px",
                padding: "3px 10px",
                borderRadius: "100px",
                background: "rgba(168,85,247,0.2)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.72rem",
              }}
            >
              {song.source === "netease" ? "数据来源于网易云音乐" : "本地曲库"}
            </span>
            {loading && (
              <p style={{ color: C.primaryLight, fontSize: "0.8rem", marginTop: "10px", marginBottom: 0 }}>加载中…</p>
            )}
            {loadError && (
              <p style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "10px", marginBottom: 0 }}>{loadError}</p>
            )}
          </div>

          <div style={{ width: "280px" }}>
            <div
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255,255,255,0.15)",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onSeek(((e.clientX - rect.left) / rect.width) * 100);
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: "2px",
                  background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
                  transition: "width 1s linear",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: "-6px",
                    top: "-4px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{formatTime(currentSecs)}</span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                {totalSecs > 0 ? formatTime(totalSecs) : "--:--"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={onPrev}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              <SkipBack size={26} />
            </button>
            <button
              onClick={onTogglePlay}
              disabled={loading || Boolean(loadError)}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "none",
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                cursor: loading || loadError ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(168,85,247,0.5)",
                transition: "opacity 0.2s",
                opacity: loading || loadError ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && !loadError) e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                if (!loading && !loadError) e.currentTarget.style.opacity = "1";
              }}
            >
              {isPlaying ? <Pause size={24} color="#fff" fill="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
            </button>
            <button
              onClick={onNext}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              <SkipForward size={26} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={handleMute}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              style={{ width: "80px", accentColor: C.primaryLight }}
            />
            <button
              onClick={() => setShowQueue((q) => !q)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: showQueue ? C.primaryLight : "rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.8rem",
              }}
            >
              <ListMusic size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, height: "380px", overflowY: "auto", position: "relative" }} className="scrollbar-hide">
          {showQueue ? (
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "12px" }}>
                播放队列 · {queue.length} 首
              </p>
              {queue.map((s, i) => (
                <div
                  key={`${s.id}-${i}`}
                  role={onSelectQueueItem ? "button" : undefined}
                  onClick={onSelectQueueItem ? () => onSelectQueueItem(i) : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    marginBottom: "4px",
                    background: s.id === song.id ? "rgba(168,85,247,0.2)" : "transparent",
                    cursor: onSelectQueueItem ? "pointer" : "default",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{s.cover ?? "🎵"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: s.id === song.id ? C.primaryLight : "rgba(255,255,255,0.8)",
                        fontSize: "0.875rem",
                        fontWeight: s.id === song.id ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {s.title}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: "2px 0 0" }}>{s.artist}</p>
                  </div>
                  {s.duration && (
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{s.duration}</span>
                  )}
                </div>
              ))}
            </div>
          ) : lyrics.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px 0" }}>
              {lyrics.map((line, i) => (
                <p
                  key={`${i}-${line}`}
                  ref={(el) => {
                    lyricRefs.current[i] = el;
                  }}
                  style={{
                    textAlign: "center",
                    fontSize: i === activeLyricLine ? "1.05rem" : "0.9rem",
                    fontWeight: i === activeLyricLine ? 600 : 400,
                    color: i === activeLyricLine ? "#fff" : "rgba(255,255,255,0.3)",
                    transition: "all 0.4s",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {line || "·"}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>暂无歌词</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
