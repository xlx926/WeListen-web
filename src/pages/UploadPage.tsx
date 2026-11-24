import { useState, useRef } from "react";
import { Upload, FileMusic, EyeOff, Eye, Info, CheckCircle, CloudUpload, Play } from "lucide-react";
import type { UploadedSong } from "../types";
import { api, type Song as ApiSong } from "../api";

const C = { color: "#10b981", muted: "#9ca3af", border: "rgba(16,185,129,0.12)", text: "#1a1a2e" };

export function UploadPage({
  uploads,
  onToggleStatus,
  onUploaded,
  onPlay,
}: {
  uploads: UploadedSong[];
  onToggleStatus: (id: string) => void;
  onUploaded: (created?: ApiSong) => void;
  onPlay: (upload: UploadedSong) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      alert("仅支持 MP3、WAV、FLAC、M4A 格式");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      alert("文件不能超过 50MB");
      return;
    }
    setFile(f);
    setFileName(f.name);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      const res = await api.songs.upload(file, title.trim(), artist.trim() || "未知艺术家");
      setDone(true);
      setFile(null);
      setFileName("");
      setTitle("");
      setArtist("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded(res.data);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      alert("上传失败: " + (err instanceof Error ? err.message : err));
    } finally {
      setUploading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid rgba(16,185,129,0.2)",
    background: "#f0fdf4",
    color: C.text,
    fontSize: "0.875rem",
    fontFamily: "'DM Sans',sans-serif",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #10b981, #34d399)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
          }}
        >
          <Upload size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, margin: 0 }}>
            上传歌曲
          </h1>
          <p style={{ color: C.muted, fontSize: "0.82rem", marginTop: "2px" }}>上传本地音乐到平台曲库</p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(16,185,129,0.05)",
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
            background: "linear-gradient(90deg, #10b981, #34d399, #6ee7b7)",
          }}
        />

        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? "#10b981" : "rgba(16,185,129,0.25)"}`,
            borderRadius: "16px",
            padding: "36px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "#f0fdf4" : "#fafffe",
            transition: "all 0.2s",
            marginBottom: "18px",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,.wav,.flac,.m4a"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #34d399)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            }}
          >
            <CloudUpload size={24} color="#fff" />
          </div>
          {fileName ? (
            <>
              <p style={{ fontWeight: 700, color: "#10b981", fontSize: "0.9rem" }}>
                <FileMusic size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                {fileName}
              </p>
              <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: "4px" }}>点击重新选择</p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, color: C.text, fontSize: "0.9rem" }}>点击或拖拽文件到此处</p>
              <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: "4px" }}>支持 MP3 / WAV / FLAC / M4A，单文件 ≤ 50MB</p>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, display: "block", marginBottom: "5px" }}>
              歌曲名 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入歌曲名称"
              style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.2)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, display: "block", marginBottom: "5px" }}>
              艺术家（可选）
            </label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="输入艺术家名称"
              style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.2)")}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#f0fdf4",
            border: "1px solid rgba(16,185,129,0.15)",
            marginBottom: "16px",
          }}
        >
          <Info size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "0.77rem", color: "#065f46", lineHeight: 1.6, margin: 0 }}>
            上传即代表你拥有该文件的合法版权，平台保留对违规内容下架的权利。上传后歌曲进入审核，审核通过后自动上架。
          </p>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || !title.trim() || uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 24px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg,#10b981,#34d399)",
            color: "#fff",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            opacity: !file || !title.trim() || uploading ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {done ? (
            <>
              <CheckCircle size={16} />上传成功
            </>
          ) : uploading ? (
            "上传中…"
          ) : (
            <>
              <Upload size={15} />开始上传
            </>
          )}
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "22px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 16px rgba(16,185,129,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", width: "100%" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(16,185,129,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileMusic size={14} color="#10b981" />
          </div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: C.text, margin: 0 }}>
            我的上传
          </h2>
          <span style={{ fontSize: "0.72rem", color: C.muted, marginLeft: "auto" }}>
            {uploads.length} 首 · 点击可播放
          </span>
        </div>
        {uploads.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: "28px 0", fontSize: "0.875rem" }}>暂无上传记录</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {uploads.map((u) => (
              <div
                key={u.id}
                onClick={() => u.status === "online" && onPlay(u)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  border: "1px solid rgba(16,185,129,0.08)",
                  background: "#fff",
                  transition: "background 0.15s",
                  cursor: u.status === "online" ? "pointer" : "default",
                }}
                onMouseEnter={(e) => {
                  if (u.status === "online") e.currentTarget.style.background = "#fafffe";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "11px",
                    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileMusic size={17} color="#34d399" />
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
                    {u.title}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: C.muted }}>
                    {u.artist || "未知艺术家"} · {u.uploadedAt}
                  </p>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: u.status === "online" ? "#f0fdf4" : "#fef2f2",
                    color: u.status === "online" ? "#16a34a" : "#ef4444",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {u.status === "online" ? (
                    <>
                      <CheckCircle size={10} />已上架
                    </>
                  ) : (
                    "已下架"
                  )}
                </span>
                {u.status === "online" && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(u);
                      }}
                      title="播放"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#ecfdf5",
                        color: "#10b981",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Play size={13} fill="#10b981" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(u.id);
                      }}
                      title="下架"
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
                        flexShrink: 0,
                      }}
                    >
                      <EyeOff size={13} />
                    </button>
                  </>
                )}
                {u.status === "offline" && (
                  <button
                    disabled
                    title="已下架歌曲暂不支持重新上架"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#f3f4f6",
                      color: C.muted,
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.6,
                    }}
                  >
                    <Eye size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
