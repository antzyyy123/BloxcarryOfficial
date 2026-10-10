// ===== EDIT YOUR LINKS HERE (used everywhere on the site) =====
document.head.insertAdjacentHTML('beforeend', '<link rel="icon" type="image/svg+xml" href="favicon.svg">');
const LINKS = {
  discord:   'https://discord.com/users/818726423141023776',
  messenger: 'https://www.messenger.com/t/Anthony.02.2005',
  facebook:  'https://www.facebook.com/profile.php?id=61595183523070',
  tiktok:    'https://www.tiktok.com/@anthonyojera',
  email:     'mailto:anthonyojera47@gmail.com'
};
const BRAND = 'BloxCarry';
const PAGES = [['index.html','Home'],['services.html','Services'],['about.html','About'],['faq.html','FAQ']];

(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  const logo = '<span class="icon-circle"><i class="bi bi-lightning-charge-fill"></i></span>'; // swap for <img class="navbar-logo" src="logo.png"> if you have a logo
  const socials = ['discord','facebook','tiktok','email'].map(k =>
    `<a class="social-circle" data-link="${k}" aria-label="${k}"><i class="bi bi-${k === 'email' ? 'envelope-fill' : k}"></i></a>`).join('');

  document.body.insertAdjacentHTML('afterbegin', '<canvas id="bg-orbs" aria-hidden="true"></canvas>');

  const nav = document.getElementById('site-nav');
  if (nav) nav.outerHTML = `
  <nav class="navbar navbar-expand-lg"><div class="container-fluid">
    <a class="navbar-brand" href="index.html">${logo}${BRAND}</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav ms-auto align-items-lg-center">
        ${PAGES.map(([f, n]) => `<li class="nav-item"><a class="nav-link${f === here ? ' active' : ''}" href="${f}">${n}</a></li>`).join('')}
      </ul>
      <a class="nav-contact-btn" href="contact.html">Contact</a>
    </div></div></nav>`;

  const foot = document.getElementById('site-footer');
  if (foot) foot.outerHTML = `
  <footer class="site-footer"><div class="container">
    <div class="row g-4">
      <div class="col-lg-5">
        <a class="navbar-brand mb-3" href="index.html">${logo}${BRAND}</a>
        <p style="color:#93b0ba;font-size:.9rem;max-width:340px">Safe, fast, and trusted Blox Fruits carries and help. Payment in peso or fruits.</p>
      </div>
      <div class="col-6 col-lg-3"><h4>Pages</h4>
        ${PAGES.map(([f, n]) => `<a class="f-link" href="${f}">${n}</a>`).join('')}<a class="f-link" href="contact.html">Contact</a>
      </div>
      <div class="col-6 col-lg-4"><h4>Find Me</h4><div class="social-row">${socials}</div></div>
    </div>
    <p class="footer-note">&copy; 2026 ${BRAND}. Not affiliated with, endorsed by, or sponsored by Roblox Corporation or Gamer Robot Inc. Blox Fruits is a Roblox experience.</p>
  </div></footer>`;

  // How It Works: curly question-mark button + modal
  document.body.insertAdjacentHTML('beforeend', `
  <button class="help-btn" data-bs-toggle="modal" data-bs-target="#howModal" aria-label="How it works" title="How it works"><i class="bi bi-question-circle"></i></button>
  <div class="modal fade" id="howModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content custom-modal">
    <div class="modal-header"><h5 class="modal-title"><i class="bi bi-question-circle"></i> How It Works</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
    <div class="modal-body">
      <div class="how-step"><span class="step-num">1</span><div><h3>Choose a service</h3><p>Pick what you need on the Services page.</p></div></div>
      <div class="how-step"><span class="step-num">2</span><div><h3>Message me</h3><p>Contact me on Discord or Messenger and tell me what you want.</p></div></div>
      <div class="how-step"><span class="step-num">3</span><div><h3>Agree and pay</h3><p>We confirm the details. Pay in peso or fruits or gamepasses.</p></div></div>
      <div class="how-step"><span class="step-num">4</span><div><h3>Get carried</h3><p>Join the session in-game and enjoy the run.</p></div></div>
      <p style="color:#ffc107;font-size:.85rem;margin:6px 0 0"><i class="bi bi-exclamation-triangle"></i> Never share your Roblox password. I will never ask for it.</p>
    </div>
  </div></div></div>
  <button id="scrollTopBtn" aria-label="Scroll to top" title="Back to top"><i class="bi bi-arrow-up"></i></button>`);

  // apply LINKS to every [data-link] element
  document.querySelectorAll('[data-link]').forEach(a => {
    const u = LINKS[a.dataset.link] || '#'; a.href = u;
    if (/^https?:/.test(u)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });

  // navbar shrink + scroll-to-top
  const bar = document.querySelector('.navbar'), top = document.getElementById('scrollTopBtn');
  function onScroll() { bar && bar.classList.toggle('is-scrolled', scrollY > 12); top.classList.toggle('show', scrollY > 300); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ===== LIGHTNING BACKGROUND =====

  (function () {
    const cv = document.getElementById('bg-orbs'), ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PAL = [[0,180,216],[72,229,255],[155,93,229],[160,200,255]];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    let W, H, bolts = [], sparks = [], rings = [], clouds = [], flash = 0;
    let mouse = { x: -999, y: -999, in: false }, lastMove = 0, down = 0, charging = false;

    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      clouds = Array.from({ length: 6 }, (_, i) => ({ x: i / 5 * W, y: 20 + Math.random() * 80, r: 220 + Math.random() * 200, vx: .08 + Math.random() * .12 }));
    }

    function jag(x1, y1, x2, y2, disp) {
      let pts = [[x1, y1], [x2, y2]];
      for (let d = disp; d > 3; d /= 2) {
        const out = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
          const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, off = (Math.random() - .5) * d;
          out.push([ax, ay], [(ax + bx) / 2 - dy / len * off, (ay + by) / 2 + dx / len * off]);
        }
        out.push(pts[pts.length - 1]); pts = out;
      }
      return pts;
    }

    function makeBolt(x1, y1, x2, y2, w, fade, branchy, col) {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const main = jag(x1, y1, x2, y2, Math.max(16, len * .35)), paths = [main];
      if (branchy) for (let i = 3; i < main.length - 2; i++) if (Math.random() < .1) {
        const [bx, by] = main[i], a = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - .5) * 1.6, l = 50 + Math.random() * 130;
        paths.push(jag(bx, by, bx + Math.cos(a) * l, by + Math.sin(a) * l, l * .4));
      }
      bolts.push({ paths, w, life: 1, fade, grow: len > 180 ? 0 : 1, col: col || PAL[(Math.random() * PAL.length) | 0] });
    }

    function strike(x, y, ch) {
      const n = 1 + Math.floor(ch * 3);
      for (let i = 0; i < n; i++) makeBolt(x + (Math.random() - .5) * (160 + ch * 300), -10, x, y, 2.2 + ch * 2.5, .03, true);
      const arcs = 5 + Math.floor(ch * 8);
      for (let i = 0; i < arcs; i++) { const a = Math.random() * 6.28, l = 40 + Math.random() * (70 + ch * 90); makeBolt(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 1.2, .06, false); }
      rings.push({ x, y, r: 4, a: .9, sp: 4 + ch * 4 }, { x, y, r: 2, a: .7, sp: 7 + ch * 5 });
      for (let i = 0; i < 16 + ch * 34; i++) { const a = Math.random() * 6.28, v = 1.5 + Math.random() * (4 + ch * 4); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, c: PAL[(Math.random() * 4) | 0] }); }
      flash = Math.min(.8 + ch * .7, 1.5);
    }

    function stroke(pts, n, w, color) {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }

    function frame(now) {
      // fade previous frame instead of clearing, so bolts leave a glowing afterimage
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // storm clouds light up with each flash
      for (const c of clouds) {
        c.x += c.vx; if (c.x - c.r > W) c.x = -c.r;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, `rgba(120,150,255,${.05 + flash * .18})`); g.addColorStop(1, 'rgba(120,150,255,0)');
        ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      if (flash > .02) { ctx.fillStyle = `rgba(110,200,255,${flash * .07})`; ctx.fillRect(0, 0, W, H); flash *= .9; }

      bolts = bolts.filter(b => b.life > 0);
      for (const b of bolts) {
        const a = Math.min(1, b.life) * (.65 + Math.random() * .35);
        for (const pts of b.paths) {
          const n = b.grow < 1 ? Math.max(2, Math.ceil(pts.length * b.grow)) : pts.length;
          stroke(pts, n, b.w * 8, rgba(b.col, a * .10));
          stroke(pts, n, b.w * 3, rgba(b.col, a * .45));
          stroke(pts, n, b.w, `rgba(255,255,255,${a})`);
        }
        if (b.grow < 1) b.grow = Math.min(1, b.grow + .2); else b.life -= b.fade;
      }

      sparks = sparks.filter(p => p.life > 0);
      for (const p of sparks) {
        p.x += p.vx; p.y += p.vy; p.vy += .1; p.vx *= .98; p.life -= .02;
        ctx.fillStyle = rgba(p.c, p.life); ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.28); ctx.fill();
      }
      rings = rings.filter(r => r.a > 0);
      for (const r of rings) { r.r += r.sp; r.a -= .025; ctx.strokeStyle = `rgba(72,229,255,${r.a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); }

      // plasma orb on the cursor: grows while charging, throws tesla arcs
      if (mouse.in) {
        const ch = charging ? Math.min((now - down) / 1200, 1) : 0;
        const r = 12 + ch * 36 + Math.sin(now / 120) * 2;
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r * 2.4);
        g.addColorStop(0, `rgba(255,255,255,${.5 + ch * .4})`); g.addColorStop(.25, `rgba(72,229,255,${.35 + ch * .3})`);
        g.addColorStop(.6, `rgba(155,93,229,${.12 + ch * .15})`); g.addColorStop(1, 'rgba(155,93,229,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r * 2.4, 0, 6.28); ctx.fill();
        if (Math.random() < .22 + ch * .7) { const a = Math.random() * 6.28, l = 25 + Math.random() * 40 + ch * 110; makeBolt(mouse.x, mouse.y, mouse.x + Math.cos(a) * l, mouse.y + Math.sin(a) * l, .8 + ch * 1.4, .16, ch > .4); }
        if (ch >= 1 && Math.random() < .08) rings.push({ x: mouse.x, y: mouse.y, r: 20, a: .6, sp: 3 });
      }

      if (Math.random() < .0025) { const x = Math.random() * W; makeBolt(x, -10, x + (Math.random() - .5) * 200, H * (.3 + Math.random() * .5), 1.6, .04, true); flash = .5; }
      requestAnimationFrame(frame);
    }

    function move(e) {
      const now = performance.now(), x = e.clientX, y = e.clientY;
      if (mouse.in && now - lastMove > 50 && Math.hypot(x - mouse.x, y - mouse.y) > 8) { makeBolt(mouse.x, mouse.y, x, y, 1, .12, false); lastMove = now; }
      mouse.x = x; mouse.y = y; mouse.in = true;
    }

    if (!reduce) {
      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerdown', e => { move(e); down = performance.now(); charging = true; });
      addEventListener('pointerup', e => {
        if (!charging) return;
        strike(e.clientX, e.clientY, Math.min((performance.now() - down) / 1200, 1));
        charging = false; if (e.pointerType === 'touch') mouse.in = false;
      });
      addEventListener('pointercancel', () => { charging = false; });
      document.addEventListener('mouseleave', () => { mouse.in = false; charging = false; });
      requestAnimationFrame(frame);
    }
    addEventListener('resize', size);
    size();
  })();
  (function () {
  const SCHEDULE = {
    1: [[20, 23]],                 // Monday
    2: [[13, 17], [20, 23]],       // Tuesday
    3: [[13, 17], [20, 23]],       // Wednesday
    4: [],                         // Thursday (closed)
    5: [],                         // Friday (closed)
    6: [[13, 17], [20, 23]],       // Saturday
    0: [[13, 17], [20, 23]]        // Sunday
  };
 
  const css = `
  .schedule-card{max-width:560px;margin:0 auto 40px;padding:24px;border-radius:16px;border:1px solid rgba(0,180,216,.25);background:rgba(255,255,255,.03)}
  .schedule-card h2{font-size:1.15rem;font-weight:700;color:#eaf6fa;margin:0 0 14px;display:flex;align-items:center;flex-wrap:wrap;gap:8px}
  .schedule-card h2 i{color:#00b4d8}
  .schedule-card h2 small{font-size:.75rem;font-weight:400;color:#93b0ba}
  .open-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:.85rem;font-weight:600}
  .open-pill i{font-size:.5rem}
  .open-pill.open{background:rgba(72,199,142,.12);color:#7be0b0;border:1px solid rgba(72,199,142,.35)}
  .open-pill.closed{background:rgba(255,99,99,.1);color:#ff9a9a;border:1px solid rgba(255,99,99,.3)}
  .sched-list{list-style:none;padding:0;margin:14px 0 0}
  .sched-list li{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:8px;font-size:.92rem;color:#cfeaf2;border:1px solid transparent}
  .sched-list li:nth-child(odd){background:rgba(255,255,255,.03)}
  .sched-list li.today{background:rgba(0,180,216,.15);border-color:rgba(0,180,216,.4)}
  .sched-list li em{font-style:normal;font-size:.7rem;color:#48e5ff;margin-left:6px;text-transform:uppercase}
  .sched-list li.closed-day span:last-child{color:#ff8a8a}
  .sched-list li span:last-child{text-align:right}
  .hero-alert-card.closed{background:rgba(255,99,99,.1);border-color:rgba(255,99,99,.3)}
  .hero-alert-card.closed:hover{background:rgba(255,99,99,.18)}
  .hero-alert-card.closed .alert-dot{background:#ff6363}
  .hero-alert-card.closed .alert-label{color:rgba(255,140,140,.85)}
  .hero-alert-card.closed .alert-sub{color:rgba(255,150,150,.75)}`;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');
 
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const fmt = h => ((h + 11) % 12 + 1) + ':00 ' + (h >= 12 ? 'PM' : 'AM');
  const range = s => s.length ? s.map(([a, b]) => fmt(a) + ' – ' + fmt(b)).join(' &amp; ') : 'Closed';
  const manila = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
 
  function status() {
    const n = manila(), d = n.getDay(), t = n.getHours() + n.getMinutes() / 60;
    for (const [a, b] of SCHEDULE[d]) if (t >= a && t < b) return { open: true, until: fmt(b) };
    for (let k = 0; k < 8; k++) {
      const dd = (d + k) % 7;
      for (const [a] of SCHEDULE[dd]) if (k > 0 || a > t)
        return { open: false, next: (k === 0 ? 'today' : k === 1 ? 'tomorrow' : DAYS[dd]) + ' ' + fmt(a) };
    }
    return { open: false, next: '' };
  }
 
  function render() {
    const st = status(), today = manila().getDay();
 
    const list = document.getElementById('schedList');           // Contact page
    if (list) list.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d =>
      `<li class="${d === today ? 'today' : ''} ${SCHEDULE[d].length ? '' : 'closed-day'}"><span>${DAYS[d]}${d === today ? ' <em>today</em>' : ''}</span><span>${range(SCHEDULE[d])}</span></li>`).join('');
 
    const pill = document.getElementById('openPill');            // Contact page
    if (pill) {
      pill.className = 'open-pill ' + (st.open ? 'open' : 'closed');
      pill.innerHTML = '<i class="bi bi-circle-fill"></i> ' + (st.open ? 'Open now · until ' + st.until : 'Closed · opens ' + st.next);
    }
 
    const card = document.querySelector('.hero-alert-card');     // Home page status card
    if (card) {
      card.classList.toggle('closed', !st.open);
      const num = card.querySelector('.alert-num'), sub = card.querySelector('.alert-sub');
      if (num) num.textContent = st.open ? 'Open' : 'Closed';
      if (sub) sub.textContent = st.open ? 'until ' + st.until + ' PHT' : 'opens ' + st.next;
    }
  }
  render(); setInterval(render, 60000);
})();
// shop.js: locked "Shop" item in the top bar + "Coming soon" modal. Add-on file: injects its own CSS.
(function () {
  const list = document.querySelector('.navbar-nav');
  if (!list) return;

  document.head.insertAdjacentHTML('beforeend', `<style>
    .nav-link.shop-link i { color: #ffb74d; font-size: .85em; margin-right: 4px; }
    .shop-modal-body { text-align: center; padding: 10px 6px 4px; }
    .shop-lock { width: 78px; height: 78px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; color: #ffb74d; background: rgba(255,183,77,.12); border: 1px solid rgba(255,183,77,.4); box-shadow: 0 0 24px rgba(255,183,77,.25); }
    .shop-modal-body h3 { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; }
    .shop-modal-body p { color: #9db9c2; font-size: .92rem; margin: 0 0 6px; }
  </style>`);

  list.insertAdjacentHTML('beforeend',
    '<li class="nav-item"><a class="nav-link shop-link" href="#" data-bs-toggle="modal" data-bs-target="#shopModal"><i class="bi bi-lock-fill"></i>Shop</a></li>');

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal fade" id="shopModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content custom-modal">
    <div class="modal-header"><h5 class="modal-title"><i class="bi bi-bag-fill"></i> Shop</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
    <div class="modal-body shop-modal-body">
      <div class="shop-lock"><i class="bi bi-lock-fill"></i></div>
      <h3>Coming Soon</h3>
      <p>The shop isn't open yet. Check back later!</p>
    </div>
  </div></div></div>`);
})();