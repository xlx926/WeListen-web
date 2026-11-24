import { useState } from "react";
import { Search, TrendingUp, Heart, ListMusic, Upload, User, Music2, LogOut, ChevronDown } from "lucide-react";
import type { NavPage } from "../types";

const NAV_ITEMS: { page: NavPage; icon: (active: boolean) => React.ReactNode; label: string; color: string }[] = [
  { page: "search", color: "#7c3aed", label: "搜索歌曲", icon: (a) => <Search size={18} color={a ? "#fff" : "#7c3aed"} /> },
  { page: "charts", color: "#f97316", label: "排行榜", icon: (a) => <TrendingUp size={18} color={a ? "#fff" : "#f97316"} /> },
  { page: "favorites", color: "#ef4444", label: "我的收藏", icon: (a) => <Heart size={18} color={a ? "#fff" : "#ef4444"} /> },
  { page: "playlist", color: "#0ea5e9", label: "我的歌单", icon: (a) => <ListMusic size={18} color={a ? "#fff" : "#0ea5e9"} /> },
  { page: "upload", color: "#10b981", label: "上传歌曲", icon: (a) => <Upload size={18} color={a ? "#fff" : "#10b981"} /> },
];

export function TopNav({
  activePage,
  onNavigate,
  onLogout,
  username,
}: {
  activePage: NavPage;
  onNavigate: (p: NavPage) => void;
  onLogout: () => void;
  username: string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "64px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(124,58,237,0.08)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
        boxShadow: "0 1px 20px rgba(124,58,237,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0, marginRight: "8px" }}>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Music2 size={16} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          WeListen
        </span>
      </div>

      <nav
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {NAV_ITEMS.map(({ page, icon, label, color }) => {
          const active = activePage === page;
          return (
            <div key={page} style={{ position: "relative" }}>
              <button
                onClick={() => onNavigate(page)}
                title={label}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.18s",
                  background: active ? color : `${color}12`,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = `${color}22`;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = `${color}12`;
                }}
              >
                {icon(active)}
              </button>
              {active && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                  }}
                />
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ position: "relative", flexShrink: 0, marginLeft: "auto" }}>
        <button
          onClick={() => setShowMenu((m) => !m)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px 6px 6px",
            borderRadius: "100px",
            border: "1.5px solid rgba(124,58,237,0.15)",
            background: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f7")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.15)")}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #f0abcb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={14} color="#fff" />
          </div>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#1a1a2e",
              maxWidth: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {username}
          </span>
          <ChevronDown
            size={13}
            color="#9ca3af"
            style={{ transition: "transform 0.2s", transform: showMenu ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid rgba(124,58,237,0.1)",
              minWidth: "160px",
              overflow: "hidden",
              zIndex: 200,
            }}
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => {
                onNavigate("profile");
                setShowMenu(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "#1a1a2e",
                fontFamily: "'DM Sans',sans-serif",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <User size={15} color="#8b5cf6" /> 个人中心
            </button>
            <div style={{ height: "1px", background: "rgba(124,58,237,0.08)", margin: "0 12px" }} />
            <button
              onClick={() => {
                onLogout();
                setShowMenu(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "#ef4444",
                fontFamily: "'DM Sans',sans-serif",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fff0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={15} color="#ef4444" /> 退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
