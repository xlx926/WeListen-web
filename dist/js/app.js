let currentHistoryTab = "all";

async function init() {
  const user = await auth.check();
  auth.updateHeader();
  if (user) {
    document.getElementById("nav-login").style.display = "none";
    loadHistory("all");
  }
  loadSongs();
  bindHistoryTabs();
}

async function loadSongs() {
  const el = document.getElementById("song-list");
  try {
    const res = await api.listSongs(1, "weight");
    const songs = res.data.list || [];
    if (!songs.length) {
      el.innerHTML = "<p class='empty'>暂无歌曲，请管理员上传</p>";
      return;
    }
    el.innerHTML = songs.map(s => `
      <div class="song-item" data-id="${s.id}">
        <div class="song-info">
          <strong>${esc(s.title)}</strong>
          <span>${esc(s.artist)} · 播放 ${s.play_count || 0} 次</span>
        </div>
        <button class="btn-sm" onclick="playLocal(${s.id}, '${esc(s.title)}', '${esc(s.artist)}')">播放</button>
      </div>
    `).join("");
  } catch (e) {
    el.innerHTML = `<p class="empty error-text">${e.message}</p>`;
  }
}

async function playLocal(id, title, artist) {
  const audio = document.getElementById("audio-player");
  document.getElementById("now-playing").textContent = `${title} - ${artist}`;
  try {
    if (auth.user) await api.playSong(id);
    audio.src = api.streamUrl(id);
    audio.play();
    if (auth.user) loadHistory(currentHistoryTab);
  } catch (e) {
    alert("播放失败: " + e.message);
  }
}

function bindHistoryTabs() {
  document.querySelectorAll("[data-history]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-history]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentHistoryTab = btn.dataset.history;
      loadHistory(currentHistoryTab);
    });
  });
}

async function loadHistory(type) {
  const el = document.getElementById("history-list");
  if (!auth.user) {
    el.innerHTML = `<p class="empty"><a href="login.html">登录</a> 后查看播放记录</p>`;
    return;
  }
  el.innerHTML = "加载中...";
  try {
    let res;
    if (type === "all") res = await api.playHistoryAll();
    else if (type === "recent") res = await api.playHistoryRecent();
    else res = await api.playHistorySummary();

    const list = res.data.list || [];
    if (!list.length) {
      el.innerHTML = "<p class='empty'>暂无播放记录</p>";
      return;
    }

    if (type === "summary") {
      el.innerHTML = list.map(r => `
        <div class="song-item">
          <div class="song-info">
            <strong>${esc(r.title)}</strong>
            <span>${esc(r.artist)} · 共播放 ${r.play_count} 次 · 最近 ${fmtTime(r.last_played_at)}</span>
          </div>
          ${r.song_id ? `<button class="btn-sm" onclick="playLocal(${r.song_id}, '${esc(r.title)}', '${esc(r.artist)}')">再听</button>` : ""}
        </div>
      `).join("");
    } else if (type === "all") {
      el.innerHTML = list.map(r => `
        <div class="song-item">
          <div class="song-info">
            <strong>${esc(r.title)}</strong>
            <span>${esc(r.artist)} · ${r.source === "external" ? r.platform : "本地"} · ${fmtTime(r.played_at)}</span>
          </div>
          ${r.source === "local" && r.item_id ? `<button class="btn-sm" onclick="playLocal(${r.item_id}, '${esc(r.title)}', '${esc(r.artist)}')">再听</button>` : ""}
        </div>
      `).join("");
    } else {
      el.innerHTML = list.map(r => `
        <div class="song-item">
          <div class="song-info">
            <strong>${esc(r.title)}</strong>
            <span>${esc(r.artist)} · ${fmtTime(r.played_at)} · 累计 ${r.user_total_plays || 1} 次</span>
          </div>
          <button class="btn-sm" onclick="playLocal(${r.song_id}, '${esc(r.title)}', '${esc(r.artist)}')">再听</button>
        </div>
      `).join("");
    }
  } catch (e) {
    el.innerHTML = `<p class="empty error-text">${e.message}</p>`;
  }
}

function esc(s) {
  return String(s || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function fmtTime(t) {
  if (!t) return "";
  return new Date(t).toLocaleString("zh-CN");
}

init();
