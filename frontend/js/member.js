Auth.require();
buildSidebar('members');

// Role gates what this page can do. Backend enforces the real rules.
const acc = accessOf(Auth.get());
loadDepotsDB(); // real depots for the edit dropdown

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
        <div class="av-wrap">
          <div class="member-photo ${leaderRingClass(m)}">
            ${m.photo_url ? `<img src="${imgThumb(m.photo_url, 320)}" alt="${m.name}">` : initials(m.name)}
          </div>
          ${leaderBadge(m)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">
            ${statusPill(m.status)}
            ${disbursementPill(m)}
            ${m.district_role ? `<span class="pill" style="background:#eaf7f0;color:#0a7a3a;border-color:#b3e6c8">${roleDisplay(m.district_role, m.district_name)}</span>` : ''}
            ${m.depot_role ? `<span class="pill" style="background:#eef2ff;color:#4338ca;border-color:#c7d2fe">${roleDisplay(m.depot_role, m.district_name)}</span>` : ''}
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
      <button class="tab" onclick="showTab('loan',this)">
        <svg viewBox="0 0 16 16"><path d="M4 1.5h6l3 3V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2a.5.5 0 01.5-.5z"/><path d="M9.5 1.5V5h3.5M5.5 8h5M5.5 10.5h5"/></svg>
        Loan Agreement
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
    </div>

    <div class="tab-content" id="tab-loan">${loanAgreementTab()}</div>`;

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
    celebrate();
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
      ${(acc.canDisburse && !s.cleared) ? `<button class="btn btn-green" style="margin-top:14px" onclick="openRepay()">
        <svg viewBox="0 0 16 16"><path d="M8 1.5v13M4.5 5h5a2.2 2.2 0 010 4.4H5.5"/></svg> Record Repayment
      </button>` : ''}
      <div class="rp-head">Repayment history</div>
      <div class="rp-list">${history}</div>
    </div>`;
}
// On-screen preview of the loan agreement (the "Loan Agreement" tab). It renders
// the EXACT same document that prints, inside an isolated frame, so what you see
// is what you print - one source of truth (buildAgreementDoc).
function loanAgreementTab() {
  const m = member;
  // srcdoc carries the whole document; escape quotes so the attribute stays valid.
  const doc = buildAgreementDoc(m).replace(/"/g, '&quot;');
  return `
  <div class="agr-wrap">
    <div class="agr-top">
      <div>
        <div class="agr-top-eyebrow">Official document &middot; live preview</div>
        <div class="agr-top-title">Loan Agreement</div>
      </div>
      <button class="btn btn-green agr-print" onclick="printAgreement()">
        <svg viewBox="0 0 16 16"><rect x="3" y="6" width="10" height="6" rx="1"/><path d="M4.5 6V2.5h7V6M5 9.5h6"/></svg>
        Print Loan Agreement
      </button>
    </div>
    <iframe class="agr-frame" title="Loan Agreement preview" srcdoc="${doc}"
      onload="try{this.style.height=(this.contentWindow.document.body.scrollHeight+24)+'px'}catch(e){}"></iframe>
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
    celebrate();
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
        <div class="off">Office of the Special Presidential Assistant, State House Uganda</div>
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
        Office of the Special Presidential Assistant. The funds are a SACCO loan facility advanced at <b>6% interest per annum</b>,
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
          <div class="sig-role"><span class="tag">1</span>Depot Commander</div>
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
// Produces the official, court-usable loan agreement: identified Parties,
// Background recitals, a Loan Particulars schedule, numbered operative
// clauses, and a full execution block (Borrower, Lender's officer, witnesses).
// "Ghetto Cell" on the form is filled from the depot. Where a value is missing
// (e.g. not yet disbursed), a ruled blank is left so it can be completed by hand.
function buildAgreementDoc(m) {
  const origin = window.location.origin;
  const emblem = `${origin}/images/coat-of-arms.png`;
  const disb = isDisbursed(m);
  const s = disb ? loanSummary() : null;
  const made = m.disbursement_date ? new Date(m.disbursement_date) : new Date();
  const madeStr = made.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueStr = (s && s.due) ? formatDate(s.due) : '-';
  const monthly = s ? Math.ceil(s.totalDue / 12) : 0;
  const words = disb ? (numberToWords(m.amount) + ' Uganda Shillings Only') : '';

  // Day of the month with its ordinal suffix, e.g. "18th".
  const dnum = made.getDate();
  const suffix = (n => { const v = n % 100; return (v >= 11 && v <= 13) ? 'th' : (['th','st','nd','rd'][n % 10] || 'th'); })(dnum);
  const dayOrd = dnum + suffix;
  const monthName = made.toLocaleDateString('en-GB', { month: 'long' });
  const yearNum = made.getFullYear();

  // The Borrower's home address (the depot is a serving base, kept separate).
  const home = [m.village, m.parish ? m.parish + ' Parish' : '', m.sub_county ? m.sub_county + ' Sub-County' : '', m.district_name ? m.district_name + ' District' : '']
    .filter(Boolean).join(', ');

  const blank = (n => '.'.repeat(n));
  const fillv = (v, n = 22) => disb && v ? v : `<span class="blank">${blank(n)}</span>`;
  const srow = (k, v) => `<div class="srow"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const seg = (cap, val) => `<div class="seg"><div class="ln">${val || ''}</div><div class="cap">${cap}</div></div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loan Agreement - ${m.name} (${m.id})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--ink:#1c2b22;--soft:#55635b;--line:#c6cec8;--green:#0a7a3a;--green-dk:#102a1c;--serif:'Source Serif 4',Georgia,'Times New Roman',serif;--ui:'Inter',-apple-system,sans-serif}
    @page{size:A4;margin:15mm 15mm}
    body{font-family:var(--serif);color:var(--ink);font-size:11.6px;line-height:1.62;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .sheet{max-width:180mm;margin:0 auto;width:100%}
    /* On screen (the in-app preview) give the page breathing room; print uses @page margins. */
    @media screen{body{padding:16px}}
    .blank{letter-spacing:.5px;color:#9aa8a0}
    /* Letterhead */
    .head{display:flex;align-items:center;gap:14px;padding-bottom:11px;border-bottom:2.5px solid var(--green-dk)}
    .head .crest{width:50px;height:50px;object-fit:contain;flex-shrink:0}
    .head .htxt{flex:1;min-width:0}
    .head .prog{font-family:var(--ui);font-weight:800;font-size:13.5px;color:var(--green-dk);line-height:1.2}
    .head .sub{font-family:var(--ui);font-weight:700;font-size:7.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--soft);margin-top:5px}
    .head .ref{text-align:right;flex-shrink:0;font-family:var(--ui);font-size:7.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);line-height:1.5}
    .head .ref b{display:block;font-family:var(--ui);font-size:11px;color:var(--ink);letter-spacing:.02em;margin-top:2px}
    /* Title */
    .title{text-align:center;font-family:var(--ui);font-weight:900;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);margin:18px 0 3px}
    .title-sub{text-align:center;font-family:var(--serif);font-style:italic;font-size:10.5px;color:var(--soft);margin-bottom:4px}
    .lead{margin:16px 0 2px;text-align:justify}
    .lead b{font-weight:600}
    /* Parties */
    .pa-lead{font-family:var(--ui);font-weight:800;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--green);text-align:center;margin:13px 0 7px}
    .party{text-align:justify;margin-bottom:2px}
    .party .nm{font-weight:600}
    .joint{text-align:justify;font-style:italic;color:var(--soft);margin-top:8px;font-size:11px}
    /* Section heading */
    .sec{font-family:var(--ui);font-weight:800;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--green);margin:20px 0 10px;display:flex;align-items:center;gap:12px;break-after:avoid}
    .sec::after{content:"";flex:1;height:1.4px;background:var(--line)}
    .recital{text-align:justify;margin-bottom:7px}
    .recital .w{font-weight:600;letter-spacing:.02em}
    .nt{font-weight:600;margin:11px 0 2px;text-align:justify}
    /* Schedule */
    .schedule{border:1px solid var(--line);border-radius:9px;overflow:hidden;margin:4px 0;break-inside:avoid}
    .srow{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:8px 15px;border-bottom:1px solid #e6ebe8;font-size:11.4px}
    .srow:last-child{border-bottom:none}
    .srow .k{color:var(--soft)}
    .srow .v{font-weight:600;text-align:right}
    .srow.tot{background:#eaf7f0;border-top:1.5px solid var(--green-dk)}
    .srow.tot .k{font-family:var(--ui);font-weight:800;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--green-dk)}
    .srow.tot .v{color:var(--green-dk);font-size:13px}
    /* Clauses */
    .clause{margin-top:13px;break-inside:avoid}
    .cl-h{font-family:var(--ui);font-weight:800;font-size:11.3px;color:var(--ink);margin-bottom:5px}
    .cl-h .n{color:var(--green);margin-right:9px}
    .sub{display:flex;gap:10px;margin:4px 0;text-align:justify}
    .sub .n{flex-shrink:0;font-weight:600;color:var(--soft);min-width:24px}
    .pl{text-align:justify}
    /* Execution */
    .exec{margin-top:6px}
    .sig-card{border:1px solid var(--line);border-radius:9px;padding:13px 15px;margin-top:11px;break-inside:avoid}
    .sig-role{font-family:var(--ui);font-weight:800;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--green-dk);margin-bottom:13px;display:flex;align-items:center;gap:9px}
    .sig-role .tag{width:18px;height:18px;border-radius:50%;background:var(--green-dk);color:#fff;font-family:var(--ui);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
    .sig-grid.three{grid-template-columns:1.5fr 1fr 1fr}
    .seg .ln{border-bottom:1.3px solid #8c9a92;height:25px;display:flex;align-items:flex-end;padding-bottom:4px;font-size:11.5px;color:var(--ink)}
    .seg .cap{font-family:var(--ui);font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-top:5px}
    .wsec{font-family:var(--ui);font-weight:800;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink);margin:17px 0 0}
    /* Footer */
    .foot{margin-top:18px;padding-top:10px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-family:var(--ui);font-size:8px;font-weight:700;letter-spacing:.06em;color:#9aa8a0;text-transform:uppercase}
    .foot .bar{color:var(--green)}
  </style></head><body>
  <div class="sheet">
    <div class="head">
      <img class="crest" src="${emblem}" alt="" onerror="this.style.display='none'">
      <div class="htxt">
        <div class="prog">Busoga Ghetto Presidential Empowerment Fund</div>
        <div class="sub">Office of the Special Presidential Assistant &middot; State House Uganda</div>
      </div>
      <div class="ref">Serial No.<b>${m.id}</b></div>
    </div>

    <div class="title">Loan Agreement</div>
    <div class="title-sub">Made under the Busoga Ghetto Presidential Empowerment Programme</div>

    <p class="lead">THIS LOAN AGREEMENT is made this <b>${dayOrd}</b> day of <b>${monthName}, ${yearNum}</b>.</p>

    <div class="pa-lead">Between</div>
    <p class="party"><span class="nm">The Busoga Ghetto Presidential Empowerment Fund</span>, established under the Office of the Special Presidential Assistant, State House Uganda (hereinafter referred to as the <b>"Lender"</b>) of the one part;</p>

    <div class="pa-lead">And</div>
    <p class="party"><span class="nm">${titleCase(m.name)}</span>, holder of National Identification Number ${m.nin || blank(14)}${m.phone ? ', telephone ' + m.phone : ''}, of ${home || blank(34)}, serving under the ${m.depot} Ghetto Cell (hereinafter referred to as the <b>"Borrower"</b>, which expression shall, where the context so admits, include his/her heirs, personal representatives, successors and assigns) of the other part.</p>

    <p class="joint">The Lender and the Borrower are hereinafter jointly referred to as the "Parties" and individually as a "Party".</p>

    <div class="sec">Background</div>
    <p class="recital"><span class="w">WHEREAS</span> the Lender administers a Presidential empowerment facility under which Savings and Credit Cooperative (SACCO) loans are advanced, at six percent (6%) interest per annum, to duly registered members of the Busoga ghetto structure for purposes of economic empowerment;</p>
    <p class="recital"><span class="w">AND WHEREAS</span> the Borrower is a duly profiled beneficiary of the said structure, registered under Serial Number ${m.id}, and has applied for and been granted a loan by the Lender;</p>
    <p class="recital"><span class="w">AND WHEREAS</span> the Parties are desirous of reducing into writing the terms and conditions governing the said loan;</p>
    <p class="nt">NOW THEREFORE the Parties hereto agree as follows:</p>

    <div class="sec">Schedule &mdash; Loan Particulars</div>
    <div class="schedule">
      ${srow('Principal sum', disb ? 'UGX ' + fmt(s.principal) : fillv('', 16))}
      ${srow('Interest (6% per annum)', disb ? 'UGX ' + fmt(s.interest) : fillv('', 16))}
      ${srow('Repayment period', 'Twelve (12) months')}
      ${srow('Indicative monthly instalment', disb ? 'UGX ' + fmt(monthly) : fillv('', 16))}
      ${srow('Date of disbursement', disb ? formatDate(m.disbursement_date) : fillv('', 16))}
      ${srow('Repayable in full by', disb ? dueStr : fillv('', 16))}
      ${srow('Loan amount in words', disb ? words : fillv('', 30))}
      <div class="srow tot"><span class="k">Total sum repayable</span><span class="v">${disb ? 'UGX ' + fmt(s.totalDue) : fillv('', 16)}</span></div>
    </div>

    <div class="sec">Terms and Conditions</div>

    <div class="clause">
      <div class="cl-h"><span class="n">1.</span>Loan Advance</div>
      <div class="sub"><span class="n">1.1</span><span>The Borrower hereby acknowledges receiving from the Lender a loan in the sum of ${disb ? '<b>' + words + ' (UGX ' + fmt(m.amount) + ')</b>' : 'UGX ' + fillv('', 16)} (the "Loan Amount"), which the Borrower confirms as accurate.</span></div>
      <div class="sub"><span class="n">1.2</span><span>The loan shall accrue interest at the rate of six percent (6%) per annum for the entire duration of this Agreement.</span></div>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">2.</span>Purpose of the Loan</div>
      <p class="pl">The Borrower undertakes and agrees that the Loan Amount shall be used strictly for empowerment activities under the Busoga Ghetto Presidential Empowerment Programme, and for no other purpose whatsoever.</p>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">3.</span>Repayment Terms</div>
      <div class="sub"><span class="n">3.1</span><span>The Borrower shall repay the full Loan Amount together with the applicable interest within twelve (12) months from the date of execution of this Agreement.</span></div>
      <div class="sub"><span class="n">3.2</span><span>All repayments shall be made in accordance with the schedule, mode, and instructions prescribed by the Lender at the time of disbursement.</span></div>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">4.</span>Acknowledgement of Terms and Conditions</div>
      <div class="sub"><span class="n">4.1</span><span>The Borrower confirms that he/she has carefully read and understood all terms, conditions, obligations, and declarations contained in this Agreement and in the Loan Application Form.</span></div>
      <div class="sub"><span class="n">4.2</span><span>The Borrower affirms that the information provided therein is true, complete, and accurate, and that the said conditions bind the Borrower.</span></div>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">5.</span>Default and Consequences</div>
      <p class="pl">In the event that the Borrower fails, neglects, or refuses to repay the loan in accordance with Clause 3 above, the Borrower acknowledges and agrees that he/she shall be liable to legal action and prosecution in accordance with the applicable laws and directives governing the Empowerment Fund.</p>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">6.</span>Governing Law and Jurisdiction</div>
      <p class="pl">This Agreement shall be governed by, and construed in accordance with, the laws of the Republic of Uganda, and the Parties hereby submit to the jurisdiction of the courts of Uganda.</p>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">7.</span>Entire Agreement</div>
      <p class="pl">This Agreement constitutes the entire agreement between the Parties in respect of the loan and supersedes all prior negotiations, representations, or arrangements, whether oral or written. No amendment or variation shall be of any effect unless made in writing and signed by or on behalf of both Parties.</p>
    </div>

    <div class="clause">
      <div class="cl-h"><span class="n">8.</span>Execution and Attestation</div>
      <p class="pl">IN WITNESS WHEREOF the Parties have executed this Agreement on the day, month, and year first above written, in the presence of the witnesses subscribing hereunder.</p>
    </div>

    <div class="exec">
      <div class="sig-card">
        <div class="sig-role"><span class="tag">A</span>The Borrower</div>
        <div class="sig-grid">
          ${seg('Name', titleCase(m.name))}
          ${seg('National ID (NIN)', m.nin || '')}
          ${seg('Signature / Thumbprint', '')}
          ${seg('Date', '')}
        </div>
      </div>

      <div class="sig-card">
        <div class="sig-role"><span class="tag">B</span>For and on behalf of the Lender</div>
        <div class="sig-grid">
          ${seg('Name', '')}
          ${seg('Designation', '')}
          ${seg('Signature', '')}
          ${seg('Date', '')}
        </div>
      </div>

      <div class="wsec">Witnesses</div>

      <div class="sig-card">
        <div class="sig-role"><span class="tag">1</span>Depot Commander</div>
        <div class="sig-grid three">${seg('Name', '')}${seg('Signature', '')}${seg('Date', '')}</div>
      </div>
      <div class="sig-card">
        <div class="sig-role"><span class="tag">2</span>District Ghetto President / Representative</div>
        <div class="sig-grid three">${seg('Name', '')}${seg('Signature', '')}${seg('Date', '')}</div>
      </div>
      <div class="sig-card">
        <div class="sig-role"><span class="tag">3</span>Resident District / City Commissioner (RDC / RCC)</div>
        <div class="sig-grid three">${seg('Name', '')}${seg('Signature', '')}${seg('Date', '')}</div>
      </div>
    </div>

    <div class="foot"><span class="bar">Together We Can</span><span>Busoga Ghetto Presidential Empowerment Fund &middot; ${m.id}</span></div>
  </div>
  </body></html>`;

  return html;
}

// Open the agreement in a new tab and trigger the print dialog.
function printAgreement() {
  const html = buildAgreementDoc(member).replace(
    '</body></html>',
    `${'<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr' + 'ipt>'}</body></html>`
  );
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
  const depots = depotNamesFor(code); // real DB depots + static fallback
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
  document.getElementById('eDistrictRole').value = m.district_role || '';
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
  fd.append('district_role',     document.getElementById('eDistrictRole').value);
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
