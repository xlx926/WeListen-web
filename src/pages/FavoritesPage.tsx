import { Play, HeartOff, Heart, Search, Music } from "lucide-react";
import type { Song } from "../types";

const C = { color: "#ef4444", muted: "#9ca3af", border: "rgba(239,68,68,0.12)", text: "#1a1a2e" };

export function FavoritesPage({
  favorites,
  onPlay,
  onRemoveFavorite,
  onNavigateSearch,
}: {
  favorites: Song[];
  onPlay: (s: Song, q: Song[]) => void;
  onRemoveFavorite: (s: Song) => void;
  onNavigateSearch: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ef4444, #f87171)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
            }}
          >
            <Heart size={22} color="#fff" fill="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>
              我的收藏
            </h1>
            <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>{favorites.length} 首收藏歌曲</p>
          </div>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={() => onPlay(favorites[0], favorites)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "100px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #f87171)",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
            }}
          >
            <Play size={14} fill="#fff" /> 全部播放
          </button>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(239,68,68,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #ef4444, #f87171, #fca5a5)",
          }}
        />

        {favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fff0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Heart size={28} color="#fca5a5" />
            </div>
            <p style={{ color: C.muted, fontSize: "0.9rem", marginBottom: "16px" }}>还没有收藏任何歌曲</p>
            <button
              onClick={onNavigateSearch}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 22px",
                borderRadius: "100px",
                border: "none",
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                color: "#fff",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <Search size={14} /> 去搜索歌曲
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {favorites.map((song, i) => (
              <div
                key={song.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  border: "1px solid rgba(239,68,68,0.08)",
                  background: "#fff",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff8f8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <span
                  style={{
                    width: "22px",
                    fontSize: "0.78rem",
                    color: "#d1d5db",
                    textAlign: "center",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "11px",
                    background: "linear-gradient(135deg, #fff0f0, #fce7eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Music size={17} color="#f87171" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: C.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.title}
                  </p>
                  <p style={{ fontSize: "0.77rem", color: C.muted }}>{song.artist}</p>
                </div>
                {song.duration && (
                  <span style={{ fontSize: "0.77rem", color: C.muted, flexShrink: 0 }}>{song.duration}</span>
                )}
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  <button
                    onClick={() => onPlay(song, favorites)}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#fff0f0",
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={13} fill="#ef4444" />
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(song)}
                    title="取消收藏"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#f9fafb",
                      color: C.muted,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.color = C.muted;
                    }}
                  >
                    <HeartOff size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
