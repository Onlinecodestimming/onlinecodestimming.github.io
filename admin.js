"use strict";
const API = "https://music-backend-production-10bd.up.railway.app";

const lockScreen = document.getElementById('lockScreen');
const dashboard = document.getElementById('dashboard');
const lockForm = document.getElementById('lockForm');
const lockInput = document.getElementById('lockInput');
const lockError = document.getElementById('lockError');

function getToken() {
  return sessionStorage.getItem('musicfy-admin-token') || '';
}
function setToken(t) {
  sessionStorage.setItem('musicfy-admin-token', t);
}
function clearToken() {
  sessionStorage.removeItem('musicfy-admin-token');
}

async function verifyToken(token) {
  try {
    const r = await fetch(API + '/admin/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    return r.status !== 403;
  } catch {
    return false;
  }
}

async function tryUnlock(token) {
  lockError.textContent = '';
  const ok = await verifyToken(token);
  if (!ok) {
    lockError.textContent = 'Incorrect token.';
    return;
  }
  setToken(token);
  showDashboard();
}

lockForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const token = lockInput.value.trim();
  if (!token) return;
  tryUnlock(token);
});

document.getElementById('lockOutBtn').addEventListener('click', () => {
  clearToken();
  location.reload();
});

function showDashboard() {
  lockScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadOverview();
  loadAnnouncements();
  loadTracks();
}

function authHeaders(extra) {
  return Object.assign({ 'Authorization': 'Bearer ' + getToken() }, extra || {});
}

(async function init() {
  const stored = getToken();
  if (stored) {
    const ok = await verifyToken(stored);
    if (ok) { showDashboard(); return; }
    clearToken();
  }
})();

document.querySelectorAll('.admin-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

async function loadOverview() {
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '<div class="muted">Loading stats…</div>';
  try {
    const r = await fetch(API + '/admin/stats', { headers: authHeaders() });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed to load stats');

    grid.innerHTML = `
      <div class="stat-card"><div class="stat-value">${j.trackCount}</div><div class="stat-label">Tracks</div></div>
      <div class="stat-card"><div class="stat-value">${j.albumCount}</div><div class="stat-label">Albums</div></div>
      <div class="stat-card"><div class="stat-value">${j.artistCount}</div><div class="stat-label">Artists</div></div>
      <div class="stat-card"><div class="stat-value">${j.totalMB.toLocaleString()} MB</div><div class="stat-label">Storage used</div></div>
      <div class="stat-card"><div class="stat-value">${j.coverCount}</div><div class="stat-label">Covers detected</div></div>
      <div class="stat-card"><div class="stat-value">${j.announcementCount}</div><div class="stat-label">Announcements</div></div>
    `;

    const pillAdmin = document.getElementById('pillAdmin');
    pillAdmin.textContent = 'Admin token: ' + (j.adminConfigured ? 'configured' : 'NOT SET');
    pillAdmin.className = 'config-pill ' + (j.adminConfigured ? 'ok' : 'bad');

    const pillR2 = document.getElementById('pillR2');
    pillR2.textContent = 'R2 storage: ' + (j.r2Configured ? 'connected' : 'not configured');
    pillR2.className = 'config-pill ' + (j.r2Configured ? 'ok' : 'bad');
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="muted">Couldn\'t load stats.</div>';
  }
}

const announceForm = document.getElementById('announceForm');
const announceMessage = document.getElementById('announceMessage');
const announceLevel = document.getElementById('announceLevel');

announceForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const message = announceMessage.value.trim();
  if (!message) return;

  try {
    const r = await fetch(API + '/announcements', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message, level: announceLevel.value })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed to post');

    announceMessage.value = '';
    announceLevel.value = 'info';
    await loadAnnouncements();
    await loadOverview();
  } catch (e) {
    console.error(e);
    alert(e.message || 'Failed to post announcement');
  }
});

async function loadAnnouncements() {
  const list = document.getElementById('announcementsList');
  list.innerHTML = '<div class="muted">Loading…</div>';
  try {
    const r = await fetch(API + '/announcements');
    const j = await r.json();
    const items = j.announcements || [];

    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<div class="muted">No announcements yet.</div>';
      return;
    }

    items.forEach(a => {
      const el = document.createElement('div');
      el.className = 'announcement-item ' + a.level;
      const when = new Date(a.createdAt).toLocaleString();
      el.innerHTML = `
        <span class="level-dot"></span>
        <div class="a-body">
          <div class="a-message"></div>
          <div class="a-time">${escapeHtml(when)}</div>
        </div>
        <button class="a-delete" title="Delete">&times;</button>
      `;
      el.querySelector('.a-message').textContent = a.message;
      el.querySelector('.a-delete').onclick = () => deleteAnnouncement(a.id);
      list.appendChild(el);
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = '<div class="muted">Couldn\'t load announcements.</div>';
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    const r = await fetch(API + '/announcements/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!r.ok) throw new Error('Delete failed');
    await loadAnnouncements();
    await loadOverview();
  } catch (e) {
    console.error(e);
    alert('Delete failed');
  }
}

let allTracks = [];

async function loadTracks() {
  const table = document.getElementById('tracksTable');
  table.innerHTML = '<div class="muted">Loading…</div>';
  try {
    const r = await fetch(API + '/library');
    const j = await r.json();
    allTracks = j.data || [];
    document.getElementById('trackCount').textContent = allTracks.length;
    renderTracks(allTracks);
  } catch (e) {
    console.error(e);
    table.innerHTML = '<div class="muted">Couldn\'t load tracks.</div>';
  }
}

function renderTracks(items) {
  const table = document.getElementById('tracksTable');
  table.innerHTML = '';
  if (items.length === 0) {
    table.innerHTML = '<div class="muted">No tracks match.</div>';
    return;
  }
  items.forEach(item => {
    const a = item.attributes;
    const art = (a.artwork && a.artwork.url) || '';
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <img src="${art}" loading="lazy" />
      <div class="tr-info">
        <div class="tr-title"></div>
        <div class="tr-sub"></div>
      </div>
      <div class="tr-actions">
        <button class="tr-edit">Edit</button>
        <button class="tr-delete">Delete</button>
      </div>
    `;
    row.querySelector('.tr-title').textContent = a.name;
    row.querySelector('.tr-sub').textContent = [a.artistName, a.albumName, a.genre].filter(Boolean).join(' — ');
    row.querySelector('.tr-edit').onclick = () => openTrackEdit(item.id, a);
    row.querySelector('.tr-delete').onclick = () => deleteTrackAdmin(item.id, a.name);
    table.appendChild(row);
  });
}

document.getElementById('trackFilter').addEventListener('input', (ev) => {
  const q = ev.target.value.toLowerCase().trim();
  if (!q) return renderTracks(allTracks);
  const filtered = allTracks.filter(item => {
    const a = item.attributes;
    return [a.name, a.artistName, a.albumName].some(v => (v || '').toLowerCase().includes(q));
  });
  renderTracks(filtered);
});

async function deleteTrackAdmin(id, name) {
  if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
  try {
    const r = await fetch(API + '/drive/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!r.ok) throw new Error('Delete failed');
    await loadTracks();
    await loadOverview();
  } catch (e) {
    console.error(e);
    alert('Delete failed');
  }
}

let editingTrackId = null;
const trackEditModal = document.getElementById('trackEditModal');
const teTitle = document.getElementById('teTitle');
const teArtist = document.getElementById('teArtist');
const teAlbum = document.getElementById('teAlbum');
const teGenre = document.getElementById('teGenre');
const teArtwork = document.getElementById('teArtwork');

function openTrackEdit(id, a) {
  editingTrackId = id;
  teTitle.value = a.name || '';
  teArtist.value = a.artistName || '';
  teAlbum.value = a.albumName || '';
  teGenre.value = a.genre || '';
  teArtwork.value = (a.artwork && a.artwork.url) || '';
  trackEditModal.classList.remove('hidden');
}

document.getElementById('teCancel').onclick = () => trackEditModal.classList.add('hidden');
document.getElementById('teSave').onclick = async () => {
  if (!teArtwork.value.trim()) {
    alert('Artwork URL is required.');
    return;
  }
  try {
    const r = await fetch(API + '/drive/edit', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: editingTrackId,
        name: teTitle.value,
        artistName: teArtist.value,
        albumName: teAlbum.value,
        genre: teGenre.value,
        artworkUrl: teArtwork.value.trim()
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Save failed');
    trackEditModal.classList.add('hidden');
    await loadTracks();
  } catch (e) {
    console.error(e);
    alert(e.message || 'Save failed');
  }
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
