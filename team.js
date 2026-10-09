// team.js: Owner + Admin cards with a Details modal. Data comes from the "teams" sheet (see sheet.js).
// Add-on for about.html. Load sheet.js and main.js first, then team.js. It injects its own section and CSS.
const split = (s, sep) => String(s || '').split(sep).map(x => x.trim()).filter(Boolean);
const toMember = r => ({ name: r.fullname || r.username, ign: r.ign, role: r.role, photo: '', contact: '',
  specialty: split(r.handle, ','), schedule: split(r.schedule, ';').length ? split(r.schedule, ';') : ['Schedule coming soon'] });
let TEAM = null;

(async function () {
  const main = document.querySelector('main');
  if (!main) return;
  const rows = await SheetAPI.team(); if (!rows || !rows.length) return;
  const own = rows.find(r => r.role === 'Owner');
  TEAM = { owner: own ? toMember(own) : null, admins: rows.filter(r => r.role !== 'Owner').map(toMember) };

  document.head.insertAdjacentHTML('beforeend', `<style>
    .team-wrap { max-width: 1100px; margin: 0 auto; }
    .team-owner { display: flex; justify-content: center; margin-bottom: 28px; }
    .team-card { width: 100%; text-align: center; background: rgba(255,255,255,.03); border: 1px solid rgba(0,180,216,.2); border-radius: 16px; padding: 26px 20px; transition: transform .3s, box-shadow .3s, border-color .3s; }
    .team-card:hover { transform: translateY(-6px); border-color: rgba(0,180,216,.6); box-shadow: 0 14px 30px rgba(0,180,216,.28); }
    .team-card.owner { max-width: 380px; border-color: rgba(255,193,7,.45); box-shadow: 0 0 26px rgba(255,193,7,.15); padding: 30px 24px; }
    .team-card.owner:hover { border-color: rgba(255,193,7,.8); box-shadow: 0 14px 34px rgba(255,193,7,.3); }
    .t-avatar { width: 86px; height: 86px; margin: 0 auto 14px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; font-weight: 700; color: #06171f; background: radial-gradient(circle at 30% 30%, #48e5ff, #00b4d8 70%); box-shadow: 0 0 0 4px rgba(0,180,216,.18); }
    .owner .t-avatar { width: 104px; height: 104px; font-size: 2.3rem; background: radial-gradient(circle at 30% 30%, #ffe08a, #ffb300 70%); box-shadow: 0 0 0 4px rgba(255,193,7,.22); }
    .t-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .t-badge { display: inline-block; font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 3px 12px; border-radius: 999px; background: rgba(0,180,216,.12); color: #48e5ff; border: 1px solid rgba(0,180,216,.35); }
    .owner .t-badge { background: rgba(255,193,7,.12); color: #ffc107; border-color: rgba(255,193,7,.4); }
    .t-name { font-size: 1.1rem; font-weight: 700; margin: 10px 0 10px; color: #eaf6fa; }
    .t-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 16px; min-height: 28px; }
    .t-chip { font-size: .74rem; padding: 3px 10px; border-radius: 999px; background: rgba(255,255,255,.06); color: #cfeaf2; border: 1px solid rgba(255,255,255,.1); }
    .t-btn { font-family: inherit; background: #00b4d8; color: #06171f; font-weight: 700; font-size: .85rem; border: none; border-radius: 10px; padding: 9px 20px; cursor: pointer; transition: background .2s, transform .2s; }
    .t-btn:hover { background: #48e5ff; transform: translateY(-2px); }
    .owner .t-btn { background: #ffc107; }
    .owner .t-btn:hover { background: #ffd54f; }
    .tm-head { text-align: center; }
    .tm-head .t-avatar { width: 96px; height: 96px; }
    .tm-sec { margin-top: 18px; }
    .tm-sec h4 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: #00b4d8; margin-bottom: 8px; }
    .tm-sched { list-style: none; padding: 0; margin: 0; }
    .tm-sched li { padding: 8px 12px; border-radius: 8px; font-size: .88rem; color: #cfeaf2; background: rgba(255,255,255,.04); margin-bottom: 6px; }
    .tm-bio { color: #9db9c2; font-size: .9rem; margin: 8px 0 0; }
  </style>`);

  const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = m => m.photo ? `<img src="${m.photo}" alt="${m.name}">` : initials(m.name);
  const chips = m => m.specialty.map(s => `<span class="t-chip">${s}</span>`).join('');
  const card = (m, id, owner) => `
    <div class="${owner ? '' : 'col-sm-6 col-lg-4'}">
      <article class="team-card ${owner ? 'owner' : ''}">
        <div class="t-avatar">${avatar(m)}</div>
        <span class="t-badge">${m.role}</span>
        <div class="t-name">${m.name}</div>
        ${m.ign ? `<div class="tm-bio" style="margin:-6px 0 10px">IGN: ${m.ign}</div>` : ''}
        <div class="t-chips">${chips(m)}</div>
        <button class="t-btn" data-member="${id}"><i class="bi bi-info-circle"></i> Details</button>
      </article>
    </div>`;

  main.insertAdjacentHTML('beforeend', `
    <section class="container block" id="team" style="padding-top:20px">
      <h2 class="section-title">Meet the Team</h2>
      <p class="section-sub">The people behind BloxCarry.</p>
      <div class="team-wrap">
        ${TEAM.owner ? `<div class="team-owner">${card(TEAM.owner, 'owner', true)}</div>` : ''}
        <div class="row g-4">${TEAM.admins.map((m, i) => card(m, i, false)).join('')}</div>
      </div>
    </section>
    <div class="modal fade" id="teamModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content custom-modal">
      <div class="modal-header"><h5 class="modal-title"><i class="bi bi-person-badge"></i> Team Member</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body" id="teamModalBody"></div>
    </div></div></div>`);

  document.getElementById('team').addEventListener('click', e => {
    const b = e.target.closest('[data-member]'); if (!b) return;
    const id = b.dataset.member, m = id === 'owner' ? TEAM.owner : TEAM.admins[+id];
    const link = m.contact || (typeof LINKS !== 'undefined' ? LINKS.discord : '#');
    document.getElementById('teamModalBody').innerHTML = `
      <div class="tm-head ${id === 'owner' ? 'owner' : ''}">
        <div class="t-avatar">${avatar(m)}</div>
        <span class="t-badge">${m.role}</span>
        <div class="t-name" style="margin-bottom:0">${m.name}</div>
        ${m.ign ? `<p class="tm-bio">IGN: <b>${m.ign}</b></p>` : ''}
      </div>
      <div class="tm-sec"><h4><i class="bi bi-stars"></i> Specialty</h4><div class="t-chips" style="justify-content:flex-start">${chips(m)}</div></div>
      <div class="tm-sec"><h4><i class="bi bi-clock"></i> Schedule (PHT)</h4><ul class="tm-sched">${m.schedule.map(s => `<li>${s}</li>`).join('')}</ul></div>
      <div class="text-center mt-4"><a class="t-btn" style="text-decoration:none;display:inline-block" href="${link}" target="_blank" rel="noopener noreferrer"><i class="bi bi-discord"></i> Contact on Discord</a></div>`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('teamModal')).show();
  });
})();