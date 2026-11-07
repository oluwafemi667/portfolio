import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   NAV SCROLL STATE
============================================================ */
const nav = document.querySelector('.nav');
if (nav){
  const toggleNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();
}

/* ============================================================
   CUSTOM CURSOR (pointer devices only)
============================================================ */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
if (canHover && dot && ring){
  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  }, { passive: true });
  (function loop(){
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, [data-tilt]').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
}

/* ============================================================
   MAGNETIC BUTTONS + 3D PRESS
============================================================ */
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  let ox = 0, oy = 0, pressed = false;
  const apply = () => {
    el.style.transform = `translate(${ox}px, ${oy + (pressed ? 5 : 0)}px)`;
    el.classList.toggle('is-pressed', pressed);
  };
  if (canHover){
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      ox = (e.clientX - r.left - r.width / 2) * 0.25;
      oy = (e.clientY - r.top - r.height / 2) * 0.4;
      apply();
    });
  }
  el.addEventListener('mouseleave', () => { ox = 0; oy = 0; pressed = false; apply(); });
  el.addEventListener('mousedown', () => { pressed = true; apply(); });
  el.addEventListener('mouseup', () => { pressed = false; apply(); });
  el.addEventListener('touchstart', () => { pressed = true; apply(); }, { passive: true });
  el.addEventListener('touchend', () => { pressed = false; apply(); });
});

/* ============================================================
   TILT (pointer devices only)
============================================================ */
if (canHover && !reduceMotion){
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
    });
  });
}

/* ============================================================
   TECH STRIP: duplicate the list for a seamless loop, and keep
   the copy out of the accessibility tree
============================================================ */
const track = document.getElementById('stripTrack');
if (track){
  const copy = track.cloneNode(true);
  copy.removeAttribute('id');
  [...copy.children].forEach((n) => track.appendChild(n));
  [...track.children].forEach((n, i) => { if (i >= track.children.length / 2) n.setAttribute('aria-hidden', 'true'); });
}

/* ============================================================
   GSAP SCROLL REVEALS
============================================================ */
gsap.utils.toArray('[data-reveal]').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: i * 0.08,
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
  });
});
gsap.utils.toArray('.project').forEach((el) => {
  gsap.from(el, {
    opacity: 0, y: 40, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
  });
});
gsap.utils.toArray('.practice__card').forEach((el, i) => {
  gsap.from(el, {
    opacity: 0, y: 24, duration: 0.8, delay: (i % 3) * 0.05, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
  });
});

/* ============================================================
   HERO SCULPTURE: loaded after first paint so Three.js (the
   bulk of the bundle) never blocks the page
============================================================ */
const loadHero = () => {
  import('./hero.js').then((m) => m.initHero()).catch(() => {
    document.getElementById('heroCanvas')?.classList.add('is-failed');
  });
};
if ('requestIdleCallback' in window) requestIdleCallback(loadHero, { timeout: 1500 });
else setTimeout(loadHero, 400);

/* ============================================================
   FARMLEDGER SYNC DIAGRAM
   Shows the real mechanism: entries wait on the device while
   offline, send when the signal returns, and a repeated send is
   ignored by the server. Sample data only.
============================================================ */
(function syncDiagram(){
  const queue = document.getElementById('syncQueue');
  const db = document.getElementById('syncDb');
  const status = document.getElementById('syncStatus');
  const dotEl = document.getElementById('syncDot');
  const foot = document.getElementById('syncFoot');
  if (!queue || !db || !status || !foot) return;

  const entries = [
    { id: 'a41f', text: 'Eggs, Flock A, 412' },
    { id: 'b07c', text: 'Feed, Flock A, 6 bags' },
    { id: 'c92d', text: 'Deaths, Flock B, 1' },
  ];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const row = (e, cls, tag) => {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = `<code>${e.id}</code><span>${e.text}</span><em>${tag}</em>`;
    return li;
  };
  const setStatus = (text, online) => {
    status.textContent = text;
    dotEl.classList.toggle('is-online', online);
  };

  // Reduced motion: show the finished state, no loop.
  if (reduceMotion){
    setStatus('Online', true);
    entries.forEach((e) => { queue.appendChild(row(e, 'is-sent', 'sent')); db.appendChild(row(e, 'is-saved', 'saved')); });
    foot.textContent = 'A repeated send is ignored. Each entry is stored once.';
    return;
  }

  let alive = false;
  async function cycle(){
    while (alive){
      queue.innerHTML = ''; db.innerHTML = ''; foot.textContent = ' ';
      setStatus('No signal', false);
      await sleep(600);
      const items = [];
      for (const e of entries){
        if (!alive) return;
        const li = row(e, 'is-waiting', 'waiting');
        queue.appendChild(li); items.push(li);
        await sleep(700);
      }
      await sleep(900);
      setStatus('Signal back, syncing', true);
      await sleep(600);
      for (let i = 0; i < entries.length; i++){
        if (!alive) return;
        items[i].className = 'is-sent'; items[i].querySelector('em').textContent = 'sent';
        db.appendChild(row(entries[i], 'is-saved', 'saved'));
        await sleep(650);
      }
      setStatus('Online', true);
      await sleep(900);
      foot.textContent = 'Retry of a41f: ignored, already stored.';
      const dupe = db.firstElementChild;
      dupe.classList.add('is-ping');
      await sleep(3400);
      dupe.classList.remove('is-ping');
    }
  }
  // Run only while the diagram is on screen.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !alive){ alive = true; cycle(); }
    else if (!entry.isIntersecting){ alive = false; }
  }, { threshold: 0.35 }).observe(queue.closest('.sync'));
})();

/* ============================================================
   CONTACT FORM
   Posts to Netlify Forms in the background and confirms on the
   page. Locally it only demonstrates the UI states.
============================================================ */
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form && note){
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    button.disabled = true;
    note.textContent = 'Sending...';
    try {
      if (local){
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const body = new URLSearchParams(new FormData(form)).toString();
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!res.ok) throw new Error(String(res.status));
      }
      form.reset();
      note.textContent = local
        ? 'Looks good locally. Real submissions go to Netlify once deployed.'
        : 'Message sent. I usually reply within a day.';
    } catch {
      note.textContent = 'That did not send. Please email me directly instead.';
    } finally {
      button.disabled = false;
    }
  });
}
