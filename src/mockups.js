import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import payflowSvg from './mockups/payflow.svg?raw';
import mamaspaceSvg from './mockups/mamaspace.svg?raw';

/* The two project mockups are inline SVG, split into stacked layers.
   Each one runs an endless GSAP loop while it is on screen:
     1. the interface plays out (numbers count up, chat appears)
     2. the pieces lift off the page into floating 3D layers
     3. they hold, then settle back down
     4. repeat
   Scrolling away resets it, and scrolling back starts it again.
   All names and figures are sample data. */

const NS = 'http://www.w3.org/2000/svg';
const REF_WIDTH = 612; // desktop width the z values below were tuned for

export function initMockups({ reduceMotion }){
  const pf = mount('mockPayflow', payflowSvg);
  const mm = mount('mockMamaspace', mamaspaceSvg);
  if (reduceMotion) return; // static, finished, flat
  if (pf) run(pf, payflow(pf));
  if (mm) run(mm, mamaspace(mm));
}

function mount(id, svgText){
  const host = document.getElementById(id);
  if (!host) return null;
  host.innerHTML = svgText;
  return host;
}

/* Move chosen groups out of the base SVG into their own SVG layers, stacked in a 3D stage. */
function layerize(host, defs){
  const base = host.querySelector('svg');
  const stage = document.createElement('div');
  stage.className = 'mock__stage';
  host.appendChild(stage);
  stage.appendChild(base);
  base.classList.add('mock__base');
  const layers = defs.map((d) => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', base.getAttribute('viewBox'));
    s.setAttribute('class', 'mock__layer');
    s.setAttribute('aria-hidden', 'true');
    d.sel.forEach((q) => { const n = base.querySelector(q); if (n) s.appendChild(n); });
    stage.appendChild(s);
    return { el: s, z: d.z };
  });
  return { stage, layers };
}

function run(host, { tl, reset }){
  tl.pause(0);
  reset();
  ScrollTrigger.create({
    trigger: host, start: 'top 90%', end: 'bottom 5%',
    onEnter: () => { reset(); tl.restart(); },
    onEnterBack: () => { reset(); tl.restart(); },
    onLeave: () => { tl.pause(0); reset(); },
    onLeaveBack: () => { tl.pause(0); reset(); },
  });
}

/* Lift the layers into 3D at time `at`, hold, then settle back. Returns the end time. */
function lift(tl, stage, layers, host, at, hold){
  const els = layers.map((l) => l.el);
  const k = () => (host.clientWidth || REF_WIDTH) / REF_WIDTH;
  const lifted = 'drop-shadow(0px 28px 26px rgba(0,0,0,.6))';
  const flat = 'drop-shadow(0px 0px 0px rgba(0,0,0,0))';
  tl.to(stage, { rotationX: 9, rotationY: -15, scale: 0.92, duration: 1.1, ease: 'power3.inOut' }, at)
    .to(els, { z: (i) => layers[i].z * k(), filter: lifted, duration: 1.1, ease: 'power3.inOut' }, at)
    .to(stage, { rotationX: 0, rotationY: 0, scale: 1, duration: 1, ease: 'power3.inOut' }, at + 1.1 + hold)
    .to(els, { z: 0, filter: flat, duration: 1, ease: 'power3.inOut' }, at + 1.1 + hold);
  return at + 2.1 + hold;
}

const resetLayers = (stage, layers) => {
  gsap.set(stage, { rotationX: 0, rotationY: 0, scale: 1 });
  gsap.set(layers.map((l) => l.el), { z: 0, filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' });
};

/* ---------------- PayFlow ---------------- */
function payflow(host){
  const { stage, layers } = layerize(host, [
    { sel: ['#pf-head'], z: 46 },
    { sel: ['#pf-chart'], z: 84 },
    { sel: ['#pf-hooks'], z: 118 },
    { sel: ['#pf-tx'], z: 62 },
  ]);
  const $ = (s) => host.querySelector(s);
  const amount = $('#pf-amount'), status = $('#pf-status'), line = $('#pf-line');
  const len = line.getTotalLength();
  const money = (v) => '₦' + Math.round(v).toLocaleString('en-US') + '.00';
  const setStatus = (text, color) => { status.textContent = text; status.setAttribute('fill', color); };
  const counter = { v: 0 };

  const reset = () => {
    resetLayers(stage, layers);
    counter.v = 0; amount.textContent = money(0);
    setStatus('STATUS: DRAFT', '#9A9C9F');
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(['#pf-dot', '#pf-halo'], { opacity: 0 });
    gsap.set(['#pf-w1', '#pf-w2', '#pf-w3'], { opacity: 0, x: -10 });
    gsap.set(['#pf-t1', '#pf-t2', '#pf-t3'], { opacity: 0, x: -14 });
    gsap.set('#pf-amount', { scale: 1, transformOrigin: 'left center' });
  };

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, defaults: { ease: 'power3.out' } });
  tl.call(reset, null, 0)
    .to(counter, { v: 248000, duration: 1.4, ease: 'power2.out', onUpdate: () => { amount.textContent = money(counter.v); } }, 0.2)
    .call(() => setStatus('STATUS: AWAITING PAYMENT', '#F2B84B'), null, 1.2)
    .to(line, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.6)
    .to('#pf-dot', { opacity: 1, duration: 0.3 }, 2.1)
    .to('#pf-w1', { opacity: 1, x: 0, duration: 0.5 }, 1.4)
    .to('#pf-w2', { opacity: 1, x: 0, duration: 0.5 }, 2.2)
    .to('#pf-w3', { opacity: 1, x: 0, duration: 0.5 }, 3.2)
    .call(() => setStatus('STATUS: PAID', '#6E56CF'), null, 3.4)
    .fromTo('#pf-amount', { scale: 1 }, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 3.4)
    .fromTo('#pf-halo', { opacity: 0.9, attr: { r: 5 } }, { opacity: 0, attr: { r: 22 }, duration: 0.9, ease: 'power2.out' }, 3.4)
    .to('#pf-t1', { opacity: 1, x: 0, duration: 0.45 }, 3.8)
    .to('#pf-t2', { opacity: 1, x: 0, duration: 0.45 }, 4.0)
    .to('#pf-t3', { opacity: 1, x: 0, duration: 0.45 }, 4.2);
  lift(tl, stage, layers, host, 5.2, 3.2);
  return { tl, reset };
}

/* ---------------- MamaSpace ---------------- */
function mamaspace(host){
  const { stage, layers } = layerize(host, [
    { sel: ['#mm-typing1', '#mm-b1'], z: 70 },
    { sel: ['#mm-b2'], z: 112 },
    { sel: ['#mm-typing2', '#mm-b3'], z: 84 },
    { sel: ['#mm-mood'], z: 48 },
  ]);
  const $ = (s) => host.querySelector(s);
  const line = $('#mm-line');
  const len = line.getTotalLength();
  const dots = host.querySelectorAll('#mm-dots circle');

  const reset = () => {
    resetLayers(stage, layers);
    gsap.set(['#mm-b1', '#mm-b3'], { opacity: 0, x: -18 });
    gsap.set('#mm-b2', { opacity: 0, x: 18 });
    gsap.set(['#mm-typing1', '#mm-typing2'], { opacity: 0 });
    gsap.set(host.querySelectorAll('.td'), { y: 0 });
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set('#mm-ring', { opacity: 0 });
    gsap.set('#mm-logged', { opacity: 0, y: 8 });
  };

  const typing = (tl, id, at, dur) => {
    tl.set(id, { opacity: 1 }, at);
    host.querySelectorAll(id + ' .td').forEach((d, i) => {
      tl.to(d, { y: -5, duration: 0.25, yoyo: true, repeat: Math.floor(dur / 0.5), ease: 'sine.inOut' }, at + i * 0.12);
    });
    tl.set(id, { opacity: 0 }, at + dur);
  };

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, defaults: { ease: 'power3.out' } });
  tl.call(reset, null, 0);
  typing(tl, '#mm-typing1', 0.3, 0.9);
  tl.to('#mm-b1', { opacity: 1, x: 0, duration: 0.5 }, 1.2)
    .to('#mm-b2', { opacity: 1, x: 0, duration: 0.5 }, 2.2);
  typing(tl, '#mm-typing2', 3.0, 1.0);
  tl.to('#mm-b3', { opacity: 1, x: 0, duration: 0.5 }, 4.0)
    .to(dots, { scale: 1, duration: 0.45, stagger: 0.14, ease: 'back.out(2.4)' }, 4.6)
    .to(line, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 4.6)
    .fromTo('#mm-ring', { opacity: 1, attr: { r: 14 } }, { opacity: 0, attr: { r: 26 }, duration: 0.9, ease: 'power2.out' }, 5.8)
    .to('#mm-logged', { opacity: 1, y: 0, duration: 0.5 }, 6.1);
  lift(tl, stage, layers, host, 7.2, 3.2);
  return { tl, reset };
}
