/* ── BGS app.js - Shared JS ─────────────────────────────────────── */

const API_BASE = "https://backend-ghetto-busoga-production.up.railway.app";

// Public, phone-reachable verification URL (served by the backend, not the
// local/Live-Server origin) so the QR works when scanned from any device.
function verifyUrl(id) { return `${API_BASE}/v/${id}`; }

// ── DISTRICTS ───────────────────────────────────────────────────────
const DISTRICTS = [
  { code: "JJA", name: "Jinja City", max: 20 },
  { code: "JJD", name: "Jinja District", max: 10 },
  { code: "IGA", name: "Iganga", max: 15 },
  { code: "KLR", name: "Kaliro", max: 10 },
  { code: "LUK", name: "Luuka", max: 10 },
  { code: "MYG", name: "Mayuge", max: 10 },
  { code: "NMY", name: "Namayingo", max: 10 },
  { code: "BGR", name: "Bugiri", max: 10 },
  { code: "BGW", name: "Bugweri", max: 10 },
  { code: "NMT", name: "Namutumba", max: 10 },
  { code: "KML", name: "Kamuli", max: 10 },
  { code: "BYD", name: "Buyende", max: 10 },
];

// Depot leadership positions. A leader is a member who holds one of these roles.
// The depot (ghetto) committee positions. Everyone else is an ordinary Member.
const DEPOT_ROLES = ["Depot Commander", "Deputy Commander", "Secretary", "Publicity"];
// The district committee: same four positions, but for the whole district.
const DISTRICT_ROLES = ["District Commander", "District Deputy Commander", "District Secretary", "District Publicity"];
// Show a stored role nicely. District roles carry the district's name, e.g.
// "District Commander" -> "Luuka Commander", "District Publicity" -> "Luuka Publicity".
function roleDisplay(role, districtName) {
  if (!role) return "";
  if (role.indexOf("District ") === 0) return (districtName || "District") + role.slice(8);
  return role;
}

// ── AUTH ─────────────────────────────────────────────────────────────
const Auth = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("bgs_user"));
    } catch {
      return null;
    }
  },
  token() {
    return localStorage.getItem("bgs_token");
  },
  set(user, t) {
    localStorage.setItem("bgs_user", JSON.stringify(user));
    localStorage.setItem("bgs_token", t);
  },
  clear() {
    localStorage.removeItem("bgs_user");
    localStorage.removeItem("bgs_token");
  },
  require() {
    const u = this.get();
    if (!u || !this.token()) {
      window.location.href = "index.html";
      return null;
    }
    return u;
  },
  // Page-level guard: bounce a signed-in user away from a page their role
  // may not open. (The backend enforces the real rules; this is just UX.)
  guard(allowedRoles, redirect = "dashboard.html") {
    const u = this.require();
    if (!u) return null;
    const role = accessOf(u).role;
    if (!allowedRoles.includes(role)) {
      window.location.href = redirect;
      return null;
    }
    return u;
  },
};

// ── ROLE ACCESS (mirrors the backend) ────────────────────────────────
// admin = full · rdc = view-only, one district · profiler = register, one
// district, never sees money. Unknown/legacy roles are treated as admin.
function accessOf(user) {
  const role = (user && user.role) || "admin";
  const isRDC = role === "rdc";
  const isProfiler = role === "profiler";
  const isAdmin = !isRDC && !isProfiler;
  return {
    role: isAdmin ? "admin" : role,
    isAdmin,
    isRDC,
    isProfiler,
    district: (user && user.district) || null,
    scoped: isRDC || isProfiler,
    canSeeMoney: !isProfiler,
    canWrite: isAdmin || isProfiler,
    canDisburse: isAdmin,
    canDelete: isAdmin,
  };
}
// Friendly label for a role, e.g. "RDC · Jinja City".
function roleLabel(user) {
  const acc = accessOf(user);
  if (acc.isAdmin) {
    // Al-Hajj Faruk Kirunda is the Chief Coordinator, not an "Administrator".
    return /kirunda|faruk/i.test((user && user.name) || "") ? "Chief Coordinator" : "Administrator";
  }
  const d = DISTRICTS.find((x) => x.code === acc.district);
  const dn = d ? d.name : acc.district || "";
  const base = acc.isRDC ? "RDC" : "Profiler";
  return dn ? `${base} · ${dn}` : base;
}

// ── DEPOTS (real, DB-backed; merged with the static fallback list) ──
let DEPOTS_DB = [];
async function loadDepotsDB() {
  try {
    const d = await apiFetch("/api/depots");
    DEPOTS_DB = d.depots || [];
  } catch {
    DEPOTS_DB = [];
  }
  return DEPOTS_DB;
}
// Depot names for a district. Uses the real depots you created once any exist
// for that district; until then it falls back to the built-in list so the
// dropdown is never empty and registration is never blocked.
function depotNamesFor(code) {
  const dbNames = DEPOTS_DB.filter((x) => x.district === code).map((x) => x.name).filter(Boolean);
  const names = dbNames.length ? dbNames : ((typeof DEPOTS !== "undefined" && DEPOTS[code]) || []);
  return [...new Set(names)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}
// Full DB record for a depot, so we can auto-fill its sub-county / parish.
function depotRecord(code, name) {
  return DEPOTS_DB.find((x) => x.district === code && x.name === name) || null;
}

// ── API FETCH ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = Auth.token();
  if (token) headers["Authorization"] = "Bearer " + token;

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      Auth.clear();
      window.location.href = "index.html";
      return;
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  // Any change (register, disburse, repayment, delete, depot, user) makes the
  // cached member list stale - drop it so the next read refetches fresh data.
  if ((options.method || "GET").toUpperCase() !== "GET") {
    try { sessionStorage.removeItem("bgs_members_cache"); } catch {}
  }
  return data;
}

// Cached fetch of the full member list, reused across pages within the session
// so navigating Depots -> Repayments -> Reports doesn't refetch every time.
async function loadAllMembers(maxAgeMs = 60000) {
  try {
    const raw = sessionStorage.getItem("bgs_members_cache");
    if (raw) {
      const c = JSON.parse(raw);
      if (c && Date.now() - c.t < maxAgeMs) return c.members;
    }
  } catch {}
  const data = await apiFetch("/api/members?limit=100000");
  const members = data.members || [];
  try { sessionStorage.setItem("bgs_members_cache", JSON.stringify({ t: Date.now(), members })); } catch {}
  return members;
}

// ── SIDEBAR BUILDER ──────────────────────────────────────────────────
// `roles` controls which roles see the nav item. Everyone is signed in;
// the backend still enforces the real access rules.
const ALL_ROLES = ["admin", "rdc", "profiler"];
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "dashboard.html",
    roles: ALL_ROLES,
    icon: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>',
  },
  {
    id: "members",
    label: "Beneficiaries",
    href: "members.html",
    roles: ["admin", "rdc"],
    icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>',
  },
  {
    id: "depots",
    label: "Depots",
    href: "depots.html",
    roles: ALL_ROLES,
    icon: '<svg viewBox="0 0 16 16"><path d="M1.5 6.5L8 2l6.5 4.5V14h-13z"/><path d="M5.5 14V9h5v5"/></svg>',
  },
  {
    id: "disburse",
    label: "Disbursement",
    href: "disburse.html",
    roles: ["admin"],
    icon: '<svg viewBox="0 0 16 16"><rect x="1.5" y="4" width="13" height="8" rx="1.5"/><circle cx="8" cy="8" r="1.9"/><path d="M4 6.2v3.6M12 6.2v3.6"/></svg>',
  },
  {
    id: "repayments",
    label: "Repayments",
    href: "repayments.html",
    roles: ["admin", "rdc"],
    icon: '<svg viewBox="0 0 16 16"><path d="M8 1v14M4.5 4.5h5a2.2 2.2 0 010 4.4H5.5"/></svg>',
  },
  {
    id: "reports",
    label: "Reports",
    href: "reports.html",
    roles: ["admin", "rdc"],
    icon: '<svg viewBox="0 0 16 16"><path d="M4 1.5h6l3 3V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2a.5.5 0 01.5-.5z"/><path d="M5.5 8h5M5.5 10.5h5M5.5 5.5h3"/></svg>',
  },
  {
    id: "staff",
    label: "Manage Users",
    href: "users.html",
    roles: ["admin"],
    icon: '<svg viewBox="0 0 16 16"><circle cx="5.5" cy="5" r="2.3"/><path d="M1.5 13c0-2.4 1.8-4 4-4s4 1.6 4 4"/><circle cx="11.5" cy="5.5" r="1.8"/><path d="M10 9.2c2 .1 3.4 1.5 3.4 3.8"/></svg>',
  },
  {
    id: "audit",
    label: "Audit Log",
    href: "audit.html",
    roles: ["admin"],
    icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>',
  },
  {
    id: "settings",
    label: "Settings",
    href: "settings.html",
    roles: ALL_ROLES,
    icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.7M8 12.8v1.7M14.5 8h-1.7M3.2 8H1.5M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2M12.6 12.6l-1.2-1.2M4.6 4.6L3.4 3.4"/></svg>',
  },
];

function buildSidebar(active) {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const user = Auth.get();
  const role = accessOf(user).role;

  el.innerHTML = `
    <div class="sb-logo">
      <div class="logo-dots">
        <span style="background:#009c41"></span>
        <span style="background:#b3e6c8"></span>
        <span style="background:#eaf7f0"></span>
      </div>
      <div class="logo-name">Busoga <em>Ghetto</em></div>
    </div>
    <div class="sb-user">
      <div class="sb-avatar">${initials(user?.name || "HK")}</div>
      <div style="flex:1;min-width:0">
        <div class="sb-user-name">${titleCase(user?.name || "Al-Hajj Faruk Kirunda")}</div>
        <div class="sb-user-role">${roleLabel(user)}</div>
      </div>
    </div>
    <div class="sb-nav">
      ${(() => {
        // Section a nav item falls under in the sidebar.
        const sectionOf = (id) =>
          id === "settings" ? "Account" : (id === "staff" || id === "audit") ? "Admin" : "Navigation";
        let out = "", last = null;
        NAV_ITEMS.filter((item) => item.roles.includes(role)).forEach((item) => {
          const sec = sectionOf(item.id);
          if (sec !== last) { out += `<div class="nav-section">${sec}</div>`; last = sec; }
          out += `
        <a href="${item.href}" class="nav-item${active === item.id ? " active" : ""}">
          <div class="nav-icon">${item.icon}</div>
          <span class="nav-label">${item.label}</span>
        </a>`;
        });
        return out;
      })()}
    </div>
    <div class="sb-bottom">
      <div class="sb-bottom-text">Presidential Empowerment Fund<br><strong>Busoga Pilot</strong></div>
      <button class="sb-logout" onclick="logout()">
        <svg viewBox="0 0 16 16"><path d="M10 8H2M7 5l-3 3 3 3"/><path d="M6 3H13a1 1 0 011 1v8a1 1 0 01-1 1H6"/></svg>
        Sign Out
      </button>
    </div>`;
}

function logout() {
  Auth.clear();
  window.location.href = "index.html";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay")?.classList.toggle("show");
}

// ── JUICY FEEDBACK: confetti + chime on a win (register / disburse / repay) ──
function celebrate(opts) {
  opts = opts || {};
  _playSfx();
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) _confetti(opts.count || 90);
}
// Play the custom sound (sounds/celebrate.mp3). It is fetched and decoded once,
// up front, into a Web Audio buffer so playback is INSTANT (in sync with the
// confetti) instead of lagging while an <audio> element decodes on first play.
// Falls back to the synth chime if the file is missing or audio is unavailable.
let _sfxBuffer = null, _sfxLoading = false;
function _ensureSfx() {
  if (_sfxBuffer || _sfxLoading) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  _audioCtx = _audioCtx || new AC();
  _sfxLoading = true;
  fetch("sounds/celebrate.mp3")
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject())
    .then(b => _audioCtx.decodeAudioData(b))
    .then(buf => { _sfxBuffer = buf; })
    .catch(() => {})
    .finally(() => { _sfxLoading = false; });
}
// Warm up audio on the first user gesture (decode the file, unlock the context),
// so the very first win already has the sound ready with no delay.
function _warmSfx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { _audioCtx = _audioCtx || new AC(); if (_audioCtx.state === "suspended") _audioCtx.resume(); }
    _ensureSfx();
  } catch (e) {}
}
if (typeof document !== "undefined") {
  ["pointerdown", "keydown", "touchstart"].forEach(ev =>
    document.addEventListener(ev, _warmSfx, { once: true, passive: true }));
}
function _playSfx() {
  try {
    if (_audioCtx && _sfxBuffer) {
      if (_audioCtx.state === "suspended") _audioCtx.resume();
      const src = _audioCtx.createBufferSource();
      src.buffer = _sfxBuffer;
      const g = _audioCtx.createGain();
      g.gain.value = 0.8;
      src.connect(g); g.connect(_audioCtx.destination);
      src.start(0);
      return;
    }
    _ensureSfx(); // not decoded yet - load for next time; chime now so there's feedback
    _chime();
  } catch (e) {
    try { _chime(); } catch (e2) {}
  }
}
let _audioCtx;
function _chime() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  _audioCtx = _audioCtx || new AC();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  const ctx = _audioCtx, now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { // C5 E5 G5 C6 arpeggio
    const o = ctx.createOscillator(), g = ctx.createGain(), t = now + i * 0.085;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.38);
  });
}
function _confetti(count) {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ["#0a7a3a", "#13b257", "#b3e6c8", "#e0a800", "#ffffff", "#16271d"];
  const cx = innerWidth / 2, cy = innerHeight * 0.32, parts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
    parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
      g: 0.18 + Math.random() * 0.12, s: 5 + Math.random() * 6, rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length] });
  }
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = Math.max(0, 1 - t / 1600);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    if (t < 1600) requestAnimationFrame(frame); else cv.remove();
  })(start);
}

// ── HELPERS ──────────────────────────────────────────────────────────
function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
// Request a small, web-optimised version of a Cloudinary photo instead of the
// full 600x600 upload. Cuts list/grid image bytes massively (faster loading).
function imgThumb(url, size) {
  if (!url || url.indexOf("/upload/") === -1) return url;
  return url.replace("/upload/", `/upload/c_fill,g_face,w_${size},h_${size},f_auto,q_auto/`);
}
// ── LEADER CROWNS & FRAMES ───────────────────────────────────────────
// Commanders get a crown, deputies a star; district leaders gold, depot green.
// District role outranks depot role on the badge/frame.
const _CROWN_SVG = '<svg viewBox="0 0 24 24"><path d="M4 18.5h16l1.3-9.2-5 3.7L12 5l-4.3 8-5-3.7z"/></svg>';
const _STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.6 5.9 20.7l1.5-6.7L2.3 9.4l6.8-.7z"/></svg>';
function leaderRank(m) {
  const role = (m && (m.district_role || m.depot_role)) || "";
  if (!role) return null;
  const icon = /Deputy/.test(role) ? "star" : (/Commander/.test(role) ? "crown" : "ring");
  return { tier: m.district_role ? "gold" : "green", icon };
}
function leaderRingClass(m) { const r = leaderRank(m); return r ? "av-ring-" + r.tier : ""; }
function leaderBadge(m) {
  const r = leaderRank(m);
  if (!r || r.icon === "ring") return "";
  return `<span class="av-badge av-badge-${r.tier}">${r.icon === "crown" ? _CROWN_SVG : _STAR_SVG}</span>`;
}
// When the role/tier is already known (e.g. a leadership panel slot).
function leaderBadgeFor(role, tier) {
  const icon = /Deputy/.test(role) ? "star" : (/Commander/.test(role) ? "crown" : "ring");
  if (icon === "ring") return "";
  return `<span class="av-badge av-badge-${tier}">${icon === "crown" ? _CROWN_SVG : _STAR_SVG}</span>`;
}
function formatDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-UG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}
function formatDateShort(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-UG", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
}
function fmt(n) {
  return Number(n || 0).toLocaleString("en-UG");
}
// Display a name in Title Case regardless of how it was stored (WAMBI SALIMA -> Wambi Salima).
function titleCase(s) {
  return String(s || "").toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}
// Whole number -> English words (for the loan agreement amount in words)
function numberToWords(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function under1000(n) {
    let s = "";
    if (n >= 100) { s += ones[Math.floor(n / 100)] + " Hundred"; n %= 100; if (n) s += " "; }
    if (n >= 20) { s += tens[Math.floor(n / 10)]; n %= 10; if (n) s += " " + ones[n]; }
    else if (n > 0) { s += ones[n]; }
    return s;
  }
  const scales = [["Billion", 1e9], ["Million", 1e6], ["Thousand", 1e3]];
  let words = "";
  for (const [label, value] of scales) {
    if (num >= value) {
      words += under1000(Math.floor(num / value)) + " " + label + " ";
      num %= value;
    }
  }
  if (num > 0) words += under1000(num);
  return words.trim();
}
function statusPill(s) {
  const m = {
    Active: "pill-green",
    Inactive: "pill-gray",
    Suspended: "pill-red",
  };
  return `<span class="pill ${m[s] || "pill-gray"}">${s}</span>`;
}
// Disbursement state: a profiled member who has not yet received funds is "Pending".
function isDisbursed(m) {
  return Number(m && m.amount ? m.amount : 0) > 0;
}
function disbursementPill(m) {
  return isDisbursed(m)
    ? `<span class="pill pill-green">Disbursed</span>`
    : `<span class="pill pill-amber">Pending</span>`;
}
const DEPOT_LEADERSHIP = [
  {
    id: "wakitaka",
    depot: "Wakitaka Depot",
    district: "Jinja City",
    village: "Wakitaka",
    leaders: [
      { role: "Chairperson", name: "Aisha Nakato" },
      { role: "Vice Chairperson", name: "Samuel Kintu" },
      { role: "Treasurer", name: "Mary Nansubuga" },
      { role: "Secretary", name: "Peter Ssembatya" },
      { role: "Publicity", name: "Susan Namazzi" },
    ],
  },
  {
    id: "bugembe",
    depot: "Bugembe Depot",
    district: "Jinja District",
    village: "Bugembe",
    leaders: [
      { role: "Chairperson", name: "Emmanuel Musoke" },
      { role: "Vice Chairperson", name: "Jane Akena" },
      { role: "Treasurer", name: "Michael Kato" },
      { role: "Secretary", name: "Florence Namukasa" },
      { role: "Publicity", name: "Denis Kasaija" },
    ],
  },
  {
    id: "iringa",
    depot: "Iringa Depot",
    district: "Iganga",
    village: "Iringa",
    leaders: [
      { role: "Chairperson", name: "Hassan Ssemanda" },
      { role: "Vice Chairperson", name: "Rehema Nampijja" },
      { role: "Treasurer", name: "Ali Kiiza" },
      { role: "Secretary", name: "Grace Sebuliba" },
      { role: "Publicity", name: "Judith Namayi" },
    ],
  },
  {
    id: "kaliro-town",
    depot: "Kaliro Town Depot",
    district: "Kaliro",
    village: "Kaliro",
    leaders: [
      { role: "Chairperson", name: "Patrick Okello" },
      { role: "Vice Chairperson", name: "Esther Kyomukama" },
      { role: "Treasurer", name: "Brian Ssempala" },
      { role: "Secretary", name: "Joyce Kyazze" },
      { role: "Publicity", name: "Wilson Mugabi" },
    ],
  },
  {
    id: "luuka-central",
    depot: "Luuka Central Depot",
    district: "Luuka",
    village: "Luuka",
    leaders: [
      { role: "Chairperson", name: "Mercy Babirye" },
      { role: "Vice Chairperson", name: "Fredrick Muwanguzi" },
      { role: "Treasurer", name: "Ruth Nanyonga" },
      { role: "Secretary", name: "Brian Turyamubiri" },
      { role: "Publicity", name: "Amina Kaggwa" },
    ],
  },
  {
    id: "mayuge-plains",
    depot: "Mayuge Plains Depot",
    district: "Mayuge",
    village: "Mayuge",
    leaders: [
      { role: "Chairperson", name: "John Kato" },
      { role: "Vice Chairperson", name: "Sarah Musoke" },
      { role: "Treasurer", name: "Davina Nabulya" },
      { role: "Secretary", name: "Isaac Kato" },
      { role: "Publicity", name: "Patricia Nansubuga" },
    ],
  },
  {
    id: "namayingo-hub",
    depot: "Namayingo Hub Depot",
    district: "Namayingo",
    village: "Namayingo",
    leaders: [
      { role: "Chairperson", name: "Christine Nabulondo" },
      { role: "Vice Chairperson", name: "Steven Muwanga" },
      { role: "Treasurer", name: "Lydia Nantongo" },
      { role: "Secretary", name: "Robert Ssembatya" },
      { role: "Publicity", name: "Falvia Nankya" },
    ],
  },
  {
    id: "bugiri-bridge",
    depot: "Bugiri Bridge Depot",
    district: "Bugiri",
    village: "Bugiri",
    leaders: [
      { role: "Chairperson", name: "Eunice Asiimwe" },
      { role: "Vice Chairperson", name: "Moses Wamala" },
      { role: "Treasurer", name: "Anna Nakabiri" },
      { role: "Secretary", name: "David Mubiru" },
      { role: "Publicity", name: "Sheila Namyalo" },
    ],
  },
  {
    id: "bugweri-hub",
    depot: "Bugweri Hub Depot",
    district: "Bugweri",
    village: "Bugweri",
    leaders: [
      { role: "Chairperson", name: "Charles Musoke" },
      { role: "Vice Chairperson", name: "Agnes Nakato" },
      { role: "Treasurer", name: "Nicholas Ssebunya" },
      { role: "Secretary", name: "Esther Namisango" },
      { role: "Publicity", name: "Lilian Namusisi" },
    ],
  },
  {
    id: "namutumba-junction",
    depot: "Namutumba Junction Depot",
    district: "Namutumba",
    village: "Namutumba",
    leaders: [
      { role: "Chairperson", name: "Josephine Mbabazi" },
      { role: "Vice Chairperson", name: "Tom Ssewanyana" },
      { role: "Treasurer", name: "Martha Katungi" },
      { role: "Secretary", name: "Mark Kato" },
      { role: "Publicity", name: "Grace Nambassa" },
    ],
  },
  {
    id: "kamuli-market",
    depot: "Kamuli Market Depot",
    district: "Kamuli",
    village: "Kamuli",
    leaders: [
      { role: "Chairperson", name: "Bernard Ssekitoleko" },
      { role: "Vice Chairperson", name: "Dorothy Nanyonga" },
      { role: "Treasurer", name: "Simon Kyeyune" },
      { role: "Secretary", name: "Emily Nakato" },
      { role: "Publicity", name: "Florence Kaggwa" },
    ],
  },
  {
    id: "buyende-hill",
    depot: "Buyende Hill Depot",
    district: "Buyende",
    village: "Buyende",
    leaders: [
      { role: "Chairperson", name: "Fred Mutebi" },
      { role: "Vice Chairperson", name: "Sarah Nankabirwa" },
      { role: "Treasurer", name: "Patrick Nakirya" },
      { role: "Secretary", name: "Alice Namirembe" },
      { role: "Publicity", name: "Michael Akena" },
    ],
  },
];

function findDepotLeadership(depotId) {
  return DEPOT_LEADERSHIP.find((d) => d.id === depotId);
}

function openDepotModal(depotId) {
  const depot = findDepotLeadership(depotId);
  if (!depot) {
    showToast("Depot leadership profile not found", "error");
    return;
  }

  const content = `
    <div class="modal-head">
      <div>
        <div class="modal-title">${depot.depot}</div>
        <div style="font-size:.82rem;font-weight:600;color:var(--muted);margin-top:4px">${depot.district} • ${depot.village}</div>
      </div>
      <button class="modal-close" onclick="closeModal('depotModal')">✕</button>
    </div>
    <div class="modal-body">
      <div class="info-banner" style="margin-bottom:18px">
        These five roles are the depot leadership core team. They are selected from village-level representatives and form the base for parish, subcounty, and district leadership.
      </div>
      ${depot.leaders
        .map(
          (l) => `
        <div class="info-row">
          <div class="info-key">${l.role}</div>
          <div class="info-val">${l.name}</div>
        </div>
      `,
        )
        .join("")}
      <div class="info-row" style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px">
        <div class="info-key">Structure note</div>
        <div class="info-val" style="font-size:.78rem;color:var(--muted);max-width:320px;line-height:1.5">
          Village leaders feed the depot team. The depot team selects parish representatives, who then choose subcounty delegates, and district leadership is built from depot and parish champions.
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById("depotModal");
  if (!modal) return;
  modal.querySelector(".modal-card").innerHTML = content;
  openModal("depotModal");
}
// ── TOAST ────────────────────────────────────────────────────────────
let _tt;
function showToast(msg, type = "success") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove("show"), 3200);
}

// ── MODAL ────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-bg").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.remove("open");
    });
  });
});
