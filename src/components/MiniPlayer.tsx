import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music } from "lucide-react";
import type { Song } from "../types";

const C = { primary: "#7c3aed", primaryLight: "#a855f7", muted: "#9ca3af", border: "rgba(124,58,237,0.1)" };

export function MiniPlayer({
  song,
  isPlaying,
  progress,
  onTogglePlay,
  onPrev,
  onNext,
  onOpenFull,
}: {
  song: Song | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenFull: () => void;
}) {
  if (!song) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "72px",
        zIndex: 90,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
        boxShadow: "0 -4px 20px rgba(124,58,237,0.08)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(124,58,237,0.1)" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
            transition: "width 1s linear",
          }}
        />
      </div>

      <button
        onClick={onOpenFull}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: 1,
          minWidth: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #f5f0ff, #fce7f8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {song.cover ?? <Music size={18} color={C.primary} />}
        </div>
        <div style={{ minWidth: 0, textAlign: "left" }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#1a1a2e",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {song.title}
          </p>
          <p style={{ fontSize: "0.78rem", color: C.muted, marginTop: "1px" }}>{song.artist}</p>
        </div>
        <ChevronUp size={14} color={C.muted} style={{ flexShrink: 0 }} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={onPrev}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.muted,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={onTogglePlay}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isPlaying ? <Pause size={16} color="#fff" fill="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
        </button>
        <button
          onClick={onNext}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.muted,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
}
