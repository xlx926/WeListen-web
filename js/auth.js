/** 认证状态工具 */
const auth = {
  user: null,

  async check() {
    try {
      const res = await api.me();
      this.user = res.data;
      return this.user;
    } catch {
      this.user = null;
      return null;
    }
  },

  async requireLogin(redirect = "login.html") {
    const user = await this.check();
    if (!user) {
      location.href = redirect;
      return null;
    }
    return user;
  },

  async logout() {
    await api.logout();
    this.user = null;
    location.href = "login.html";
  },

  updateHeader(elId = "user-status") {
    const el = document.getElementById(elId);
    if (!el) return;
    if (this.user) {
      el.innerHTML = `<span class="user-name">${this.user.username}</span>
        <button class="btn-link" id="btn-logout">退出</button>`;
      document.getElementById("btn-logout")?.addEventListener("click", () => this.logout());
    } else {
      el.innerHTML = `<a href="login.html" class="btn-link">去登录</a>`;
    }
  },
};
