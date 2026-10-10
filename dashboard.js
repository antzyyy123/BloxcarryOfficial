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
  const prev = $('fWho').value;
  $('fWho').innerHTML = r.team.map(u => `<option ${u === (prev || r.me.username) ? 'selected' : ''}>${esc(u)}</option>`).join('');
  $('fWho').hidden = !own;
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

function filtered() {
  const f = $('from').value, t = $('to').value, st = $('fStatus').value, q = $('q').value.toLowerCase();
  return DB.orders.filter(o => (!f || day(o) >= f) && (!t || day(o) <= t) && (!st || o.status === st) &&
    (!q || [o.customer, o.service, o.id, o.username].join(' ').toLowerCase().includes(q))).reverse();
}

function render() {
  const all = DB.orders, today = manilaToday(), own = DB.me.role === 'Owner';
  const d = done(all), rev = from => sum(d.filter(o => day(o) >= from), 'payment');
  const k = [['Revenue today', peso(rev(today))], ['Revenue, 7 days', peso(rev(addDays(today, -6)))], ['Revenue, 30 days', peso(rev(addDays(today, -29)))],
    ['Pending orders', all.filter(o => o.status === 'Pending').length], ['Done orders', d.length],
    [own ? 'Payouts owed (all)' : 'Your payout', peso(sum(d, 'payout'))]];
  if (own) k.push(["Owner's 15% cut", peso(sum(d, 'share'))]);
  $('kpis').innerHTML = k.map(([l, v]) => `<div class="card kpi" style="margin:0"><b>${v}</b><span>${l}</span></div>`).join('');

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  chart('cRev', 'bar', days.map(x => x.slice(5)), days.map(x => sum(d.filter(o => day(o) === x), 'payment')), 'Revenue (₱)');
  const cat = {}; d.forEach(o => { const c = (DB.services.find(s => s.service === o.service) || {}).category || 'Other'; cat[c] = (cat[c] || 0) + 1; });
  chart('cCat', 'doughnut', Object.keys(cat), Object.values(cat), 'Orders');

  const rows = filtered(), fd = done(rows), g = {};
  fd.forEach(o => { const key = o.username + '|' + o.service; (g[key] = g[key] || { u: o.username, s: o.service, n: 0, p: 0 }); g[key].n++; g[key].p += o.payout; });
  const pr = Object.values(g).sort((a, b) => a.u.localeCompare(b.u) || b.p - a.p);
  $('pay').innerHTML = '<tr><th>username</th><th>service completed</th><th>services done</th><th>payout</th></tr>' +
    (pr.map(x => `<tr><td>${esc(x.u)}</td><td>${esc(x.s)}</td><td>${x.n}</td><td>${peso(x.p)}</td></tr>`).join('') || '<tr><td colspan="4" class="mut">No completed orders in this range.</td></tr>') +
    (pr.length ? `<tr><th colspan="2">Total</th><th>${sum(pr, 'n')}</th><th>${peso(sum(pr, 'p'))}</th></tr>` : '');
  $('ord').innerHTML = '<tr><th>order</th><th>date</th><th>customer</th><th>handled by</th><th>service</th><th>method</th><th>price</th><th>payout</th><th>status</th><th></th></tr>' +
    (rows.map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.date.replace('T', ' ').slice(0, 16))}</td><td>${esc(o.customer)}</td><td>${esc(o.username)}</td><td>${esc(o.service)}</td><td>${esc(o.method)}</td>
      <td>${peso(o.payment)}</td><td>${peso(o.payout)}</td><td><span class="st ${o.status}">${o.status}</span></td>
      <td>${o.status === 'Pending' ? `<button class="sm ok" data-id="${esc(o.id)}" data-st="Done">Mark done</button> <button class="sm no" data-id="${esc(o.id)}" data-st="Cancelled">Cancel</button>` : ''}</td></tr>`).join('') ||
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
$('logout').onclick = logout;
$('refresh').onclick = () => load();
['from', 'to', 'fStatus', 'q'].forEach(id => $(id).addEventListener('input', () => DB && render()));
$('fAdd').onclick = async () => {
  const customer = $('fCust').value.trim(); if (!customer) { $('fMsg').textContent = 'Enter the customer username.'; return; }
  $('fAdd').disabled = true; $('fMsg').textContent = 'Saving…';
  const r = await SheetAPI.post({ action: 'log', ...S, customer, service: $('fSvc').value, method: $('fPay').value, handler: $('fWho').hidden ? '' : $('fWho').value });
  $('fAdd').disabled = false; $('fMsg').textContent = r.error || `Added ${r.id}`;
  if (r.ok) { $('fCust').value = ''; load(); }
};
$('ord').addEventListener('click', async e => {
  const b = e.target.closest('button[data-id]'); if (!b) return; b.disabled = true;
  const r = await SheetAPI.post({ action: 'status', ...S, id: b.dataset.id, status: b.dataset.st });
  if (r.error) alert(r.error); load();
});
setInterval(() => S && !document.hidden && load(), 60000);                 // auto refresh
try { S = JSON.parse(sessionStorage.getItem('bc_session')); } catch (e) {}
if (S) load().then(() => { if (S) { $('login').hidden = true; $('app').hidden = false; render(); } }).catch(() => logout());