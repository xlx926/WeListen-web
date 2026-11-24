import { useCallback, useEffect, useState } from "react";
import { Play, Heart, TrendingUp, Flame, Calendar, BarChart2, Loader } from "lucide-react";
import type { Song } from "../types";
import { api } from "../api";
import { rankingToUiSong } from "../utils/songMapper";

const C = { primary: "#f97316", muted: "#9ca3af", border: "rgba(249,115,22,0.12)", text: "#1a1a2e" };
const MEDAL = [
  { bg: "linear-gradient(135deg,#f59e0b,#fbbf24)", shadow: "0 4px 12px rgba(245,158,11,0.35)" },
  { bg: "linear-gradient(135deg,#6b7280,#9ca3af)", shadow: "0 4px 12px rgba(107,114,128,0.3)" },
  { bg: "linear-gradient(135deg,#b45309,#d97706)", shadow: "0 4px 12px rgba(180,83,9,0.3)" },
];

type Range = "week" | "month" | "custom";

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function ChartsPage({
  onPlay,
  favorites,
  onFavorite,
}: {
  onPlay: (s: Song, q: Song[]) => void;
  favorites: Song[];
  onFavorite: (s: Song) => void;
}) {
  const defaults = defaultDateRange();
  const [range, setRange] = useState<Range>("week");
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFav = (s: Song) => favorites.some((f) => f.id === s.id);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (range === "week") {
        res = await api.rankings.weekly();
      } else if (range === "month") {
        res = await api.rankings.monthly();
      } else {
        if (!start || !end) {
          setError("请选择开始和结束日期");
          setSongs([]);
          return;
        }
        res = await api.rankings.weekly(start, end);
      }

      const list = (res.data || []).map(rankingToUiSong);
      setSongs(list);
      if (list.length === 0) {
        setError("暂无排行数据，请先在搜索页播放网易云歌曲");
      }
    } catch (err) {
      setSongs([]);
      setError(err instanceof Error ? err.message : "获取排行榜失败");
    } finally {
      setLoading(false);
    }
  }, [range, start, end]);

  useEffect(() => {
    if (range !== "custom") {
      loadRankings();
    }
  }, [range, loadRankings]);

  const TABS: { id: Range; label: string; icon: React.ReactNode }[] = [
    { id: "week", label: "周榜", icon: <Flame size={14} color={range === "week" ? "#fff" : "#f97316"} /> },
    { id: "month", label: "月榜", icon: <BarChart2 size={14} color={range === "month" ? "#fff" : "#f97316"} /> },
    { id: "custom", label: "自定义", icon: <Calendar size={14} color={range === "custom" ? "#fff" : "#f97316"} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #f97316, #fb923c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
          }}
        >
          <TrendingUp size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>
            排行榜
          </h1>
          <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>
            基于网易云歌曲平台播放量，近 7 天 / 30 天动态更新
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(249,115,22,0.05)",
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
            background: "linear-gradient(90deg, #f97316, #fb923c, #fbbf24)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "100px",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all 0.18s",
                background: range === t.id ? "linear-gradient(135deg, #f97316, #fb923c)" : "rgba(249,115,22,0.08)",
                color: range === t.id ? "#fff" : "#f97316",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          {range === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(249,115,22,0.2)",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "0.82rem",
                  color: C.text,
                }}
              />
              <span style={{ color: C.muted, fontSize: "0.82rem" }}>至</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(249,115,22,0.2)",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "0.82rem",
                  color: C.text,
                }}
              />
              <button
                type="button"
                onClick={loadRankings}
                disabled={loading}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#f97316",
                  color: "#fff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                查询
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "0.875rem", padding: "16px 0" }}>
            <Loader size={15} className="animate-spin-slow" style={{ animationDuration: "1s" }} />
            加载中…
          </div>
        )}

        {!loading && error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", padding: "12px 0", textAlign: "center" }}>{error}</p>
        )}

        {!loading && !error && range === "custom" && songs.length === 0 && (
          <p style={{ color: C.muted, fontSize: "0.875rem", padding: "20px 0", textAlign: "center" }}>
            选择日期范围后点击「查询」
          </p>
        )}

        {!loading && songs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {songs.map((song, i) => {
              const top3 = i < 3;
              return (
                <div
                  key={song.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    border: `1px solid ${top3 ? "rgba(249,115,22,0.18)" : "rgba(0,0,0,0.05)"}`,
                    background: top3 ? "linear-gradient(135deg, #fff7ed, #fff)" : "#fff",
                    transition: "box-shadow 0.18s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(249,115,22,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  {top3 ? (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: MEDAL[i].bg,
                        boxShadow: MEDAL[i].shadow,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#fff" }}>{i + 1}</span>
                    </div>
                  ) : (
                    <span style={{ width: "28px", textAlign: "center", fontWeight: 700, fontSize: "0.85rem", color: "#d1d5db", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                  )}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "11px",
                      background: top3 ? "linear-gradient(135deg, #fff7ed, #fed7aa)" : "#f9fafb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={17} color={top3 ? "#f97316" : "#d1d5db"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: top3 ? 700 : 600,
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
                  {song.playCount != null && (
                    <span style={{ fontSize: "0.77rem", color: "#f97316", fontWeight: 600, flexShrink: 0 }}>
                      {song.playCount} 次
                    </span>
                  )}
                  {song.duration && (
                    <span style={{ fontSize: "0.77rem", color: C.muted, flexShrink: 0 }}>{song.duration}</span>
                  )}
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                    <button
                      onClick={() => onPlay(song, songs)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        border: "none",
                        background: "rgba(249,115,22,0.1)",
                        color: "#f97316",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={13} fill="#f97316" />
                    </button>
                    <button
                      onClick={() => onFavorite(song)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        border: "none",
                        background: isFav(song) ? "#fff0f0" : "#f9fafb",
                        color: isFav(song) ? "#ef4444" : C.muted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Heart size={13} fill={isFav(song) ? "#ef4444" : "none"} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
