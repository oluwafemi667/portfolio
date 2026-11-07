import gsap from 'gsap';

/* Hero: a live ledger of entries from the three projects.
   Entries arrive as "waiting", settle into their final state, and now and
   then a retry shows up and is ignored, because each entry is stored once.
   All entries are sample data. Pure DOM and CSS 3D, no WebGL. */

const POOL = [
  { app: 'farm', text: 'Eggs · Flock A · 412', end: 'saved' },
  { app: 'pay',  text: 'INV-1042 · ₦248,000', end: 'paid' },
  { app: 'mama', text: 'Mood check-in', end: 'logged' },
  { app: 'farm', text: 'Feed · Flock B · 6 bags', end: 'saved' },
  { app: 'pay',  text: 'checkout.success', end: 'verified' },
  { app: 'farm', text: 'Vaccination · Flock A', end: 'saved' },
  { app: 'pay',  text: 'checkout.pending', end: 'fallback' },
  { app: 'mama', text: 'Chat with Mama', end: 'replied' },
  { app: 'farm', text: 'Deaths · Flock B · 1', end: 'saved' },
  { app: 'pay',  text: 'INV-1043 · ₦31,500', end: 'sent' },
  { app: 'farm', text: 'Eggs · Flock C · 388', end: 'saved' },
  { app: 'mama', text: 'Mood check-in', end: 'logged' },
];

const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');

export function initHero(){
  const root = document.getElementById('heroLedger');
  const hero = root && root.closest('.hero');
  if (!root || !hero) return;
  hero.classList.add('hero--ledger');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isNarrow = () => window.innerWidth < 800;

  root.innerHTML = `
    <div class="ledger__tilt">
      <div class="ledger__sheet">
        <div class="ledger__bar"><span class="ledger__dot"></span><span class="ledger__title">LEDGER</span><span class="ledger__tag">sample data</span></div>
        <div class="ledger__cols"><span>ID</span><span>Entry</span><span>State</span></div>
        <div class="ledger__rows"></div>
        <div class="ledger__foot">
          <div class="ledger__stat"><b data-n="stored">0</b><span>entries stored</span></div>
          <div class="ledger__stat"><b data-n="dupes">0</b><span>repeats ignored</span></div>
          <div class="ledger__legend"><i class="k-farm"></i>Farmledger<i class="k-pay"></i>PayFlow<i class="k-mama"></i>MamaSpace</div>
        </div>
        <div class="ledger__spot"></div>
      </div>
      <div class="ledger__chips"></div>
    </div>`;

  const tilt = root.querySelector('.ledger__tilt');
  const sheet = root.querySelector('.ledger__sheet');
  const rows = root.querySelector('.ledger__rows');
  const chips = root.querySelector('.ledger__chips');
  const nStored = root.querySelector('[data-n="stored"]');
  const nDupes = root.querySelector('[data-n="dupes"]');

  let stored = 126, dupes = 4, cursor = 0;
  const recentIds = [];
  const maxRows = () => (isNarrow() ? 5 : 8);
  const ROW_H = 44;

  const bump = (el, v) => { el.textContent = v; if (!reduce) gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.4, ease: 'power3.out' }); };

  function makeRow(item, id, extra = ''){
    const el = document.createElement('div');
    el.className = `lrow k-${item.app} ${extra}`.trim();
    el.innerHTML = `<code>${id}</code><span class="lrow__t">${item.text}</span><em class="lrow__s is-wait">waiting</em>`;
    return el;
  }
  const settle = (el, label) => {
    const s = el.querySelector('.lrow__s');
    s.textContent = label; s.className = 'lrow__s is-done';
  };
  const trim = () => { while (rows.children.length > maxRows()) rows.lastElementChild.remove(); };

  function addEntry(animate){
    const item = POOL[cursor++ % POOL.length];
    const id = hex();
    recentIds.unshift(id); recentIds.length = Math.min(recentIds.length, 6);
    const el = makeRow(item, id);
    rows.prepend(el);
    if (animate){
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: ROW_H, opacity: 1, duration: 0.5, ease: 'power3.out', onComplete: trim });
      setTimeout(() => { settle(el, item.end); stored++; bump(nStored, stored); }, 900);
    } else {
      settle(el, item.end);
    }
    return el;
  }

  function addRepeat(){
    const id = recentIds[Math.min(2, recentIds.length - 1)] || hex();
    const el = makeRow({ app: 'farm', text: `retry of ${id}` }, id, 'is-repeat');
    rows.prepend(el);
    gsap.fromTo(el, { height: 0, opacity: 0 }, { height: ROW_H, opacity: 1, duration: 0.5, ease: 'power3.out' });
    setTimeout(() => {
      const s = el.querySelector('.lrow__s'); s.textContent = 'ignored'; s.className = 'lrow__s is-ignored';
      dupes++; bump(nDupes, dupes);
      chip(`Repeat of ${id} ignored`);
    }, 800);
    setTimeout(() => {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: () => el.remove() });
    }, 2600);
  }

  function chip(text){
    if (isNarrow()) return;
    const c = document.createElement('div');
    c.className = 'lchip';
    c.textContent = text;
    chips.appendChild(c);
    gsap.timeline({ onComplete: () => c.remove() })
      .fromTo(c, { opacity: 0, y: 16, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' })
      .to(c, { opacity: 0, y: -12, duration: 0.5, ease: 'power2.in' }, '+=1.6');
  }

  // Start with a settled ledger, so the first frame already looks like a product.
  for (let i = 0; i < maxRows(); i++) addEntry(false);

  if (reduce){
    root.classList.add('is-static');
    return;
  }

  /* ---- entrance, replayed every time the hero comes back into view ---- */
  const enter = () => {
    gsap.fromTo(root, { opacity: 0, x: isNarrow() ? 0 : 80, y: isNarrow() ? 30 : 0, scale: 0.94 },
      { opacity: 1, x: 0, y: 0, scale: 1, duration: 1.4, ease: 'power3.out', overwrite: 'auto' });
    gsap.fromTo(rows.children, { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.35, overwrite: 'auto' });
  };

  /* ---- pointer tilt and spotlight (mouse devices only) ---- */
  const base = () => (isNarrow() ? { x: 0, y: 0, z: 0 } : { x: 7, y: -16, z: 1.5 });
  gsap.set(tilt, { rotationX: base().x, rotationY: base().y, rotationZ: base().z });
  if (canHover){
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      if (isNarrow()) return;
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      const b = base();
      ry(b.y + px * 10); rx(b.x - py * 8);
      const r = sheet.getBoundingClientRect();
      sheet.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      sheet.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
  }
  gsap.to(tilt, { y: -8, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  /* ---- the stream: runs only while the hero is on screen ---- */
  let visible = true, timer = null, n = 0, wasOut = false;
  const tick = () => {
    timer = null;
    if (!visible || document.hidden) return;
    n++;
    if (n % 6 === 0) addRepeat(); else addEntry(true);
    timer = setTimeout(tick, 1250 + Math.random() * 450);
  };
  const start = () => { if (!timer && visible && !document.hidden) timer = setTimeout(tick, 600); };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible){ if (wasOut) enter(); wasOut = false; start(); }
    else { wasOut = true; clearTimeout(timer); timer = null; }
  }, { threshold: 0.15 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  window.addEventListener('resize', () => {
    const b = base();
    gsap.to(tilt, { rotationX: b.x, rotationY: b.y, rotationZ: b.z, duration: 0.4 });
    trim();
  });

  enter();
  start();
}
