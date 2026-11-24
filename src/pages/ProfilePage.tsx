import { Play, User, UserPlus, UserCheck, Music, Clock, Heart, ListMusic, Star } from "lucide-react";
import type { Song, Artist, PlayRecord } from "../types";

const C = { color: "#8b5cf6", muted: "#9ca3af", border: "rgba(139,92,246,0.12)", text: "#1a1a2e" };

const STAT_CONFIGS = [
  { key: "plays", icon: <Clock size={18} color="#8b5cf6" />, label: "播放记录", bg: "#f5f3ff", color: "#8b5cf6" },
  { key: "favs", icon: <Heart size={18} color="#ef4444" />, label: "收藏歌曲", bg: "#fff0f0", color: "#ef4444" },
  { key: "playlists", icon: <ListMusic size={18} color="#0ea5e9" />, label: "我的歌单", bg: "#e0f2fe", color: "#0ea5e9" },
  { key: "artists", icon: <Star size={18} color="#f97316" />, label: "关注歌手", bg: "#fff7ed", color: "#f97316" },
];

export function ProfilePage({
  username,
  favorites,
  playlists,
  playHistory,
  discoverArtists,
  followedArtists,
  onPlay,
  onToggleFollow,
}: {
  username: string;
  favorites: Song[];
  playlists: { id: string }[];
  playHistory: PlayRecord[];
  discoverArtists: Artist[];
  followedArtists: Artist[];
  onPlay: (s: Song, q: Song[]) => void;
  onToggleFollow: (id: string) => void;
}) {
  const recentSongs = playHistory.slice(0, 10).map((r) => r.song);
  const stats = [playHistory.length, favorites.length, playlists.length, followedArtists.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
          }}
        >
          <User size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>
            个人中心
          </h1>
          <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>查看你的音乐数据与关注</p>
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
          borderRadius: "20px",
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(124,58,237,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            right: "60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", position: "relative" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff", margin: 0 }}>
              {username || "用户"}
            </h2>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.72rem",
                fontWeight: 600,
                marginTop: "4px",
              }}
            >
              普通用户
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", position: "relative" }}>
          {STAT_CONFIGS.map((s, i) => (
            <div
              key={s.key}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "14px",
                textAlign: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontFamily: "'Nunito',sans-serif", fontWeight: 800, color: "#fff" }}>{stats[i]}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
        {STAT_CONFIGS.map((s, i) => (
          <div
            key={s.key}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "14px",
              border: "1px solid rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.2rem", color: s.color }}>{stats[i]}</div>
              <div style={{ fontSize: "0.7rem", color: C.muted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(139,92,246,0.04)",
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
            background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Clock size={16} color="#8b5cf6" />
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: C.text, margin: 0 }}>
            最近播放
          </h2>
        </div>
        {playHistory.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: "24px 0", fontSize: "0.875rem" }}>暂无播放记录</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {playHistory.slice(0, 10).map((rec, i) => (
              <div
                key={rec.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "11px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    width: "20px",
                    fontSize: "0.75rem",
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
                    width: "36px",
                    height: "36px",
                    borderRadius: "9px",
                    background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Music size={15} color="#a78bfa" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: C.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rec.song.title}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: C.muted }}>{rec.song.artist}</p>
                </div>
                <span style={{ fontSize: "0.7rem", color: C.muted, flexShrink: 0, whiteSpace: "nowrap" }}>{rec.playedAt}</span>
                <button
                  onClick={() => onPlay(rec.song, recentSongs)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border: "none",
                    background: "#f5f3ff",
                    color: "#8b5cf6",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Play size={12} fill="#8b5cf6" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {[
          { title: "关注的歌手", icon: <UserCheck size={14} color="#f97316" />, list: followedArtists, isFollowed: true },
          { title: "发现歌手", icon: <Star size={14} color="#f97316" />, list: discoverArtists, isFollowed: false },
        ].map(({ title, icon, list, isFollowed }) => (
          <div
            key={title}
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(249,115,22,0.1)",
              boxShadow: "0 2px 12px rgba(249,115,22,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
              {icon}
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: C.text, margin: 0 }}>
                {title}
              </h2>
              <span style={{ fontSize: "0.72rem", color: C.muted, marginLeft: "auto" }}>{list.length} 位</span>
            </div>
            {list.length === 0 ? (
              <p style={{ color: C.muted, fontSize: "0.82rem", textAlign: "center", padding: "16px 0" }}>
                {isFollowed ? "暂未关注歌手" : "已关注所有推荐 🎉"}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {list.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: isFollowed ? "linear-gradient(135deg, #f97316, #fb923c)" : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={16} color={isFollowed ? "#fff" : "#9ca3af"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: C.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.name}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: C.muted }}>{a.songCount} 首歌曲</p>
                    </div>
                    <button
                      onClick={() => onToggleFollow(a.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "100px",
                        border: "none",
                        background: isFollowed ? "#fff7ed" : "#f5f3ff",
                        color: isFollowed ? "#f97316" : "#8b5cf6",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck size={11} />
                          已关注
                        </>
                      ) : (
                        <>
                          <UserPlus size={11} />
                          关注
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
