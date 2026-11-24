export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "" : "http://localhost:8888"),
  /** 音频/视频流直连接后端，避免 Vite 代理对 Range 请求处理异常 */
  MEDIA_BASE_URL:
    import.meta.env.VITE_MEDIA_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8888",
  HOME_URL: "/",
  APP_NAME: "WeListen",
};