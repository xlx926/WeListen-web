import { useState } from "react";
import { Eye, EyeOff, Music2, Headphones, Radio } from "lucide-react";
import { api } from "./api";

type View = "login" | "register";

function FloatingNote({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute select-none pointer-events-none opacity-10 text-primary animate-pulse"
      style={{ fontFamily: "var(--font-display)", fontSize: "2rem", ...style }}
    >
      ♪
    </div>
  );
}

function InputField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm tracking-wide" style={{ color: "var(--secondary-foreground)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            background: "var(--input-background)",
            color: "var(--foreground)",
            borderColor: error ? "var(--destructive)" : "var(--border)",
            outline: "none",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "请输入用户名";
    if (!password) e.password = "请输入密码";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);
    try {
      await api.auth.login(username.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField
        id="login-username"
        label="用户名"
        type="text"
        placeholder="输入你的用户名"
        value={username}
        onChange={setUsername}
        error={errors.username}
      />
      <InputField
        id="login-password"
        label="密码"
        type="password"
        placeholder="输入你的密码"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />

      {apiError && (
        <div className="text-sm text-center py-2 px-4 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "var(--destructive)" }}>
          {apiError}
        </div>
      )}

      {success && (
        <div className="text-sm text-center py-2 px-4 rounded-lg" style={{ background: "rgba(168,85,247,0.12)", color: "var(--primary)" }}>
          登录成功！欢迎回来 🎵
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", color: "#fff" }}
      >
        {loading ? "登录中..." : "登 录"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        还没有账号？{" "}
        <button type="button" onClick={onSwitch} className="hover:opacity-80 transition-opacity" style={{ color: "var(--primary)" }}>
          立即注册
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "请输入用户名";
    else if (username.length < 3) e.username = "用户名至少 3 个字符";
    if (!password) e.password = "请输入密码";
    else if (password.length < 6) e.password = "密码至少 6 位";
    if (!confirm) e.confirm = "请再次输入密码";
    else if (confirm !== password) e.confirm = "两次密码不一致";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);
    try {
      await api.auth.register(username.trim(), password);
      await api.auth.login(username.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField
        id="reg-username"
        label="用户名"
        type="text"
        placeholder="设置一个用户名"
        value={username}
        onChange={setUsername}
        error={errors.username}
      />
      <InputField
        id="reg-password"
        label="密码"
        type="password"
        placeholder="设置密码（至少 6 位）"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />
      <InputField
        id="reg-confirm"
        label="确认密码"
        type="password"
        placeholder="再次输入密码"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
      />

      {apiError && (
        <div className="text-sm text-center py-2 px-4 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "var(--destructive)" }}>
          {apiError}
        </div>
      )}

      {success && (
        <div className="text-sm text-center py-2 px-4 rounded-lg" style={{ background: "rgba(168,85,247,0.12)", color: "var(--primary)" }}>
          注册成功！开始你的音乐之旅 🎶
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", color: "#fff" }}
      >
        {loading ? "注册中..." : "创建账号"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        已有账号？{" "}
        <button type="button" onClick={onSwitch} className="hover:opacity-80 transition-opacity" style={{ color: "var(--primary)" }}>
          立即登录
        </button>
      </p>
    </form>
  );
}

export default function LoginApp() {
  const [view, setView] = useState<View>("login");

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-25 blur-[130px] pointer-events-none" style={{ background: "#6d28d9" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[110px] pointer-events-none" style={{ background: "#a855f7" }} />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none" style={{ background: "#4c1d95" }} />

      <FloatingNote style={{ top: "12%", left: "8%" }} />
      <FloatingNote style={{ top: "30%", left: "3%", fontSize: "1.4rem", animationDelay: "0.5s" }} />
      <FloatingNote style={{ top: "65%", left: "6%", fontSize: "2.5rem", animationDelay: "1s" }} />
      <FloatingNote style={{ top: "10%", right: "7%", fontSize: "1.6rem", animationDelay: "0.3s" }} />
      <FloatingNote style={{ top: "55%", right: "4%", fontSize: "3rem", animationDelay: "0.8s" }} />
      <FloatingNote style={{ top: "80%", right: "9%", fontSize: "1.2rem", animationDelay: "1.2s" }} />

      <div className="relative z-10 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div
            className="flex flex-col justify-between p-10 min-h-[540px] relative"
            style={{ background: "linear-gradient(160deg, #1a1230 0%, #0d0d14 60%, #100d1f 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-12">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)" }}>
                  <Music2 size={18} color="white" />
                </div>
                <span
                  style={{
                    color: "var(--primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                  }}
                >
                  WeListen
                </span>
              </div>

              <h1
                className="leading-snug mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.9rem, 3vw, 2.7rem)",
                  color: "var(--foreground)",
                  fontStyle: "italic",
                }}
              >
                点播你热爱的
                <br />
                每一首歌
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                加入 WeListen，与朋友共享音乐时光，实时点播你喜爱的歌曲，让音乐响彻每个角落。
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-3 mt-8">
              {[
                { icon: <Headphones size={13} />, text: "实时音乐点播" },
                { icon: <Radio size={13} />, text: "多人协同歌单" },
                { icon: <Music2 size={13} />, text: "海量曲库收录" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)", color: "var(--primary)" }}
                  >
                    {icon}
                  </div>
                  <span className="text-sm" style={{ color: "var(--secondary-foreground)" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center p-10" style={{ background: "var(--card)" }}>
            <div className="flex rounded-xl p-1 mb-8" style={{ background: "var(--secondary)" }}>
              {(["login", "register"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className="flex-1 py-2 rounded-lg text-sm transition-all duration-200"
                  style={
                    view === v
                      ? { background: "linear-gradient(135deg, #6d28d9, #a855f7)", color: "#fff" }
                      : { color: "var(--muted-foreground)" }
                  }
                >
                  {v === "login" ? "登 录" : "注 册"}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 style={{ color: "var(--foreground)" }}>{view === "login" ? "欢迎回来" : "加入我们"}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                {view === "login"
                  ? "登录你的 WeListen 账号，继续你的音乐旅程"
                  : "创建一个免费账号，开始点播你喜爱的音乐"}
              </p>
            </div>

            {view === "login" ? (
              <LoginForm onSwitch={() => setView("register")} />
            ) : (
              <RegisterForm onSwitch={() => setView("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}