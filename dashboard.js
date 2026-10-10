// dashboard.js: talks to the Apps Script backend (see Code.gs). All money values come from the sheet formulas.
const $ = id => document.getElementById(id);
const peso = n => '₱' + (+n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = null, DB = null, charts = {};   // S = session {username,key}, DB = last data from sheet

const day = o => o.date.slice(0, 10);                                   // dates arrive as Manila time
const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const done = list => list.filter(o => o.status === 'Done');
const sum = (list, k) => list.reduce((a, o) => a + o[k], 0);

async function load() {
  const r = await SheetAPI.post({ action: 'data', ...S });
  if (r.error) { logout(); $('msg').textContent = r.error; return; }
  DB = r; $('who').textContent = `${r.me.username} (${r.me.role})`;
  $('upd').textContent = 'Updated ' + new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' }) + ' PHT';
  const own = r.me.role === 'Owner';
  fillSvc();
  if (!HSEL) HSEL = [r.me.username];
  fillHelp();
  render();
}

// service list shows the peso price for Cash, or the accepted fruits for Fruit
function fillSvc() {
  // old backend versions don't send the fruits field: fall back to prices instead of disabling everything
  const fruit = $('fPay').value === 'Fruit' && DB.services.some(s => 'fruits' in s), cur = $('fSvc').value;
  $('fSvc').innerHTML = DB.services.map(s => `<option value="${esc(s.service)}" ${fruit && !s.fruits ? 'disabled' : ''}>${esc(s.service)} ${
    fruit ? (s.fruits ? '— ' + esc(s.fruits) : '(no fruit option)') : '(₱' + s.price + ')'}</option>`).join('');
  if (cur) $('fSvc').value = cur;
  if ($('fSvc').selectedOptions[0]?.disabled) $('fSvc').selectedIndex = [...$('fSvc').options].findIndex(o => !o.disabled);
}

// handled by: multi-select, tick or untick anyone who handled the order (the payout is split equally between all of them)
let HSEL = null, ESEL = [], EID = null;   // HSEL = picked for a new order, ESEL = picked while editing order EID
const boxes = (sel, checked, lockSelf) => DB.people.map(u =>
  `<label><input type="checkbox" value="${esc(u)}" ${checked.includes(u) ? 'checked' : ''} ${lockSelf && u === DB.me.username ? 'disabled' : ''}> ${esc(u)}</label>`).join('');
const ticked = box => [...box.querySelectorAll('input:checked')].map(i => i.value);
const lockSelf = () => DB.me.role !== 'Owner';   // admins always stay on their own orders
function fillHelp() {
  $('fHbox').innerHTML = boxes('', HSEL, lockSelf());
  $('fHsum').textContent = HSEL.length ? HSEL.join(' + ') : 'Choose handlers';
}
$('fHbox').addEventListener('change', () => { HSEL = ticked($('fHbox')); if (lockSelf() && !HSEL.includes(DB.me.username)) HSEL.unshift(DB.me.username); fillHelp(); });
function openEdit(id) {
  const o = DB.orders.find(x => x.id === id); if (!o) return;
  EID = id; ESEL = [...o.handlers]; $('hEditId').textContent = id; $('hMsg').textContent = '';
  $('hEditBox').innerHTML = boxes('', ESEL, lockSelf()); $('hEdit').hidden = false; $('hEdit').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
$('hEditBox').addEventListener('change', () => { ESEL = ticked($('hEditBox')); });
$('hCancel').onclick = () => { $('hEdit').hidden = true; EID = null; };
$('hSave').onclick = async () => {
  const sel = lockSelf() && !ESEL.includes(DB.me.username) ? [DB.me.username, ...ESEL] : ESEL;
  if (!sel.length) { $('hMsg').textContent = 'Pick at least one handler.'; return; }
  $('hSave').disabled = true; $('hMsg').textContent = 'Saving…';
  const r = await SheetAPI.post({ action: 'handlers', ...S, id: EID, handlers: sel });
  $('hSave').disabled = false; $('hMsg').textContent = r.error || '';
  if (r.ok) { $('hEdit').hidden = true; EID = null; load(); }
};

function filtered() {
  const f = $('from').value, t = $('to').value, st = $('fStatus').value, q = $('q').value.toLowerCase();
  return DB.orders.filter(o => (!f || day(o) >= f) && (!t || day(o) <= t) && (!st || o.status === st) &&
    (!q || [o.customer, o.service, o.id, o.handlers.join(' ')].join(' ').toLowerCase().includes(q))).reverse();
}

function render() {
  const all = DB.orders, today = manilaToday(), own = DB.me.role === 'Owner';
  const d = done(all), rev = from => sum(d.filter(o => day(o) >= from), 'payment');
  const k = [['Revenue today', peso(rev(today))], ['Revenue, 7 days', peso(rev(addDays(today, -6)))], ['Revenue, 30 days', peso(rev(addDays(today, -29)))],
    ['Pending orders', all.filter(o => o.status === 'Pending').length], ['Done orders', d.length],
    [own ? 'Still owed to team' : 'Still owed to you', peso(sum(DB.balances || [], 'owed'))], [own ? 'Paid out (all)' : 'Paid to you', peso(sum(DB.balances || [], 'paid'))]];
  if (own) k.push(["Owner's 15% cut", peso(sum(d, 'share'))]);
  if (own && DB.ownerEarn) k.push(['Your total earnings', peso(DB.ownerEarn.total)]);
  $('kpis').innerHTML = k.map(([l, v]) => `<div class="card kpi" style="margin:0"><b>${v}</b><span>${l}</span></div>`).join('');

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  chart('cRev', 'bar', days.map(x => x.slice(5)), days.map(x => sum(d.filter(o => day(o) === x), 'payment')), 'Revenue (₱)');
  const cat = {}; d.forEach(o => { const c = (DB.services.find(s => s.service === o.service) || {}).category || 'Other'; cat[c] = (cat[c] || 0) + 1; });
  chart('cCat', 'doughnut', Object.keys(cat), Object.values(cat), 'Orders');

  $('bal').innerHTML = '<tr><th>username</th><th>earned</th><th>paid out</th><th>still owed</th><th></th></tr>' +
    (own && DB.ownerEarn ? `<tr><td>${esc(DB.me.username)} (owner)</td><td>${peso(DB.ownerEarn.total)} <small class="mut">= ${peso(DB.ownerEarn.handler)} handling + ${peso(DB.ownerEarn.cut)} cut</small></td><td colspan="3" class="mut">kept by you, not paid out</td></tr>` : '') +
    ((DB.balances || []).map(b => `<tr><td>${esc(b.u)}</td><td>${peso(b.earned)}</td><td>${peso(b.paid)}</td><td><b>${peso(b.owed)}</b></td>
      <td>${own && b.owed > 0 ? `<button class="sm ok" data-pay="${esc(b.u)}">Pay out</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="mut">No team members yet.</td></tr>');
  $('hist').innerHTML = '<tr><th>id</th><th>date</th><th>team member</th><th>amount</th><th>note</th></tr>' +
    ((DB.payouts || []).slice().reverse().map(p => `<tr><td>${esc(p.id)}</td><td>${esc(p.date.replace('T', ' ').slice(0, 16))}</td><td>${esc(p.username)}</td><td>${peso(p.amount)}</td><td>${esc(p.note)}</td></tr>`).join('') ||
      '<tr><td colspan="5" class="mut">No payouts recorded yet.</td></tr>');

  const rows = filtered(), fd = done(rows), g = {};
  fd.forEach(o => (o.splits || [{ u: o.username, amt: o.payout }]).forEach(sp => { const key = sp.u + '|' + o.service; (g[key] = g[key] || { u: sp.u, s: o.service, n: 0, p: 0 }); g[key].n++; g[key].p += sp.amt; }));
  const pr = Object.values(g).sort((a, b) => a.u.localeCompare(b.u) || b.p - a.p);
  $('pay').innerHTML = '<tr><th>username</th><th>service completed</th><th>services done</th><th>payout</th></tr>' +
    (pr.map(x => `<tr><td>${esc(x.u)}</td><td>${esc(x.s)}</td><td>${x.n}</td><td>${peso(x.p)}</td></tr>`).join('') || '<tr><td colspan="4" class="mut">No completed orders in this range.</td></tr>') +
    (pr.length ? `<tr><th colspan="2">Total</th><th>${sum(pr, 'n')}</th><th>${peso(sum(pr, 'p'))}</th></tr>` : '');
  $('ord').innerHTML = '<tr><th>order</th><th>date</th><th>customer</th><th>handled by</th><th>service</th><th>method</th><th>price</th><th>payout</th><th>status</th><th></th></tr>' +
    (rows.map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.date.replace('T', ' ').slice(0, 16))}</td><td>${esc(o.customer)}</td><td>${esc(o.handlers.join(' + '))}</td><td>${esc(o.service)}</td><td>${esc(o.method)}</td>
      <td>${o.method === 'Fruit' ? 'Fruit' : peso(o.payment)}</td><td>${o.method === 'Fruit' ? '—' : peso(o.payout)}${own && o.handlers.length > 1 && o.method !== 'Fruit' ? ` <small class="mut">(split ${o.handlers.length})</small>` : ''}</td><td><span class="st ${o.status}">${o.status}</span></td>
      <td><button class="sm" data-edit="${esc(o.id)}">Handlers</button> ${o.status === 'Pending' ? `<button class="sm ok" data-id="${esc(o.id)}" data-st="Done">Mark done</button> <button class="sm no" data-id="${esc(o.id)}" data-st="Cancelled">Cancel</button>` : ''}</td></tr>`).join('') ||
      '<tr><td colspan="10" class="mut">No orders yet. Log one above.</td></tr>');
}

function chart(id, type, labels, data, label) {
  if (charts[id]) charts[id].destroy();
  const col = ['#00b4d8', '#48e5ff', '#9b5de5', '#ffc107', '#48c78e', '#ff7b7b', '#a0c8ff'];
  charts[id] = new Chart($(id), { type, data: { labels, datasets: [{ label, data, backgroundColor: type === 'bar' ? '#00b4d8' : col }] },
    options: { plugins: { legend: { display: type !== 'bar', labels: { color: '#cfeaf2' } } },
      scales: type === 'bar' ? { x: { ticks: { color: '#9db9c2' } }, y: { beginAtZero: true, ticks: { color: '#9db9c2' } } } : {} } });
}

function logout() { sessionStorage.removeItem('bc_session'); S = null; $('app').hidden = true; $('login').hidden = false; }

$('login').addEventListener('submit', async e => {
  e.preventDefault(); $('msg').textContent = 'Signing in…';
  S = { username: $('u').value.trim(), key: $('k').value }; sessionStorage.setItem('bc_session', JSON.stringify(S));
  try { await load(); if (S) { $('login').hidden = true; $('app').hidden = false; $('msg').textContent = ''; render(); } }
  catch (err) { $('msg').textContent = 'Could not reach the server. Check API_URL in sheet.js.'; }
});
$('fPay').addEventListener('change', () => DB && fillSvc());
// owner only: pay out a team member (amount defaults to what is still owed)
let PAYU = null;
$('bal').addEventListener('click', e => {
  const b = e.target.closest('button[data-pay]'); if (!b) return;
  const x = DB.balances.find(y => y.u === b.dataset.pay); if (!x) return;
  PAYU = x.u; $('pOutWho').textContent = x.u; $('pAmt').value = x.owed.toFixed(2); $('pNote').value = ''; $('pMsg').textContent = '';
  $('pOut').hidden = false; $('pOut').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
$('pCancel').onclick = () => { $('pOut').hidden = true; PAYU = null; };
$('pGo').onclick = async () => {
  const amount = +$('pAmt').value; if (!(amount > 0)) { $('pMsg').textContent = 'Enter an amount above 0.'; return; }
  $('pGo').disabled = true; $('pMsg').textContent = 'Saving…';
  const r = await SheetAPI.post({ action: 'payout', ...S, user: PAYU, amount, note: $('pNote').value.trim() });
  $('pGo').disabled = false; $('pMsg').textContent = r.error || '';
  if (r.ok) { $('pOut').hidden = true; PAYU = null; load(); }
};
$('logout').onclick = logout;
$('refresh').onclick = () => load();
['from', 'to', 'fStatus', 'q'].forEach(id => $(id).addEventListener('input', () => DB && render()));
$('fAdd').onclick = async () => {
  const customer = $('fCust').value.trim(); if (!customer) { $('fMsg').textContent = 'Enter the customer username.'; return; }
  $('fAdd').disabled = true; $('fMsg').textContent = 'Saving…';
  const r = await SheetAPI.post({ action: 'log', ...S, customer, service: $('fSvc').value, method: $('fPay').value, handlers: HSEL });
  $('fAdd').disabled = false; $('fMsg').textContent = r.error || `Added ${r.id}`;
  if (r.ok) { $('fCust').value = ''; HSEL = [DB.me.username]; $('fPick').open = false; load(); }
};
$('ord').addEventListener('click', e => { const b = e.target.closest('button[data-edit]'); if (b) openEdit(b.dataset.edit); });
$('ord').addEventListener('click', async e => {
  const b = e.target.closest('button[data-id]'); if (!b) return; b.disabled = true;
  const r = await SheetAPI.post({ action: 'status', ...S, id: b.dataset.id, status: b.dataset.st });
  if (r.error) alert(r.error); load();
});
setInterval(() => S && !document.hidden && load(), 60000);                 // auto refresh
try { S = JSON.parse(sessionStorage.getItem('bc_session')); } catch (e) {}
if (S) load().then(() => { if (S) { $('login').hidden = true; $('app').hidden = false; render(); } }).catch(() => logout());