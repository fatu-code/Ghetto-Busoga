/* ── BGS app.js — Shared JS ─────────────────────────────────────── */

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
const DEPOT_ROLES = ["Chairperson", "Vice Chairperson", "Treasurer", "Secretary", "Publicity"];

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
};

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
  return data;
}

// ── SIDEBAR BUILDER ──────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "dashboard.html",
    icon: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>',
  },
  {
    id: "members",
    label: "Beneficiaries",
    href: "members.html",
    icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>',
  },
  {
    id: "depots",
    label: "Depots",
    href: "depots.html",
    icon: '<svg viewBox="0 0 16 16"><path d="M1.5 6.5L8 2l6.5 4.5V14h-13z"/><path d="M5.5 14V9h5v5"/></svg>',
  },
  {
    id: "repayments",
    label: "Repayments",
    href: "repayments.html",
    icon: '<svg viewBox="0 0 16 16"><path d="M8 1v14M4.5 4.5h5a2.2 2.2 0 010 4.4H5.5"/></svg>',
  },
  {
    id: "reports",
    label: "Reports",
    href: "reports.html",
    icon: '<svg viewBox="0 0 16 16"><path d="M4 1.5h6l3 3V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2a.5.5 0 01.5-.5z"/><path d="M5.5 8h5M5.5 10.5h5M5.5 5.5h3"/></svg>',
  },
];

function buildSidebar(active) {
  const el = document.getElementById("sidebar");
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
      <div class="sb-avatar">${initials(user?.name || "HK")}</div>
      <div style="flex:1;min-width:0">
        <div class="sb-user-name">${user?.name || "Al-Hajj Faruk Kirunda"}</div>
        <div class="sb-user-role">${user?.role === "admin" ? "National Coordinator" : "Staff"}</div>
      </div>
      <div class="sb-online"></div>
    </div>
    <div class="sb-nav">
      ${NAV_ITEMS.map(
        (item) => `
        <a href="${item.href}" class="nav-item${active === item.id ? " active" : ""}">
          <div class="nav-icon">${item.icon}</div>
          <span class="nav-label">${item.label}</span>
        </a>`,
      ).join("")}
    </div>
    <div class="sb-bottom">
      <div class="sb-bottom-text">A programme by<br><strong>State House Uganda</strong></div>
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

// ── HELPERS ──────────────────────────────────────────────────────────
function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function formatDate(d) {
  if (!d) return "—";
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
  if (!d) return "—";
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
