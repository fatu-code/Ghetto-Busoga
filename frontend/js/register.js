// Shared "Register member" modal.
// Registering profiles a person as a depot MEMBER (no money). A member only
// becomes a BENEFICIARY once funds are disbursed. This module lets registration
// happen in place (e.g. on the Depots page) without navigating to the
// Beneficiaries list. Depends on app.js globals: DISTRICTS, depotNamesFor,
// LOCATIONS, apiFetch, showToast, openModal, closeModal, initials, accessOf, Auth.
(function () {
  let _onDone = null;
  const acc = (typeof accessOf === 'function' && typeof Auth !== 'undefined')
    ? accessOf(Auth.get()) : { scoped: false, district: null };

  function el(id) { return document.getElementById(id); }

  function inject() {
    if (el('rgModal')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
<div class="modal-bg" id="rgModal">
  <div class="modal-card" style="max-width:640px">
    <div class="modal-head">
      <div class="modal-title">Register New Member</div>
      <button class="modal-close" onclick="closeModal('rgModal')">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border)">
        <div id="rgPhotoPreview" style="width:72px;height:72px;border-radius:13px;background:#1a2e22;display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:1.4rem;color:rgba(179,230,200,.6);flex-shrink:0;overflow:hidden;cursor:pointer;border:2px dashed rgba(179,230,200,.3)">?</div>
        <div>
          <div style="font-family:var(--font2);font-size:.82rem;font-weight:800;color:var(--text);margin-bottom:3px">Member Photo</div>
          <div style="font-family:var(--font2);font-size:.68rem;font-weight:600;color:var(--muted);margin-bottom:8px">Optional but recommended. If left blank, the member's initials are used.</div>
          <input type="file" id="rgPhotoInput" accept="image/*" style="display:none">
          <button class="btn btn-sm" id="rgPhotoBtn">
            <svg viewBox="0 0 16 16"><path d="M8 2v8M5 5l3-3 3 3"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>
            Upload Photo
          </button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="rgName" placeholder="Full name"></div>
        <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="rgPhone" placeholder="+256..."></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">National ID (NIN) *</label><input class="form-input" id="rgNin" placeholder="e.g. CM91XXXXXXXXXX" maxlength="14"></div>
        <div class="form-group"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">District *</label><select class="form-select" id="rgDistrict"><option value="">Select district</option></select></div>
        <div class="form-group"><label class="form-label">Depot (serving base) *</label><select class="form-select" id="rgDepot"><option value="">Select district first</option></select></div>
      </div>
      <div style="font-family:var(--font2);font-size:.72rem;color:var(--muted);line-height:1.5;margin:-4px 0 12px">The depot is the serving base. The sub-county, parish and village below are where the member actually lives, which may be different.</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Sub-County (member's home)</label><select class="form-select" id="rgSub"><option value="">Select district first</option></select></div>
        <div class="form-group"><label class="form-label">Parish (member's home)</label><select class="form-select" id="rgParish"><option value="">Select sub-county first</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Village / Area</label><input class="form-input" id="rgVillage" placeholder="Village or area"></div>
        <div class="form-group"><label class="form-label">Gender</label><select class="form-select" id="rgGender"><option value="">Select</option><option>Male</option><option>Female</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Depot Role</label><select class="form-select" id="rgRole"><option value="">Member (no position)</option><option>District Commander</option><option>Depot Commander</option><option>Deputy</option><option>Secretary</option><option>Publicity</option></select></div>
        <div class="form-group"></div>
      </div>
      <div class="form-group" style="background:var(--green-pale);border:1px solid var(--green-mid);border-radius:var(--radius-sm);padding:11px 14px;font-family:var(--font2);font-size:.74rem;font-weight:600;color:var(--green-dark);line-height:1.5">
        This profiles the person as a depot member. Money is not entered here. A member becomes a beneficiary once funds are disbursed, then open their profile and use <strong>Record Disbursement</strong>.
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="rgNotes" rows="2" placeholder="Any additional notes..."></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal('rgModal')">Cancel</button>
      <button class="btn btn-green" id="rgSaveBtn">
        <svg viewBox="0 0 16 16"><path d="M2 8l4 4 8-8"/></svg>
        Register &amp; Generate QR
      </button>
    </div>
  </div>
</div>`;
    document.body.appendChild(wrap.firstElementChild);
    wire();
  }

  function wire() {
    // District list
    DISTRICTS.forEach(d => {
      const o = document.createElement('option');
      o.value = d.code; o.textContent = d.name;
      el('rgDistrict').appendChild(o);
    });
    el('rgDistrict').addEventListener('change', () => { buildSub(); buildDepots(); });
    el('rgSub').addEventListener('change', buildParish);
    el('rgPhotoBtn').addEventListener('click', () => el('rgPhotoInput').click());
    el('rgPhotoPreview').addEventListener('click', () => el('rgPhotoInput').click());
    el('rgPhotoInput').addEventListener('change', previewPhoto);
    el('rgName').addEventListener('input', previewInitials);
    el('rgNin').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    el('rgSaveBtn').addEventListener('click', save);
  }

  function buildSub() {
    const code = el('rgDistrict').value;
    const subs = (typeof LOCATIONS !== 'undefined' && LOCATIONS[code] && Object.keys(LOCATIONS[code])) || [];
    el('rgSub').innerHTML = '<option value="">' + (code ? 'Select sub-county' : 'Select district first') + '</option>' +
      subs.map(s => `<option>${s}</option>`).join('');
    buildParish();
  }
  function buildParish() {
    const code = el('rgDistrict').value, sub = el('rgSub').value;
    const parishes = (typeof LOCATIONS !== 'undefined' && LOCATIONS[code] && LOCATIONS[code][sub]) || [];
    el('rgParish').innerHTML = '<option value="">' + (sub ? 'Select parish' : 'Select sub-county first') + '</option>' +
      parishes.map(p => `<option>${p}</option>`).join('');
  }
  function buildDepots() {
    const code = el('rgDistrict').value;
    const depots = code ? depotNamesFor(code) : [];
    el('rgDepot').innerHTML = '<option value="">' + (code ? 'Select depot' : 'Select district first') + '</option>' +
      depots.map(d => `<option>${d}</option>`).join('');
  }

  function previewPhoto() {
    const file = el('rgPhotoInput').files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const p = el('rgPhotoPreview');
      p.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:11px">`;
      p.style.border = '2px solid var(--green)';
    };
    reader.readAsDataURL(file);
  }
  function previewInitials() {
    const name = el('rgName').value.trim();
    if (!el('rgPhotoInput').files[0] && name) el('rgPhotoPreview').textContent = initials(name);
  }

  function setDepotOption(val) {
    const sel = el('rgDepot');
    if (val && ![...sel.options].some(o => o.value === val || o.textContent === val)) {
      sel.insertAdjacentHTML('beforeend', `<option>${val}</option>`);
    }
    sel.value = val || '';
  }

  function reset() {
    ['rgName', 'rgNin', 'rgPhone', 'rgVillage', 'rgNotes'].forEach(i => el(i).value = '');
    ['rgGender', 'rgRole'].forEach(i => el(i).value = '');
    el('rgPhotoInput').value = '';
    const p = el('rgPhotoPreview');
    p.innerHTML = '?'; p.textContent = '?';
    p.style.border = '2px dashed rgba(179,230,200,.3)';
  }

  async function save() {
    const name = el('rgName').value.trim();
    const nin = el('rgNin').value.trim().toUpperCase();
    const district = el('rgDistrict').value;
    const depot = el('rgDepot').value.trim();
    const photo = el('rgPhotoInput').files[0];

    if (!name) { showToast('Full name is required', 'error'); return; }
    if (!nin) { showToast('NIN is required', 'error'); return; }
    if (!district) { showToast('District is required', 'error'); return; }
    if (!depot) { showToast('Please choose a depot', 'error'); return; }
    if (!/^[A-Z0-9]{10,14}$/.test(nin)) { showToast('NIN should be 10-14 letters/numbers (e.g. CM91...)', 'error'); return; }

    const distObj = DISTRICTS.find(d => d.code === district);
    const btn = el('rgSaveBtn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Registering...';
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('nin', nin);
      fd.append('phone', el('rgPhone').value.trim());
      fd.append('district', district);
      fd.append('district_name', (distObj && distObj.name) || district);
      fd.append('sub_county', el('rgSub').value.trim());
      fd.append('parish', el('rgParish').value.trim());
      fd.append('depot', depot);
      fd.append('village', el('rgVillage').value.trim());
      fd.append('gender', el('rgGender').value);
      fd.append('depot_role', el('rgRole').value);
      fd.append('notes', el('rgNotes').value.trim());
      if (photo) fd.append('photo', photo);

      const data = await apiFetch('/api/members', { method: 'POST', body: fd });
      closeModal('rgModal');
      showToast(`${name} registered as ${data.member.id}. They list under Beneficiaries once disbursed.`);
      reset();
      if (typeof _onDone === 'function') _onDone(data.member);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M2 8l4 4 8-8"/></svg> Register & Generate QR';
    }
  }

  // openRegister({ district, depot, onDone }) - open the form in place.
  window.openRegister = function (opts) {
    opts = opts || {};
    inject();
    reset();
    const district = opts.district || (acc.scoped ? acc.district : '');
    el('rgDistrict').value = district || '';
    el('rgDistrict').disabled = !!acc.scoped;
    buildSub();
    buildDepots();
    setDepotOption(opts.depot || '');
    _onDone = opts.onDone || null;
    openModal('rgModal');
  };
})();
