import { useState } from "react";
import { Search, Play, Heart, Plus, Sparkles, Loader, Music, Radio, Mic } from "lucide-react";
import type { Song, Playlist } from "../types";
import { api } from "../api";
import { aiRecommendationToUi, crawlToUiSong } from "../utils/songMapper";

const CRAWL_PLATFORM = "Neteasemusic";

const C = {
  primary: "#7c3aed",
  light: "#a855f7",
  pale: "#f5f0ff",
  muted: "#9ca3af",
  border: "rgba(124,58,237,0.1)",
  text: "#1a1a2e",
};

type AiResult = {
  summary: string;
  songs: Song[];
};

function IconChip({ icon, label, color, bg }: { icon: React.ReactNode; label: string; color: string; bg: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "100px", background: bg, color }}>
      {icon}
      <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SongRow({
  song,
  onPlay,
  onFavorite,
  onAdd,
  faved,
}: {
  song: Song;
  onPlay: () => void;
  onFavorite: () => void;
  onAdd: () => void;
  faved: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "14px",
        border: `1px solid ${hov ? "rgba(124,58,237,0.2)" : C.border}`,
        background: hov ? "#fdfbff" : "#fff",
        transition: "all 0.18s",
        cursor: "default",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "11px",
          background: "linear-gradient(135deg, #f5f0ff, #fce7f8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Music size={18} color={C.primary} />
        {hov && (
          <button
            onClick={onPlay}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "11px",
              border: "none",
              background: "rgba(124,58,237,0.85)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={15} color="#fff" fill="#fff" />
          </button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {song.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
          <Mic size={11} color={C.muted} />
          <p style={{ fontSize: "0.77rem", color: C.muted }}>{song.artist}</p>
        </div>
      </div>
      {song.duration && (
        <span style={{ fontSize: "0.77rem", color: C.muted, flexShrink: 0 }}>{song.duration}</span>
      )}
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
        <ActionBtn icon={<Play size={13} fill="#7c3aed" />} color="#7c3aed" bg="#f0ebff" onClick={onPlay} title="播放" />
        <ActionBtn icon={<Plus size={13} />} color="#0ea5e9" bg="#e0f2fe" onClick={onAdd} title="加入歌单" />
        <ActionBtn
          icon={<Heart size={13} fill={faved ? "#ef4444" : "none"} />}
          color={faved ? "#ef4444" : C.muted}
          bg={faved ? "#fff0f0" : "#f9fafb"}
          onClick={onFavorite}
          title="收藏"
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  color,
  bg,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  color: string;
  bg: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        color,
        transition: "filter 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.93)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
    >
      {icon}
    </button>
  );
}

function ListMusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AddToPlaylistModal({
  song,
  playlists,
  onClose,
  onAdd,
}: {
  song: Song;
  playlists: Playlist[];
  onClose: () => void;
  onAdd: (pid: string, s: Song) => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "20px", padding: "24px", width: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.05rem", color: C.text, marginBottom: "6px" }}>加入歌单</h3>
        <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: "14px" }}>将「{song.title}」加入哪个歌单？</p>
        {playlists.length === 0 ? (
          <p style={{ textAlign: "center", color: C.muted, padding: "20px 0", fontSize: "0.875rem" }}>暂无歌单，请先创建</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAdd(p.id, song);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.pale)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ListMusicIcon />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: C.text }}>{p.name}</p>
                  <p style={{ fontSize: "0.72rem", color: C.muted }}>{p.songCount} 首</p>
                </div>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "9px",
            borderRadius: "10px",
            border: "none",
            background: "#f3f4f6",
            color: C.muted,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.875rem",
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}

export function SearchPage({
  onPlay,
  favorites,
  onFavorite,
  playlists,
  onAddToPlaylist,
}: {
  onPlay: (s: Song, queue: Song[]) => void;
  favorites: Song[];
  onFavorite: (s: Song) => void;
  playlists: Playlist[];
  onAddToPlaylist: (pid: string, s: Song) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [addModal, setAddModal] = useState<Song | null>(null);

  const isFav = (s: Song) => favorites.some((f) => f.id === s.id);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchError("");
    setAiResult(null);
    try {
      const res = await api.crawl.search(keyword.trim(), CRAWL_PLATFORM, 1);
      const list = (res.data.songList || []).map(crawlToUiSong);
      setResults(list);
      if (list.length === 0) {
        setSearchError("未找到相关歌曲，建议尝试「歌手 + 歌名」，如：周杰伦 晴天");
      }
    } catch (err) {
      setResults([]);
      setSearchError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  };

  const loadAiResult = async (loader: () => Promise<AiResult>) => {
    setAiLoading(true);
    setAiError("");
    try {
      setAiResult(await loader());
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 推荐失败");
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiGuess = () => {
    loadAiResult(async () => {
      const res = await api.recommend.guess(CRAWL_PLATFORM, 8);
      return {
        summary: res.data.summary,
        songs: res.data.recommendations.map(aiRecommendationToUi),
      };
    });
  };

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    loadAiResult(async () => {
      const res = await api.recommend.prompt(aiPrompt.trim(), CRAWL_PLATFORM, 8);
      return {
        summary: res.data.summary,
        songs: res.data.recommendations.map(aiRecommendationToUi),
      };
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
          }}
        >
          <Search size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>搜索歌曲</h1>
          <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>搜索网易云音乐全网歌曲</p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(124,58,237,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#f0ebff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Radio size={15} color="#7c3aed" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: C.text, margin: 0 }}>网易云搜索</h2>
            <p style={{ fontSize: "0.7rem", color: "#c4b5d0", margin: "2px 0 0" }}>搜索数据来源于网易云音乐 · 建议「歌手 + 歌名」</p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入歌曲名或歌手名…"
              style={{
                width: "100%",
                padding: "11px 16px 11px 42px",
                borderRadius: "12px",
                border: `1.5px solid ${C.border}`,
                background: "#faf9ff",
                color: C.text,
                fontSize: "0.875rem",
                fontFamily: "'DM Sans',sans-serif",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
            <Search size={14} color={C.muted} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            style={{
              padding: "11px 22px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              opacity: loading || !keyword.trim() ? 0.7 : 1,
            }}
          >
            搜索
          </button>
        </form>

        <div style={{ marginTop: "14px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "0.875rem", padding: "16px 0" }}>
              <Loader size={15} className="animate-spin-slow" style={{ animationDuration: "1s" }} />
              搜索中…
            </div>
          )}
          {searchError && (
            <p style={{ color: "#dc2626", fontSize: "0.875rem", padding: "12px 0" }}>{searchError}</p>
          )}
          {!loading && searched && results.length === 0 && !searchError && (
            <p style={{ color: C.muted, textAlign: "center", padding: "20px 0", fontSize: "0.875rem" }}>未找到相关歌曲</p>
          )}
          {!loading && results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <IconChip icon={<Music size={11} />} label={`${results.length} 首结果`} color="#7c3aed" bg="#f0ebff" />
              </div>
              {results.map((s) => (
                <SongRow
                  key={s.id}
                  song={s}
                  onPlay={() => onPlay(s, results)}
                  onFavorite={() => onFavorite(s)}
                  onAdd={() => setAddModal(s)}
                  faved={isFav(s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(124,58,237,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #f0abcb, #a855f7, #7c3aed)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #fce7f8, #f5f0ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={15} color="#a855f7" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: C.text, margin: 0 }}>AI 智能推荐</h2>
              <span style={{ padding: "2px 7px", borderRadius: "100px", background: "linear-gradient(135deg,#a855f7,#f0abcb)", color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>
                DeepSeek
              </span>
            </div>
            <p style={{ fontSize: "0.7rem", color: C.muted, margin: "2px 0 0" }}>
              「猜你喜欢」基于热榜秒开；输入描述后 AI 推荐，超时则自动网易云搜索
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleAiGuess}
            disabled={aiLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "100px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7, #f0abcb)",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              opacity: aiLoading ? 0.7 : 1,
            }}
          >
            <Sparkles size={13} />
            猜你喜欢
          </button>
          <span style={{ color: "#e5e7eb", fontSize: "0.82rem" }}>或</span>
        </div>

        <form onSubmit={handleAiSearch} style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={2}
              placeholder="例如：适合深夜学习的轻音乐、90年代粤语经典…"
              style={{
                width: "100%",
                padding: "11px 16px 11px 42px",
                borderRadius: "12px",
                border: `1.5px solid ${C.border}`,
                background: "#faf9ff",
                color: C.text,
                fontSize: "0.85rem",
                fontFamily: "'DM Sans',sans-serif",
                resize: "none",
                lineHeight: 1.6,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f0abcb")}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
            <Mic size={14} color="#f0abcb" style={{ position: "absolute", left: "14px", top: "14px", pointerEvents: "none" }} />
          </div>
          <button
            type="submit"
            disabled={aiLoading || !aiPrompt.trim()}
            style={{
              padding: "11px 18px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7, #f0abcb)",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              alignSelf: "flex-start",
              opacity: aiLoading || !aiPrompt.trim() ? 0.7 : 1,
            }}
          >
            {aiLoading ? "推荐中…" : "AI 推荐"}
          </button>
        </form>

        {aiLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "0.875rem", marginTop: "12px" }}>
            <Loader size={15} className="animate-spin-slow" style={{ animationDuration: "1s" }} />
            正在生成推荐…
          </div>
        )}

        {aiError && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "12px" }}>{aiError}</p>}

        {aiResult && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #faf5ff, #fef0f9)",
                border: `1px solid ${C.border}`,
                marginBottom: "10px",
                display: "flex",
                gap: "8px",
              }}
            >
              <Sparkles size={14} color="#a855f7" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "0.83rem", color: "#6d28d9", lineHeight: 1.65, margin: 0 }}>{aiResult.summary}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {aiResult.songs.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    border: `1px solid ${C.border}`,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f5f0ff, #fce7f8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Music size={17} color="#a855f7" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: C.text, margin: 0 }}>{s.title}</p>
                    <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: "2px" }}>
                      {s.artist}
                      {s.reason ? ` · ${s.reason}` : ""}
                      {s.matched === false ? " · 未匹配可播放" : ""}
                    </p>
                  </div>
                  {s.matched !== false ? (
                    <ActionBtn icon={<Play size={13} fill="#7c3aed" />} color="#7c3aed" bg="#f0ebff" onClick={() => onPlay(s, aiResult.songs)} title="播放" />
                  ) : (
                    <ActionBtn
                      icon={<Search size={13} />}
                      color="#0ea5e9"
                      bg="#e0f2fe"
                      onClick={() => {
                        setKeyword(`${s.title} ${s.artist}`.trim());
                        setSearched(false);
                        setResults([]);
                      }}
                      title="去搜索"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {addModal && <AddToPlaylistModal song={addModal} playlists={playlists} onClose={() => setAddModal(null)} onAdd={onAddToPlaylist} />}
    </div>
  );
}
