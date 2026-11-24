import { useEffect, useState } from "react";
import { Plus, Trash2, ListMusic, Play, X, Music2, ChevronLeft, Search, MinusCircle } from "lucide-react";
import { api } from "../api";
import type { Playlist, Song } from "../types";
import { apiPlaylistDetailToUi, apiSongToUi } from "../utils/songMapper";

const C = { color: "#0ea5e9", muted: "#9ca3af", border: "rgba(14,165,233,0.12)", text: "#1a1a2e", pale: "#e0f2fe" };

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (n: string, d: string) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid rgba(14,165,233,0.2)",
    background: "#f0f9ff",
    color: C.text,
    fontSize: "0.875rem",
    fontFamily: "'DM Sans',sans-serif",
    transition: "border-color 0.2s",
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ListMusic size={15} color="#fff" />
            </div>
            <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: C.text, margin: 0 }}>
              新建歌单
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>
              歌单名称 *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给歌单起个名字…"
              style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#0ea5e9")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(14,165,233,0.2)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>
              描述（可选）
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="描述一下这个歌单…"
              rows={3}
              style={{ ...inp, resize: "none", lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = "#0ea5e9")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(14,165,233,0.2)")}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
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
          <button
            onClick={() => {
              if (name.trim()) {
                onCreate(name, desc);
                onClose();
              }
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.875rem",
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #f97316, #fb923c)",
  "linear-gradient(135deg, #10b981, #34d399)",
  "linear-gradient(135deg, #ef4444, #f87171)",
  "linear-gradient(135deg, #8b5cf6, #a78bfa)",
];

function PlaylistDetail({
  playlist,
  loading,
  onBack,
  onPlay,
  onRemoveSong,
  onAddSong,
}: {
  playlist: Playlist;
  loading: boolean;
  onBack: () => void;
  onPlay: (s: Song, q: Song[]) => void;
  onRemoveSong: (playlistId: string, song: Song) => Promise<void>;
  onAddSong: (playlistId: string, song: Song) => Promise<void>;
}) {
  const [addQuery, setAddQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchHint, setSearchHint] = useState("");

  const existingIds = new Set(playlist.songs.map((s) => s.id));

  const searchLocalSongs = async () => {
    const q = addQuery.trim();
    if (!q) {
      setSearchHint("请输入歌曲名或歌手名");
      return;
    }
    setSearchHint("");
    setSearching(true);
    try {
      const res = await api.songs.list({ search: q, limit: 20, order_by: "weight" });
      const items = (res.data?.items || []).map(apiSongToUi);
      setSearchResults(items);
      if (items.length === 0) setSearchHint("未找到匹配的本地上传歌曲");
    } catch {
      setSearchHint("搜索失败，请稍后重试");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (song: Song) => {
    if (existingIds.has(song.id)) return;
    setAddingId(song.id);
    try {
      await onAddSong(playlist.id, song);
      setSearchResults((prev) => prev.filter((s) => s.id !== song.id));
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (song: Song) => {
    if (!confirm("确定从歌单中移除这首歌曲吗？")) return;
    setRemovingId(song.id);
    try {
      await onRemoveSong(playlist.id, song);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 14px",
            borderRadius: "100px",
            border: `1px solid ${C.border}`,
            background: "#fff",
            color: C.text,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.82rem",
          }}
        >
          <ChevronLeft size={16} /> 返回
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 12px rgba(14,165,233,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: C.text, margin: 0 }}>
              {playlist.name}
            </h1>
            {playlist.description && (
              <p style={{ color: C.muted, fontSize: "0.85rem", marginTop: "6px" }}>{playlist.description}</p>
            )}
            <p style={{ color: C.muted, fontSize: "0.78rem", marginTop: "8px" }}>{playlist.songs.length} 首歌曲</p>
          </div>
          {playlist.songs.length > 0 && (
            <button
              onClick={() => onPlay(playlist.songs[0], playlist.songs)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "100px",
                border: "none",
                background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                color: "#fff",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <Play size={14} fill="#fff" /> 播放全部
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "1rem", color: C.text, margin: "0 0 14px" }}>
          歌单歌曲
        </h2>
        {loading ? (
          <p style={{ color: C.muted, fontSize: "0.85rem" }}>加载中…</p>
        ) : playlist.songs.length === 0 ? (
          <p style={{ color: C.muted, fontSize: "0.85rem" }}>歌单里还没有歌曲，可在下方搜索并添加</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {playlist.songs.map((song, idx) => (
              <div
                key={`${song.id}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: "22px", textAlign: "center", fontSize: "0.75rem", color: C.muted }}>{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.title}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: C.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.artist}
                    {song.duration ? ` · ${song.duration}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onPlay(song, playlist.songs)}
                  title="播放"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    background: C.pale,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Play size={12} color={C.color} fill={C.color} />
                </button>
                <button
                  onClick={() => handleRemove(song)}
                  disabled={removingId === song.id}
                  title="从歌单移除"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: removingId === song.id ? "wait" : "pointer",
                    flexShrink: 0,
                    opacity: removingId === song.id ? 0.6 : 1,
                  }}
                >
                  <MinusCircle size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "1rem", color: C.text, margin: "0 0 6px" }}>
          添加歌曲
        </h2>
        <p style={{ color: C.muted, fontSize: "0.78rem", margin: "0 0 14px" }}>
          从本地上传曲库中搜索并加入歌单（需先在「上传」页上传音频）
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} color={C.muted} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchLocalSongs()}
              placeholder="搜索歌曲名或歌手…"
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                borderRadius: "10px",
                border: "1.5px solid rgba(14,165,233,0.2)",
                background: "#f0f9ff",
                color: C.text,
                fontSize: "0.875rem",
                fontFamily: "'DM Sans',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={searchLocalSongs}
            disabled={searching}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: searching ? "wait" : "pointer",
              opacity: searching ? 0.7 : 1,
            }}
          >
            {searching ? "搜索中…" : "搜索"}
          </button>
        </div>
        {searchHint && <p style={{ color: C.muted, fontSize: "0.78rem", margin: "0 0 10px" }}>{searchHint}</p>}
        {searchResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {searchResults.map((song) => {
              const inPlaylist = existingIds.has(song.id);
              return (
                <div
                  key={song.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: inPlaylist ? "#f9fafb" : "transparent",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {song.title}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: C.muted, margin: "2px 0 0" }}>{song.artist}</p>
                  </div>
                  {inPlaylist ? (
                    <span style={{ fontSize: "0.72rem", color: C.muted, flexShrink: 0 }}>已在歌单</span>
                  ) : (
                    <button
                      onClick={() => handleAdd(song)}
                      disabled={addingId === song.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "100px",
                        border: "none",
                        background: C.pale,
                        color: C.color,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: addingId === song.id ? "wait" : "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={12} /> {addingId === song.id ? "添加中…" : "添加"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlaylistPage({
  playlists,
  onPlay,
  onDelete,
  onCreate,
  onAddSong,
  onRemoveSong,
}: {
  playlists: Playlist[];
  onPlay: (s: Song, q: Song[]) => void;
  onDelete: (id: string) => void;
  onCreate: (n: string, d: string) => void;
  onAddSong: (playlistId: string, song: Song) => Promise<void>;
  onRemoveSong: (playlistId: string, song: Song) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Playlist | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    const updated = playlists.find((p) => p.id === selectedId);
    if (updated) setDetail(updated);
  }, [playlists, selectedId]);

  useEffect(() => {
    if (selectedId && !playlists.some((p) => p.id === selectedId)) {
      setSelectedId(null);
      setDetail(null);
    }
  }, [playlists, selectedId]);

  const openDetail = async (pl: Playlist) => {
    setSelectedId(pl.id);
    setDetail(pl);
    setLoadingDetail(true);
    try {
      const res = await api.playlists.get(parseInt(pl.id, 10));
      const payload = res.data;
      setDetail(apiPlaylistDetailToUi(payload, payload.songs || []));
    } catch {
      setDetail(pl);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  if (selectedId && detail) {
    return (
      <>
        <PlaylistDetail
          playlist={detail}
          loading={loadingDetail}
          onBack={closeDetail}
          onPlay={onPlay}
          onAddSong={onAddSong}
          onRemoveSong={onRemoveSong}
        />
        {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={onCreate} />}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
            }}
          >
            <ListMusic size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>
              我的歌单
            </h1>
            <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>{playlists.length} 个歌单</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 20px",
            borderRadius: "100px",
            border: "none",
            background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
            color: "#fff",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(14,165,233,0.25)",
          }}
        >
          <Plus size={15} /> 新建歌单
        </button>
      </div>

      {playlists.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "60px 20px",
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <ListMusic size={28} color="#38bdf8" />
          </div>
          <p style={{ color: C.muted, fontSize: "0.9rem" }}>还没有歌单，点击「新建歌单」开始吧</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "14px" }}>
          {playlists.map((pl, idx) => {
            const songCount = pl.songs.length > 0 ? pl.songs.length : pl.songCount;
            return (
              <div
                key={pl.id}
                onClick={() => openDetail(pl)}
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 12px rgba(14,165,233,0.06)",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,165,233,0.14)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,165,233,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: COVER_GRADIENTS[idx % COVER_GRADIENTS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Music2 size={36} color="rgba(255,255,255,0.35)" />
                  {pl.songs.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(pl.songs[0], pl.songs);
                      }}
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Play size={13} color={C.color} fill={C.color} />
                    </button>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      padding: "3px 8px",
                      borderRadius: "100px",
                      background: "rgba(255,255,255,0.2)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff" }}>{songCount} 首</span>
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: C.text,
                      marginBottom: "3px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pl.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: C.muted,
                      marginBottom: "10px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pl.description || "暂无描述"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pl.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#f9fafb",
                      color: C.muted,
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontFamily: "'DM Sans',sans-serif",
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
                    <Trash2 size={11} /> 删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={onCreate} />}
    </div>
  );
}
