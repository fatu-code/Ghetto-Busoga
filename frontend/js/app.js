/* ── BGS app.js — Shared JS ─────────────────────────────────────── */

const API_BASE = 'https://backend-ghetto-busoga-production.up.railway.app';

// ── DISTRICTS ───────────────────────────────────────────────────────
const DISTRICTS = [
  { code:'JJA', name:'Jinja City',     max:20 },
  { code:'JJD', name:'Jinja District', max:10 },
  { code:'KML', name:'Kamuli',         max:10 },
  { code:'KLR', name:'Kaliro',         max:10 },
  { code:'BYD', name:'Buyende',        max:10 },
  { code:'IGA', name:'Iganga',         max:10 },
  { code:'LUK', name:'Luuka',          max:10 },
  { code:'NMT', name:'Namutumba',      max:10 },
  { code:'BGR', name:'Bugiri',         max:10 },
  { code:'MYG', name:'Mayuge',         max:10 },
  { code:'BSA', name:'Busia',          max:10 },
  { code:'NMY', name:'Namayingo',      max:10 },
  { code:'BGW', name:'Bugweri',        max:10 },
];

// ── AUTH ─────────────────────────────────────────────────────────────
const Auth = {
  get()        { try { return JSON.parse(localStorage.getItem('bgs_user')); } catch { return null; } },
  token()      { return localStorage.getItem('bgs_token'); },
  set(user, t) { localStorage.setItem('bgs_user', JSON.stringify(user)); localStorage.setItem('bgs_token', t); },
  clear()      { localStorage.removeItem('bgs_user'); localStorage.removeItem('bgs_token'); },
  require()    {
    const u = this.get();
    if (!u || !this.token()) { window.location.href = 'index.html'; return null; }
    return u;
  },
};

// ── API FETCH ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token   = Auth.token();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res  = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) { Auth.clear(); window.location.href = 'index.html'; return; }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// ── SIDEBAR BUILDER ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard',    href:'dashboard.html',
    icon:'<svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>' },
  { id:'members',   label:'Beneficiaries', href:'members.html',
    icon:'<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>' },
];

function buildSidebar(active) {
  const el   = document.getElementById('sidebar');
  if (!el) return;
  const user = Auth.get();

  el.innerHTML = `
    <div class="sb-logo">
      <div class="logo-dots">
        <span style="background:#009c41"></span>
        <span style="background:#b3e6c8"></span>
        <span style="background:#eaf7f0"></span>
      </div>
      <div class="logo-name">BGS <em>Busoga</em></div>
    </div>
    <div class="sb-user">
      <div class="sb-avatar">${initials(user?.name || 'HK')}</div>
      <div style="flex:1;min-width:0">
        <div class="sb-user-name">${user?.name || 'Haji Faruk Kirunda'}</div>
        <div class="sb-user-role">${user?.role === 'admin' ? 'National Coordinator' : 'Staff'}</div>
      </div>
      <div class="sb-online"></div>
    </div>
    <div class="sb-nav">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item${active === item.id ? ' active' : ''}">
          <div class="nav-icon">${item.icon}</div>
          <span class="nav-label">${item.label}</span>
        </a>`).join('')}
    </div>
    <div class="sb-bottom">
      <div class="sb-bottom-text">A programme by<br><strong>State House Uganda</strong></div>
      <button class="sb-logout" onclick="logout()">
        <svg viewBox="0 0 16 16"><path d="M10 8H2M7 5l-3 3 3 3"/><path d="M6 3H13a1 1 0 011 1v8a1 1 0 01-1 1H6"/></svg>
        Sign Out
      </button>
    </div>`;
}

function logout() { Auth.clear(); window.location.href = 'index.html'; }

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('show');
}

// ── HELPERS ──────────────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').map(w => w[0] || '').join('').slice(0,2).toUpperCase();
}
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return d; }
}
function formatDateShort(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-UG', { day:'numeric', month:'short' }); }
  catch { return d; }
}
function fmt(n)         { return Number(n || 0).toLocaleString('en-UG'); }
function statusPill(s)  {
  const m = { Active:'pill-green', Inactive:'pill-gray', Suspended:'pill-red' };
  return `<span class="pill ${m[s] || 'pill-gray'}">${s}</span>`;
}

// ── TOAST ────────────────────────────────────────────────────────────
let _tt;
function showToast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── MODAL ────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-bg').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});
