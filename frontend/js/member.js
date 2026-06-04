Auth.require();
buildSidebar('members');

// Role gates what this page can do. Backend enforces the real rules.
const acc = accessOf(Auth.get());

const memberId = new URLSearchParams(window.location.search).get('id');
if (!memberId) location.href = 'members.html';

let member = null;

// Populate edit district
DISTRICTS.forEach(d => {
  const o = document.createElement('option');
  o.value = d.code; o.textContent = d.name;
  document.getElementById('eDistrict').appendChild(o);
});

let repayments = [], totalRepaid = 0;

async function load() {
  try {
    const data = await apiFetch(`/api/members/${memberId}`);
    member = data.member;
    try {
      const rp = await apiFetch(`/api/members/${memberId}/repayments`);
      repayments = rp.repayments || []; totalRepaid = rp.total_repaid || 0;
    } catch { repayments = []; totalRepaid = 0; }
    document.getElementById('profileNameBar').textContent = member.name;
    const disb = isDisbursed(member);
    document.getElementById('topbarActions').innerHTML = `
      ${acc.canDisburse ? `
      <button class="btn ${disb ? '' : 'btn-green'}" onclick="openDisburse()">
        <svg viewBox="0 0 16 16"><path d="M8 1.5v13M4.5 5h5a2.2 2.2 0 010 4.4H5.5"/></svg>
        <span class="mob-hide">${disb ? 'Update Disbursement' : 'Record Disbursement'}</span>
      </button>` : ''}
      ${acc.canWrite ? `
      <button class="btn" onclick="openEditModal()">
        <svg viewBox="0 0 16 16"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>
        <span class="mob-hide">Edit</span>
      </button>` : ''}
      <button class="btn" onclick="printAgreement()">
        <svg viewBox="0 0 16 16"><path d="M4 1.5h6l3 3V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2a.5.5 0 01.5-.5z"/><path d="M9.5 1.5V5h3.5M5.5 8h5M5.5 10.5h5"/></svg>
        <span class="mob-hide">Loan Agreement</span>
      </button>
      <button class="btn ${disb ? 'btn-green' : ''}" onclick="exportCard()">
        <svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12M5 9.5h3"/></svg>
        <span class="mob-hide">Export Card</span>
      </button>`;
    renderProfile();
  } catch(e) {
    document.getElementById('profileContent').innerHTML =
      `<div class="empty-state"><div class="empty-title">Beneficiary not found</div></div>`;
  }
}

function renderProfile() {
  const m = member;
  document.getElementById('profileContent').innerHTML = `
    <div class="member-hero">
      <div class="member-hero-top">
        <div class="member-photo">
          ${m.photo_url ? `<img src="${m.photo_url}" alt="${m.name}">` : initials(m.name)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">
            ${statusPill(m.status)}
            ${disbursementPill(m)}
            ${m.depot_role ? `<span class="pill" style="background:#eef2ff;color:#4338ca;border-color:#c7d2fe">${m.depot_role}</span>` : ''}
            ${m.gender ? `<span class="pill pill-gray">${m.gender}</span>` : ''}
          </div>
          <div class="member-name">${m.name}</div>
          <div class="member-id-tag">${m.id}</div>
          <div class="member-meta-row">
            <div class="member-meta-item"><strong>District:</strong> ${m.district_name}</div>
            <div class="member-meta-item"><strong>Depot:</strong> ${m.depot}</div>
            ${m.village ? `<div class="member-meta-item"><strong>Village:</strong> ${m.village}</div>` : ''}
            ${m.phone   ? `<div class="member-meta-item"><strong>Phone:</strong> ${m.phone}</div>`   : ''}
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-val">${isDisbursed(m) ? 'UGX ' + fmt(m.amount) : 'Pending'}</div>
          <div class="hero-stat-lbl">Amount Received</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val">${formatDate(m.disbursement_date)}</div>
          <div class="hero-stat-lbl">Disbursement Date</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val">${formatDate(m.created_at)}</div>
          <div class="hero-stat-lbl">Date Registered</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('profile',this)">
        <svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>
        Profile
      </button>
      <button class="tab" onclick="showTab('qr',this)">
        <svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="11" y="11" width="1" height="1"/><rect x="13" y="11" width="2" height="1"/><rect x="11" y="13" width="4" height="2"/></svg>
        QR Code & Verification
      </button>
    </div>

    <div class="tab-content active" id="tab-profile">
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><span class="card-title">Personal Information</span><button class="card-action" onclick="openEditModal()">Edit</button></div>
          ${infoRows([
            ['Full Name',    m.name],
            ['Serial No.',   m.id],
            ['NIN',          m.nin || '-'],
            ['Phone',        m.phone || '-'],
            ['Gender',       m.gender || '-'],
            ['Village',      m.village || '-'],
            ['Status',       statusPill(m.status)],
          ])}
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">Disbursement Details</span></div>
          ${infoRows([
            ['District',          m.district_name],
            ['Sub-County',        m.sub_county || '-'],
            ['Parish',            m.parish || '-'],
            ['Depot',             m.depot],
            ['Amount Received',   isDisbursed(m) ? `<strong style="color:var(--green)">UGX ${fmt(m.amount)}</strong>` : '<strong style="color:#b06a00">Pending (not yet disbursed)</strong>'],
            ['Disbursement Date', formatDate(m.disbursement_date)],
            ['Registered On',     formatDate(m.created_at)],
          ])}
          ${m.notes ? `<div style="margin-top:12px;padding:11px 13px;background:var(--bg);border-radius:var(--radius-sm);font-family:var(--font2);font-size:.75rem;font-weight:600;color:var(--text);line-height:1.6">${m.notes}</div>` : ''}
        </div>
      </div>
      ${isDisbursed(m) ? loanCard() : ''}
    </div>

    <div class="tab-content" id="tab-qr">
      <div class="grid-2">
        <div class="qr-card">
          <div>
            <div style="font-family:var(--font2);font-size:.62rem;font-weight:800;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Verification QR Code</div>
            <div class="qr-id">${m.id}</div>
          </div>
          <div class="qr-wrap"><img src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&qzone=1&data=${encodeURIComponent(verifyUrl(m.id))}" alt="QR Code for ${m.id}"></div>
          <div class="qr-label">Scan this code to verify that <strong style="color:rgba(255,255,255,.7)">${m.name}</strong> is a registered beneficiary of the Busoga Ghetto Presidential Empowerment Fund.</div>
          <button class="print-btn" onclick="exportCard()">
            <svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12M5 9.5h3"/></svg>
            Export Beneficiary Card
          </button>
        </div>
        <div class="col-stack">
          <div class="card">
            <div class="card-head"><span class="card-title">How to use this QR code</span></div>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${[
                ['1', 'Show this QR code to anyone who questions the disbursement'],
                ['2', 'They scan it with any phone camera'],
                ['3', 'It opens a public verification page showing this beneficiary\'s record'],
                ['4', 'The page shows: photo, name, depot, amount received, date'],
                ['5', 'No login needed, valid proof for anyone, anywhere'],
              ].map(([n, t]) => `
                <div style="display:flex;align-items:flex-start;gap:10px">
                  <div style="width:22px;height:22px;border-radius:50%;background:var(--green-pale);border:1.5px solid var(--green-mid);display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:.72rem;font-weight:700;color:var(--green-dark);flex-shrink:0">${n}</div>
                  <div style="font-family:var(--font2);font-size:.78rem;font-weight:600;color:var(--text);line-height:1.5;padding-top:2px">${t}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">Direct verification link</span></div>
            <div style="font-family:var(--font2);font-size:.72rem;font-weight:600;color:var(--muted);margin-bottom:8px;line-height:1.6">Share this link directly. It opens the public verification page:</div>
            <div style="background:var(--bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px 13px;font-family:monospace;font-size:.72rem;color:var(--green);word-break:break-all;margin-bottom:10px" id="verifyLink"></div>
            <button class="btn btn-sm" onclick="copyLink()">
              <svg viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/></svg>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // Set verify link
  const link = verifyUrl(m.id);
  const linkEl = document.getElementById('verifyLink');
  if (linkEl) linkEl.textContent = link;
}

function infoRows(rows) {
  return `<div>${rows.map(([k,v]) => `
    <div class="info-row">
      <span class="info-key">${k}</span>
      <span class="info-val">${v || '-'}</span>
    </div>`).join('')}</div>`;
}

function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id)?.classList.add('active');
  if (btn) btn.classList.add('active');
}

function copyLink() {
  const link = verifyUrl(memberId);
  navigator.clipboard.writeText(link).then(() => showToast('Link copied!'));
}

// Live thousands separators in money inputs (so 400000 shows as 400,000)
function fmtMoney(el) {
  const digits = el.value.replace(/[^\d]/g, '');
  el.value = digits ? Number(digits).toLocaleString('en-US') : '';
}

// ── RECORD DISBURSEMENT ────────────────────────────────────────────
// Money is only ever entered here, on an already-profiled depot member.
function openDisburse() {
  const m = member;
  document.getElementById('dAmount').value = Number(m.amount) > 0 ? Number(m.amount).toLocaleString('en-US') : '';
  document.getElementById('dDate').value = m.disbursement_date
    ? m.disbursement_date.split('T')[0]
    : new Date().toISOString().split('T')[0];
  openModal('disburseModal');
}

async function saveDisbursement() {
  const amount = document.getElementById('dAmount').value.replace(/,/g, '');
  const date   = document.getElementById('dDate').value;
  if (!amount || Number(amount) <= 0) {
    showToast('Enter the amount received', 'error');
    return;
  }
  const btn = document.getElementById('dSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Saving...';
  try {
    const fd = new FormData();
    fd.append('amount', amount);
    fd.append('disbursement_date', date || '');
    const data = await apiFetch(`/api/members/${memberId}`, { method: 'PUT', body: fd });
    member = data.member;
    closeModal('disburseModal');
    showToast('Disbursement recorded');
    load(); // refresh profile + topbar button state
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M2 8l4 4 8-8"/></svg>Save Disbursement';
  }
}

// ── LOAN & REPAYMENT ───────────────────────────────────────────────
// Loan = principal + 6%, repayable within 12 months of disbursement.
function dueDate(d) {
  if (!d) return null;
  const x = new Date(d);
  if (isNaN(x)) return null;
  x.setMonth(x.getMonth() + 12);
  return x;
}
function loanSummary() {
  const principal   = Number(member.amount) || 0;
  const interest    = Math.round(principal * 0.06);
  const totalDue    = principal + interest;
  const repaid      = totalRepaid;
  const outstanding = Math.max(0, totalDue - repaid);
  const due         = dueDate(member.disbursement_date);
  const cleared     = totalDue > 0 && outstanding <= 0;
  const overdue     = !cleared && due && new Date() > due;
  const pct         = totalDue ? Math.min(100, Math.round((repaid / totalDue) * 100)) : 0;
  const status      = cleared ? 'Cleared' : overdue ? 'Overdue' : 'Repaying';
  return { principal, interest, totalDue, repaid, outstanding, due, cleared, overdue, pct, status };
}
function loanCard() {
  const s = loanSummary();
  const pillCss = s.cleared ? 'background:#eaf7f0;color:#007a33;border-color:#b3e6c8'
    : s.overdue ? 'background:#fdecec;color:#c0392b;border-color:#f5b7b1'
    : 'background:#fff5e6;color:#b06a00;border-color:#ffd699';
  const history = repayments.map(r =>
    `<div class="rp-row"><span>${formatDate(r.paid_on)}</span><span>UGX ${fmt(r.amount)}</span></div>`).join('')
    || '<div class="rp-empty">No repayments recorded yet.</div>';
  return `
    <div class="card" style="margin-top:14px">
      <div class="card-head">
        <span class="card-title">Loan &amp; Repayment</span>
        <span class="pill" style="${pillCss}">${s.status}</span>
      </div>
      <div class="loan-grid">
        <div class="lg"><div class="lg-l">Principal</div><div class="lg-v">UGX ${fmt(s.principal)}</div></div>
        <div class="lg"><div class="lg-l">Interest (6%)</div><div class="lg-v">UGX ${fmt(s.interest)}</div></div>
        <div class="lg"><div class="lg-l">Total Due</div><div class="lg-v">UGX ${fmt(s.totalDue)}</div></div>
        <div class="lg"><div class="lg-l">Repaid</div><div class="lg-v" style="color:var(--green)">UGX ${fmt(s.repaid)}</div></div>
        <div class="lg"><div class="lg-l">Outstanding</div><div class="lg-v" style="color:${s.cleared ? 'var(--green)' : '#c0392b'}">UGX ${fmt(s.outstanding)}</div></div>
        <div class="lg"><div class="lg-l">Due Date</div><div class="lg-v">${s.due ? formatDate(s.due) : '-'}</div></div>
      </div>
      <div class="loan-bar"><div class="loan-bar-fill" style="width:${s.pct}%"></div></div>
      <div class="loan-bar-lbl">${s.pct}% repaid</div>
      ${acc.canDisburse ? `<button class="btn btn-green" style="margin-top:14px" onclick="openRepay()">
        <svg viewBox="0 0 16 16"><path d="M8 1.5v13M4.5 5h5a2.2 2.2 0 010 4.4H5.5"/></svg> Record Repayment
      </button>` : ''}
      <div class="rp-head">Repayment history</div>
      <div class="rp-list">${history}</div>
    </div>`;
}
function openRepay() {
  const s = loanSummary();
  document.getElementById('repayInfo').innerHTML =
    `Outstanding balance: <strong>UGX ${fmt(s.outstanding)}</strong> of UGX ${fmt(s.totalDue)} total due.`;
  document.getElementById('rAmount').value = '';
  document.getElementById('rDate').value = new Date().toISOString().split('T')[0];
  openModal('repayModal');
}
async function saveRepayment() {
  const amount = document.getElementById('rAmount').value.replace(/,/g, '');
  const date   = document.getElementById('rDate').value;
  if (!amount || Number(amount) <= 0) { showToast('Enter the amount repaid', 'error'); return; }
  const btn = document.getElementById('rSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Saving...';
  try {
    const data = await apiFetch(`/api/members/${memberId}/repayments`, {
      method: 'POST', body: { amount: Number(amount), paid_on: date || null },
    });
    repayments = data.repayments || [];
    totalRepaid = data.total_repaid || 0;
    closeModal('repayModal');
    showToast('Repayment recorded');
    renderProfile();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M2 8l4 4 8-8"/></svg>Save Repayment';
  }
}

// Clean beneficiary card (export / give to the user). QR is generated live
// from the public verify link, so it works for every beneficiary.
// Authorising officer per district (the official who signs the card).
const DISTRICT_OFFICERS = {
  JJA: 'Waiswa Geoffrey',  JJD: 'Balidawa Samuel',   IGA: 'Isabirye Moses',
  KLR: 'Kawanguzi David',  LUK: 'Tenywa Patrick',    MYG: 'Muganza Henry',
  NMY: 'Wandera Joseph',   BGR: 'Kintu Wilberforce', BGW: 'Babirye Sarah',
  NMT: 'Mutyaba Charles',  KML: 'Bagonza Stephen',   BYD: 'Kagoda Andrew',
};
// "BALULOBA NATHAN" -> "Baluloba Nathan" (first letter of each word capital, rest small)
function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

// Full A4 beneficiary profile sheet (the document we print and give out).
// QR is generated live from the verify link, so it works for everyone.
function exportCard() {
  const m      = member;
  const link   = verifyUrl(m.id);
  const qr     = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&qzone=1&data=${encodeURIComponent(link)}`;
  const emblem = `${window.location.origin}/images/coat-of-arms.png`;
  const issued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const na     = '-';
  const ls     = isDisbursed(m) ? loanSummary() : null;

  // Loan agreement details (appended as pages 2 and 3 of the export)
  const ad = m.disbursement_date ? new Date(m.disbursement_date) : new Date();
  const aday = ad.getDate();
  const aord = (aday % 10 === 1 && aday !== 11) ? 'st' : (aday % 10 === 2 && aday !== 12) ? 'nd' : (aday % 10 === 3 && aday !== 13) ? 'rd' : 'th';
  const amonth = ad.toLocaleDateString('en-UG', { month: 'long' });
  const ayear = ad.getFullYear();
  const amountWords = numberToWords(m.amount) + ' Shillings Only';
  const amountFigures = fmt(m.amount);
  const fill = (v) => `<span class="val">${(v === null || v === undefined || v === '') ? '-' : v}</span>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Beneficiary Profile ${m.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Varela+Round&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @page{size:A4;margin:0}
    body{font-family:'Nunito',sans-serif;color:#1c3326;background:#e9efeb;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .sheet{width:210mm;min-height:286mm;margin:0 auto;background:#fff;display:flex;flex-direction:column}

    .hd{background:linear-gradient(125deg,#16271d 0%,#0c4a2b 55%,#0a7a3a 100%);color:#fff;padding:14mm 16mm 12mm;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden}
    .hd::after{content:"";position:absolute;right:-60px;top:-90px;width:340px;height:340px;border-radius:50%;background:rgba(255,255,255,.05)}
    .hd .emblem{width:60px;height:60px;object-fit:contain;position:relative;flex-shrink:0}
    .hd .ht{position:relative;flex:1}
    .hd .prog{font-family:'Varela Round',sans-serif;font-size:22px;line-height:1.14;letter-spacing:.01em}
    .hd .off{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.2em;color:rgba(255,255,255,.66);margin-top:8px}

    .titlebar{display:flex;justify-content:space-between;align-items:center;padding:9mm 16mm 0}
    .titlebar .t{font-family:'Varela Round',sans-serif;font-size:14px;color:#0a7a3a;text-transform:uppercase;letter-spacing:.16em}
    .titlebar .serial{font-family:'Varela Round',sans-serif;font-size:14px;color:#142a1d;background:#eaf7f0;border:1.5px solid #b3e6c8;border-radius:8px;padding:6px 14px;letter-spacing:.05em}

    .body{padding:7mm 16mm 0;flex:1}
    .idrow{display:flex;gap:20px;align-items:center;padding:6px 0 18px;border-bottom:2px solid #eef2f0}
    .photo,.ph{width:118px;height:118px;border-radius:16px;flex-shrink:0}
    .photo{object-fit:cover}
    .ph{background:#eaf7f0;display:flex;align-items:center;justify-content:center;font-family:'Varela Round',sans-serif;font-size:42px;color:#009c41}
    .idmain{flex:1;min-width:0}
    .nm{font-family:'Varela Round',sans-serif;font-size:27px;line-height:1.08;color:#142a1d}
    .sid{font-family:'Varela Round',sans-serif;font-size:14px;color:#009c41;letter-spacing:.05em;margin-top:5px}
    .pillz{margin-top:10px;display:flex;gap:8px}
    .pill{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;padding:5px 12px;border-radius:100px}
    .pill.ok{background:#eaf7f0;color:#007a33;border:1px solid #b3e6c8}
    .pill.g{background:#eef1f3;color:#5b6b62;border:1px solid #dde3df}
    .qrb{text-align:center;flex-shrink:0}
    .qrb .qbx{background:#fff;border:1.5px solid #dde8e2;border-radius:12px;padding:7px}
    .qrb img{width:104px;height:104px;display:block}
    .qrb .cap{font-size:9px;font-weight:800;color:#7a8e83;text-transform:uppercase;letter-spacing:.09em;margin-top:6px}

    .sec{margin-top:18px}
    .sec h3{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:#0a7a3a;margin-bottom:4px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
    .f{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid #eef2f0;font-size:13px}
    .f .k{font-weight:700;color:#7a8e83}
    .f .v{font-weight:800;color:#1c3326;text-align:right}

    .amtbox{margin-top:18px;background:#f4f9f6;border:1.5px solid #d8ece1;border-radius:14px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center}
    .amtbox .l{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#5b6b62}
    .amtbox .l span{display:block;font-size:11px;font-weight:700;text-transform:none;letter-spacing:0;color:#9aa8a0;margin-top:5px}
    .amtbox .val{font-family:'Varela Round',sans-serif;font-size:26px;color:#009c41}

    .note{margin-top:18px;font-size:11.5px;line-height:1.75;color:#5b6b62;background:#fbfdfc;border:1px solid #eef2f0;border-radius:10px;padding:16px 18px}
    .note b{color:#1c3326}

    .sign{display:flex;gap:44px;margin-top:30px}
    .sig{flex:1;text-align:center}
    .sig .line{border-bottom:1.4px solid #b9c7bf;height:44px}
    .sig .nm2{font-family:'Varela Round',sans-serif;font-size:13px;color:#1c3326;padding-top:6px;line-height:1.2}
    .sig .lbl{font-size:10.5px;font-weight:700;color:#7a8e83;text-transform:uppercase;letter-spacing:.07em;margin-top:4px}

    .ft{margin-top:auto;padding:7mm 16mm 9mm;border-top:1.5px solid #eef2f0;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;font-size:10px;color:#9aa8a0;font-weight:700}
    .ft .vurl{color:#009c41;word-break:break-all}
    .ft .r{text-align:right;flex-shrink:0}

    /* Loan agreement pages, premium spacious layout matching the page-1 card */
    .agr{page-break-before:always;color:#26392f}
    .agr .page{width:210mm;min-height:289mm;margin:0 auto;background:#fff;position:relative;display:flex;flex-direction:column}
    .agr .page + .page{page-break-before:always}
    .agr .ahead{background:linear-gradient(125deg,#16271d 0%,#0c4a2b 55%,#0a7a3a 100%);color:#fff;padding:13mm 18mm 12mm;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden}
    .agr .ahead::after{content:"";position:absolute;right:-50px;top:-80px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.05)}
    .agr .ahead .emblem{width:56px;height:56px;object-fit:contain;position:relative;flex-shrink:0}
    .agr .ahead .ht{position:relative;flex:1}
    .agr .ahead .prog{font-family:'Varela Round',sans-serif;font-size:20px;line-height:1.18}
    .agr .ahead .doc{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.26em;color:rgba(255,255,255,.65);margin-top:9px}
    .agr .abody{padding:12mm 18mm 0;flex:1;font-size:11.6px;line-height:1.8}
    .agr .val{color:#0a7a3a;font-weight:800}
    .agr .intro{color:#6a7c72;font-weight:600}
    .agr .party{margin:0}
    .agr .between{font-family:'Varela Round',sans-serif;font-size:11px;color:#0a7a3a;text-transform:uppercase;letter-spacing:.32em;margin:21px 0 12px;display:flex;align-items:center;gap:18px}
    .agr .between::before,.agr .between::after{content:"";height:1.5px;background:#e3ece7;flex:1}
    .agr .clause{margin-top:22px}
    .agr .ch{font-family:'Varela Round',sans-serif;font-size:15px;color:#142a1d;display:flex;align-items:baseline;gap:12px;margin-bottom:9px}
    .agr .ch .num{font-size:15px;font-weight:900;color:#0a7a3a;min-width:18px}
    .agr .sub{display:flex;gap:14px;margin-top:11px}
    .agr .sub .n{color:#0a7a3a;font-weight:900;flex-shrink:0;min-width:30px}
    .agr .sub .tx{flex:1}
    .agr .pl{margin-top:9px;padding-left:44px}
    .agr .sig-card{border:1.5px solid #e7efea;border-radius:16px;padding:15px 20px;margin-top:12px}
    .agr .sig-card.w{background:#fafdfb}
    .agr .sig-role{display:flex;align-items:center;font-family:'Varela Round',sans-serif;font-size:13.5px;color:#142a1d;margin-bottom:14px}
    .agr .sig-role .tag{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;font-size:12px;font-weight:900;text-transform:uppercase;color:#0a7a3a;background:#eaf7f0;border:1.5px solid #b3e6c8;border-radius:9px;padding:0 9px;margin-right:13px}
    .agr .sig-grid{display:flex;gap:30px}
    .agr .sig-grid .seg{flex:1}
    .agr .sig-grid .ln{border-bottom:1.5px solid #cdd9d2;height:34px;display:flex;align-items:flex-end;justify-content:center;font-weight:800;color:#142a1d;font-size:12px;padding-bottom:5px}
    .agr .sig-grid .cap{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#7a8e83;margin-top:8px;text-align:center}
    .agr .wsec{font-family:'Varela Round',sans-serif;font-size:11.5px;color:#0a7a3a;text-transform:uppercase;letter-spacing:.18em;margin:20px 0 2px}
    .agr .afoot{margin-top:auto;padding:10mm 18mm 12mm;border-top:1.5px solid #eef2f0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9aa8a0;font-weight:700}
    .agr .afoot .bar{font-family:'Varela Round',sans-serif;color:#0a7a3a;font-size:13px;letter-spacing:.02em}

    @media print{body{background:#fff}.sheet{margin:0}}
  </style></head><body>
  <div class="sheet">
    <div class="hd">
      <img class="emblem" src="${emblem}" alt="" onerror="this.style.display='none'">
      <div class="ht">
        <div class="prog">Busoga Ghetto Presidential Empowerment Fund</div>
        <div class="off">Office of the President, State House Uganda</div>
      </div>
    </div>

    <div class="titlebar">
      <div class="t">Beneficiary Profile</div>
      <div class="serial">Serial No. ${m.id}</div>
    </div>

    <div class="body">
      <div class="idrow">
        ${m.photo_url ? `<img class="photo" src="${m.photo_url}" alt="">` : `<div class="ph">${initials(m.name)}</div>`}
        <div class="idmain">
          <div class="nm">${m.name}</div>
          <div class="sid">${m.id}</div>
          <div class="pillz">
            <span class="pill ok">${m.status || 'Active'}</span>
            ${m.gender ? `<span class="pill g">${m.gender}</span>` : ''}
          </div>
        </div>
        <div class="qrb">
          <div class="qbx"><img src="${qr}" alt="QR code"></div>
          <div class="cap">Scan to verify</div>
        </div>
      </div>

      <div class="sec">
        <h3>Beneficiary Details</h3>
        <div class="grid">
          <div class="f"><span class="k">National ID (NIN)</span><span class="v">${m.nin || na}</span></div>
          <div class="f"><span class="k">Gender</span><span class="v">${m.gender || na}</span></div>
          <div class="f"><span class="k">Phone Number</span><span class="v">${m.phone || na}</span></div>
          <div class="f"><span class="k">Date Registered</span><span class="v">${formatDate(m.created_at)}</span></div>
        </div>
      </div>

      <div class="sec">
        <h3>Location</h3>
        <div class="grid">
          <div class="f"><span class="k">District</span><span class="v">${m.district_name}</span></div>
          <div class="f"><span class="k">Depot (Ghetto Cell)</span><span class="v">${m.depot}</span></div>
          <div class="f"><span class="k">Sub-County</span><span class="v">${m.sub_county || na}</span></div>
          <div class="f"><span class="k">Parish</span><span class="v">${m.parish || na}</span></div>
          <div class="f"><span class="k">Village / Area</span><span class="v">${m.village || na}</span></div>
        </div>
      </div>

      <div class="amtbox">
        <div class="l">Amount Received<span>${isDisbursed(m) ? 'Disbursed on ' + formatDate(m.disbursement_date) : 'Not yet disbursed'}</span></div>
        <div class="val">${isDisbursed(m) ? 'UGX ' + fmt(m.amount) : 'Pending'}</div>
      </div>
      ${ls ? `
      <div style="display:flex;gap:12px;margin-top:16px">
        <div style="flex:1;background:#fbfdfc;border:1px solid #eef2f0;border-radius:10px;padding:14px 14px;text-align:center">
          <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#5b6b62">Total Due (loan + 6%)</div>
          <div style="font-family:'Varela Round',sans-serif;font-size:14px;color:#142a1d;margin-top:3px">UGX ${fmt(ls.totalDue)}</div>
        </div>
        <div style="flex:1;background:#fbfdfc;border:1px solid #eef2f0;border-radius:10px;padding:14px 14px;text-align:center">
          <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#5b6b62">Repaid</div>
          <div style="font-family:'Varela Round',sans-serif;font-size:14px;color:#0a7a3a;margin-top:3px">UGX ${fmt(ls.repaid)}</div>
        </div>
        <div style="flex:1;background:#fbfdfc;border:1px solid #eef2f0;border-radius:10px;padding:14px 14px;text-align:center">
          <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#5b6b62">Outstanding</div>
          <div style="font-family:'Varela Round',sans-serif;font-size:14px;color:${ls.outstanding > 0 ? '#c0392b' : '#0a7a3a'};margin-top:3px">UGX ${fmt(ls.outstanding)}</div>
        </div>
      </div>` : ''}

      <div class="note">
        This document confirms that the above named person is a registered beneficiary of the
        <b>Busoga Ghetto Presidential Empowerment Fund</b>, a Presidential initiative coordinated under the
        Office of the President. The funds are a SACCO loan facility advanced at <b>6% interest per annum</b>,
        repayable within <b>twelve (12) months</b>. Scan the QR code above, or visit the verification link below,
        to confirm this record online at any time.
      </div>

      <div class="sign">
        <div class="sig"><div class="line"></div><div class="nm2">${titleCase(m.name)}</div><div class="lbl">Beneficiary</div></div>
        <div class="sig"><div class="line"></div><div class="nm2">${DISTRICT_OFFICERS[m.district] || 'Authorised Officer'}</div><div class="lbl">Authorising Officer</div></div>
        <div class="sig"><div class="line"></div><div class="nm2">${issued}</div><div class="lbl">Date</div></div>
      </div>
    </div>
  </div>

  <div class="agr">
    <div class="page">
      <div class="ahead">
        <img class="emblem" src="${emblem}" alt="" onerror="this.style.display='none'">
        <div class="ht">
          <div class="prog">Busoga Ghetto Presidential Empowerment Fund</div>
          <div class="doc">Loan Agreement</div>
        </div>
      </div>
      <div class="abody">
        <p class="intro">This Loan Agreement is made this ${fill(aday + aord)} day of ${fill(amonth)}, ${fill(ayear)}</p>

        <div class="between">Between</div>
        <p class="party">${fill(titleCase(m.name))} of ${fill(m.district_name)} District, ${fill(m.sub_county)} Sub-County, ${fill(m.parish)} Parish, ${fill(m.depot)} Ghetto Cell, (hereinafter referred to as the "Borrower," which expression shall, where the context admits, include his/her personal representatives, successors, and assigns)</p>

        <div class="between">And</div>
        <p class="party">The Busoga Ghetto Presidential Empowerment Fund, (hereinafter referred to as the "Lender.")</p>

        <div class="clause">
          <div class="ch"><span class="num">1</span><span>Loan Advance</span></div>
          <div class="sub"><span class="n">1.1</span><span class="tx">The Borrower hereby acknowledges receiving from the Lender a loan in the sum of: ${fill(amountWords)} Uganda Shillings (UGX ${fill(amountFigures)}) (the "Loan Amount"), which the Borrower confirms as accurate.</span></div>
          <div class="sub"><span class="n">1.2</span><span class="tx">The loan shall accrue interest at the rate of six percent (6%) per annum for the entire duration of this Agreement.</span></div>
        </div>

        <div class="clause">
          <div class="ch"><span class="num">2</span><span>Purpose of the Loan</span></div>
          <p class="pl">The Borrower undertakes and agrees that the Loan Amount shall be used strictly for empowerment activities under the Busoga Ghetto Presidential Empowerment Programme.</p>
        </div>

        <div class="clause">
          <div class="ch"><span class="num">3</span><span>Repayment Terms</span></div>
          <div class="sub"><span class="n">3.1</span><span class="tx">The Borrower shall repay the full Loan Amount together with the applicable interest within twelve (12) months from the date of execution of this Agreement.</span></div>
          <div class="sub"><span class="n">3.2</span><span class="tx">All repayments shall be made in accordance with the schedule, mode, and instructions prescribed by the Lender at the time of disbursement.</span></div>
        </div>

        <div class="clause">
          <div class="ch"><span class="num">4</span><span>Acknowledgment of Terms and Conditions</span></div>
          <div class="sub"><span class="n">4.1</span><span class="tx">The Borrower confirms that he/she has carefully read and understood all terms, conditions, obligations, and declarations contained in the Loan Application Form.</span></div>
          <div class="sub"><span class="n">4.2</span><span class="tx">The Borrower affirms that the information provided therein is true, complete, and accurate, and that the said conditions bind the Borrower.</span></div>
        </div>
      </div>
      <div class="afoot"><span class="bar">Together We Can</span><span>Page 1 of 2</span></div>
    </div>

    <div class="page">
      <div class="ahead">
        <img class="emblem" src="${emblem}" alt="" onerror="this.style.display='none'">
        <div class="ht">
          <div class="prog">Busoga Ghetto Presidential Empowerment Fund</div>
          <div class="doc">Loan Agreement</div>
        </div>
      </div>
      <div class="abody">
        <div class="clause">
          <div class="ch"><span class="num">5</span><span>Default and Consequences</span></div>
          <p class="pl">In the event that the Borrower fails, neglects, or refuses to repay the loan in accordance with Clause 3 above, the Borrower acknowledges and agrees that he/she shall be liable to legal action and prosecution in accordance with applicable laws and directives governing the Empowerment Fund.</p>
        </div>

        <div class="clause">
          <div class="ch"><span class="num">6</span><span>Execution and Attestation</span></div>
          <p class="pl">IN WITNESS WHEREOF, the Borrower has executed this Agreement on the date first above written, in the presence of the following witnesses:</p>
        </div>

        <div class="sig-card">
          <div class="sig-role"><span class="tag">A</span>Borrower</div>
          <div class="sig-grid">
            <div class="seg"><div class="ln">${titleCase(m.name)}</div><div class="cap">Name</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Signature</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Date</div></div>
          </div>
        </div>

        <div class="wsec">B. Witnesses</div>

        <div class="sig-card w">
          <div class="sig-role"><span class="tag">1</span>Chairperson, Ghetto Cell</div>
          <div class="sig-grid">
            <div class="seg"><div class="ln"></div><div class="cap">Name</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Signature</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Date</div></div>
          </div>
        </div>

        <div class="sig-card w">
          <div class="sig-role"><span class="tag">2</span>District Ghetto President / Representative</div>
          <div class="sig-grid">
            <div class="seg"><div class="ln"></div><div class="cap">Name</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Signature</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Date</div></div>
          </div>
        </div>

        <div class="sig-card w">
          <div class="sig-role"><span class="tag">3</span>RDC/RCC (Representative of the District/City Security Committee)</div>
          <div class="sig-grid">
            <div class="seg"><div class="ln"></div><div class="cap">Name</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Signature</div></div>
            <div class="seg"><div class="ln"></div><div class="cap">Date</div></div>
          </div>
        </div>
      </div>
      <div class="afoot"><span class="bar">Together We Can</span><span>Page 2 of 2</span></div>
    </div>
  </div>
  ${'<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},450)}</scr' + 'ipt>'}
  </body></html>`;
  // Export only page 1 (the card). Drop the appended loan-agreement pages.
  const cardOnly = html.replace(/<div class="agr">[\s\S]*?(?=<script)/, '');
  const w = window.open('', '_blank');
  w.document.write(cardOnly);
  w.document.close();
}

// ── PRINT LOAN AGREEMENT ───────────────────────────────────────────
// Pre-fills the official 2-page Busoga Ghetto Presidential Empowerment
// Fund loan agreement. "Ghetto Cell" on the form is filled from the depot.
function printAgreement() {
  const m = member;
  const origin = window.location.origin;

  // Date the agreement is "made": use disbursement date, else today
  const d = m.disbursement_date ? new Date(m.disbursement_date) : new Date();
  const day = d.getDate();
  const ord = (day % 10 === 1 && day !== 11) ? 'st'
            : (day % 10 === 2 && day !== 12) ? 'nd'
            : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  const monthName = d.toLocaleDateString('en-UG', { month: 'long' });
  const year = d.getFullYear();

  const amountWords = numberToWords(m.amount) + ' Shillings Only';
  const amountFigures = fmt(m.amount);

  // a filled blank (value sits on an underline); empty -> blank line to hand-write
  const fill  = (v, w = 'auto') => `<span class="fill" style="min-width:${w}">${v || ''}</span>`;

  const html = `<!DOCTYPE html><html><head><title>Loan Agreement - ${m.name} (${m.id})</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Nunito',sans-serif;color:#111;font-size:11.5pt;line-height:1.5}
    .page{width:210mm;min-height:297mm;padding:18mm 20mm;margin:0 auto;background:#fff;position:relative;display:flex;flex-direction:column}
    .page + .page{page-break-before:always}
    .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:8px}
    .emblem{width:64px;height:64px;object-fit:contain;flex-shrink:0}
    .emblem-txt{font-size:7pt;font-weight:700;text-align:center;width:64px;flex-shrink:0;text-transform:uppercase;letter-spacing:.02em;color:#333}
    .head-title{font-size:17pt;font-weight:900;letter-spacing:-.01em;line-height:1.1}
    .head-pill{display:inline-block;background:#111;color:#fff;font-weight:800;font-size:11pt;letter-spacing:.06em;padding:4px 16px;border-radius:100px;margin-top:6px}
    .made{text-align:left;margin:18px 0 6px}
    .center{text-align:center;font-weight:800;margin:10px 0}
    p{margin:7px 0}
    .clause-h{font-weight:900;margin:16px 0 4px}
    .sub{display:flex;gap:10px;margin:5px 0}
    .sub .n{font-weight:800;flex-shrink:0;width:26px}
    .fill{display:inline-block;border-bottom:1px solid #111;padding:0 6px 1px;font-weight:800;text-align:center;min-width:60px}
    .line{display:inline-block;border-bottom:1px dotted #111;min-width:90px;height:1em;vertical-align:bottom}
    .sig-block{margin-top:10px}
    .sig-role{font-weight:800;margin-top:14px;margin-bottom:6px}
    .sig-row{display:flex;gap:26px;margin-top:4px;font-size:10.5pt}
    .sig-row .seg{flex:1}
    .sig-seg-line{border-bottom:1px solid #111;height:18px;margin-top:2px}
    .foot{margin-top:auto;border-top:2px solid #111;padding-top:8px;display:flex;justify-content:space-between;align-items:center;font-weight:900}
    .foot .bar{background:#111;color:#fff;padding:4px 14px;border-radius:4px;font-size:10pt;letter-spacing:.04em}
    .foot .pg{font-weight:800;font-size:10pt}
    @page{size:A4;margin:0}
    @media print{body{background:#fff}.page{margin:0}}
  </style></head><body>

  <div class="page">
    <div class="head">
      <div style="display:flex;flex-direction:column;align-items:center">
        <img class="emblem" src="${origin}/images/coat-of-arms.png" alt="" onerror="this.style.display='none'">
        <div class="emblem-txt">The Republic<br>of Uganda</div>
      </div>
      <div>
        <div class="head-title">BUSOGA GHETTO PRESIDENTIAL<br>EMPOWERMENT FUND</div>
        <div class="head-pill">LOAN AGREEMENT</div>
      </div>
    </div>

    <p class="made">This Loan Agreement is made this ${fill(day + ord, '52px')} day of ${fill(monthName, '110px')}, ${fill(year, '64px')}</p>

    <p class="center">BETWEEN</p>
    <p>${fill(m.name, '230px')} of ${fill(m.district_name, '150px')} District, ${fill(m.sub_county, '140px')} Sub-County, ${fill(m.parish, '140px')} Parish, ${fill(m.depot, '150px')} Ghetto Cell,</p>
    <p>(hereinafter referred to as the "Borrower," which expression shall, where the context admits, include his/her personal representatives, successors, and assigns)</p>

    <p class="center">AND</p>
    <p>The Busoga Ghetto Presidential Empowerment Fund, (hereinafter referred to as the "Lender.")</p>

    <p class="clause-h">1. Loan Advance</p>
    <div class="sub"><span class="n">1.1</span><span>The Borrower hereby acknowledges receiving from the Lender a loan in the sum of: ${fill(amountWords, '200px')} Uganda Shillings (UGX ${fill(amountFigures, '120px')}) (the "Loan Amount"), which the Borrower confirms as accurate.</span></div>
    <div class="sub"><span class="n">1.2</span><span>The loan shall accrue interest at the rate of six percent (6%) per annum for the entire duration of this Agreement.</span></div>

    <p class="clause-h">2. Purpose of the Loan</p>
    <p>The Borrower undertakes and agrees that the Loan Amount shall be used strictly for empowerment activities under the Busoga Ghetto Presidential Empowerment Programme.</p>

    <p class="clause-h">3. Repayment Terms</p>
    <div class="sub"><span class="n">3.1</span><span>The Borrower shall repay the full Loan Amount together with the applicable interest within twelve (12) months from the date of execution of this Agreement.</span></div>
    <div class="sub"><span class="n">3.2</span><span>All repayments shall be made in accordance with the schedule, mode, and instructions prescribed by the Lender at the time of disbursement.</span></div>

    <p class="clause-h">4. Acknowledgment of Terms and Conditions</p>
    <div class="sub"><span class="n">4.1</span><span>The Borrower confirms that he/she has carefully read and understood all terms, conditions, obligations, and declarations contained in the Loan Application Form.</span></div>
    <div class="sub"><span class="n">4.2</span><span>The Borrower affirms that the information provided therein is true, complete, and accurate, and that the said conditions bind the Borrower.</span></div>

    <div class="foot"><span class="bar">Together We Can</span><span class="pg">1 of 2</span></div>
  </div>

  <div class="page">
    <div class="head" style="border-bottom:1.5px solid #111;padding-bottom:8px">
      <img class="emblem" style="width:40px;height:40px" src="${origin}/images/coat-of-arms.png" alt="" onerror="this.style.display='none'">
      <div>
        <div style="font-size:12pt;font-weight:900">BUSOGA GHETTO PRESIDENTIAL EMPOWERMENT FUND</div>
        <div style="font-weight:800;letter-spacing:.04em">LOAN AGREEMENT</div>
      </div>
    </div>

    <p class="clause-h">5. Default and Consequences</p>
    <p>In the event that the Borrower fails, neglects, or refuses to repay the loan in accordance with Clause 3 above, the Borrower acknowledges and agrees that he/she shall be liable to legal action and prosecution in accordance with applicable laws and directives governing the Empowerment Fund.</p>

    <p class="clause-h">6. Execution and Attestation</p>
    <p>IN WITNESS WHEREOF, the Borrower has executed this Agreement on the date first above written, in the presence of the following witnesses:</p>

    <div class="sig-block">
      <div class="sig-role">A. Borrower</div>
      <div class="sig-row">
        <div class="seg">Name: ${fill(m.name, '170px')}</div>
        <div class="seg">Signature:<div class="sig-seg-line"></div></div>
        <div class="seg">Date:<div class="sig-seg-line"></div></div>
      </div>
    </div>

    <div class="sig-block" style="margin-top:18px">
      <div style="font-weight:900">B. Witnesses</div>

      <div class="sig-role">1. Chairperson, Ghetto Cell</div>
      <div class="sig-row">
        <div class="seg">Name:<div class="sig-seg-line"></div></div>
        <div class="seg">Signature:<div class="sig-seg-line"></div></div>
        <div class="seg">Date:<div class="sig-seg-line"></div></div>
      </div>

      <div class="sig-role">2. District Ghetto President / Representative</div>
      <div class="sig-row">
        <div class="seg">Name:<div class="sig-seg-line"></div></div>
        <div class="seg">Signature:<div class="sig-seg-line"></div></div>
        <div class="seg">Date:<div class="sig-seg-line"></div></div>
      </div>

      <div class="sig-role">3. RDC/RCC (Representative of the District/City Security Committee)</div>
      <div class="sig-row">
        <div class="seg">Name:<div class="sig-seg-line"></div></div>
        <div class="seg">Signature:<div class="sig-seg-line"></div></div>
        <div class="seg">Date:<div class="sig-seg-line"></div></div>
      </div>
    </div>

    <div class="foot"><span class="bar">Together We Can</span><span class="pg">2 of 2</span></div>
  </div>

  ${'<scr' + 'ipt>window.onload=function(){window.print()}</scr' + 'ipt>'}
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

// Cascading location dropdowns for the edit modal
function fillLocSelect(sel, items, current) {
  sel.innerHTML = '<option value="">Select</option>' +
    items.map(i => `<option${i === current ? ' selected' : ''}>${i}</option>`).join('');
  // keep a stored value that isn't in the list (legacy/free-text entries)
  if (current && !items.includes(current)) {
    sel.insertAdjacentHTML('beforeend', `<option selected>${current}</option>`);
  }
}
function updateEditSubCounties() {
  const code = document.getElementById('eDistrict').value;
  const subs = (LOCATIONS[code] && Object.keys(LOCATIONS[code])) || [];
  fillLocSelect(document.getElementById('eSubCounty'), subs, '');
  updateEditParishes();
  updateEditDepots('');
}
function updateEditDepots(current) {
  const code   = document.getElementById('eDistrict').value;
  const depots = (typeof DEPOTS !== 'undefined' && DEPOTS[code]) || [];
  fillLocSelect(document.getElementById('eDepot'), depots, current || '');
}
function updateEditParishes() {
  const code = document.getElementById('eDistrict').value;
  const sub  = document.getElementById('eSubCounty').value;
  const parishes = (LOCATIONS[code] && LOCATIONS[code][sub]) || [];
  fillLocSelect(document.getElementById('eParish'), parishes, '');
}

// Edit modal
function openEditModal() {
  const m = member;
  document.getElementById('eName').value    = m.name;
  document.getElementById('eNin').value     = m.nin || '';
  document.getElementById('ePhone').value   = m.phone || '';
  document.getElementById('eVillage').value = m.village || '';
  document.getElementById('eNotes').value   = m.notes || '';
  document.getElementById('eGender').value  = m.gender || '';
  document.getElementById('eStatus').value  = m.status;
  document.getElementById('eRole').value    = m.depot_role || '';
  document.getElementById('eDistrict').value= m.district;
  updateEditDepots(m.depot || '');
  // Cascading location selects, pre-filled with the stored values
  const subs = (LOCATIONS[m.district] && Object.keys(LOCATIONS[m.district])) || [];
  fillLocSelect(document.getElementById('eSubCounty'), subs, m.sub_county || '');
  const parishes = (LOCATIONS[m.district] && LOCATIONS[m.district][m.sub_county]) || [];
  fillLocSelect(document.getElementById('eParish'), parishes, m.parish || '');
  document.getElementById('eAmount').value  = Number(m.amount) ? Number(m.amount).toLocaleString('en-US') : '';
  document.getElementById('eDate').value    = m.disbursement_date ? m.disbursement_date.split('T')[0] : '';
  // Photo preview
  const prev = document.getElementById('editPhotoPreview');
  prev.innerHTML = m.photo_url
    ? `<img src="${m.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:11px">`
    : initials(m.name);
  openModal('editModal');
}

function previewEditPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('editPhotoPreview').innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:11px">`;
  };
  reader.readAsDataURL(file);
}

async function saveEdit() {
  const btn = document.getElementById('eSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Saving...';

  const fd = new FormData();
  const distObj = DISTRICTS.find(d => d.code === document.getElementById('eDistrict').value);
  fd.append('name',              document.getElementById('eName').value.trim());
  fd.append('nin',               document.getElementById('eNin').value.trim().toUpperCase());
  fd.append('phone',             document.getElementById('ePhone').value.trim());
  fd.append('district',          document.getElementById('eDistrict').value);
  fd.append('district_name',     distObj?.name || document.getElementById('eDistrict').value);
  fd.append('sub_county',        document.getElementById('eSubCounty').value.trim());
  fd.append('parish',            document.getElementById('eParish').value.trim());
  fd.append('depot',             document.getElementById('eDepot').value.trim());
  fd.append('village',           document.getElementById('eVillage').value.trim());
  fd.append('gender',            document.getElementById('eGender').value);
  fd.append('amount',            document.getElementById('eAmount').value.replace(/,/g, ''));
  fd.append('disbursement_date', document.getElementById('eDate').value);
  fd.append('status',            document.getElementById('eStatus').value);
  fd.append('depot_role',        document.getElementById('eRole').value);
  fd.append('notes',             document.getElementById('eNotes').value.trim());
  const photo = document.getElementById('editPhotoInput').files[0];
  if (photo) fd.append('photo', photo);

  try {
    const data = await apiFetch(`/api/members/${memberId}`, { method:'PUT', body: fd });
    member = data.member;
    closeModal('editModal');
    document.getElementById('profileNameBar').textContent = member.name;
    renderProfile();
    showToast('Beneficiary updated!');
  } catch(e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M2 8l4 4 8-8"/></svg>Save Changes';
  }
}

async function confirmDelete() {
  if (!confirm(`Delete ${member.name}? This cannot be undone.`)) return;
  try {
    await apiFetch(`/api/members/${memberId}`, { method:'DELETE' });
    showToast(`${member.name} deleted`);
    setTimeout(() => location.href = 'members.html', 800);
  } catch(e) { showToast(e.message, 'error'); }
}

load();
