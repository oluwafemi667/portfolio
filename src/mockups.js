import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import payflowSvg from './mockups/payflow.svg?raw';
import mamaspaceSvg from './mockups/mamaspace.svg?raw';

/* The two project mockups are inline SVG so their parts can be animated.
   Each one is a looping GSAP timeline that starts when the mockup scrolls
   into view and resets when it leaves, so it plays again on every visit.
   All names and figures are sample data. */

export function initMockups({ reduceMotion }){
  const pf = mount('mockPayflow', payflowSvg);
  const mm = mount('mockMamaspace', mamaspaceSvg);
  if (reduceMotion) return; // static, finished state
  if (pf) run(pf, payflow(pf));
  if (mm) run(mm, mamaspace(mm));
}

function mount(id, svg){
  const host = document.getElementById(id);
  if (!host) return null;
  host.innerHTML = svg;
  return host.querySelector('svg');
}

function run(svg, { tl, reset }){
  tl.pause(0);
  reset();
  ScrollTrigger.create({
    trigger: svg, start: 'top 85%', end: 'bottom 10%',
    onEnter: () => { reset(); tl.restart(); },
    onEnterBack: () => { reset(); tl.restart(); },
    onLeave: () => { tl.pause(0); reset(); },
    onLeaveBack: () => { tl.pause(0); reset(); },
  });
}

/* ---------------- PayFlow ---------------- */
function payflow(svg){
  const $ = (s) => svg.querySelector(s);
  const amount = $('#pf-amount'), status = $('#pf-status'), line = $('#pf-line');
  const len = line.getTotalLength();
  const money = (v) => '₦' + Math.round(v).toLocaleString('en-US') + '.00';
  const setStatus = (text, color) => { status.textContent = text; status.setAttribute('fill', color); };
  const counter = { v: 0 };

  const reset = () => {
    counter.v = 0; amount.textContent = money(0);
    setStatus('STATUS: DRAFT', '#9A9C9F');
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(['#pf-dot', '#pf-halo'], { opacity: 0 });
    gsap.set(['#pf-w1', '#pf-w2', '#pf-w3'], { opacity: 0, x: -10 });
    gsap.set(['#pf-t1', '#pf-t2', '#pf-t3'], { opacity: 0, x: -14 });
    gsap.set('#pf-amount', { scale: 1, transformOrigin: 'left center' });
  };

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3.5, defaults: { ease: 'power3.out' } });
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
  return { tl, reset };
}

/* ---------------- MamaSpace ---------------- */
function mamaspace(svg){
  const $ = (s) => svg.querySelector(s);
  const line = $('#mm-line');
  const len = line.getTotalLength();
  const dots = svg.querySelectorAll('#mm-dots circle');

  const reset = () => {
    gsap.set(['#mm-b1', '#mm-b3'], { opacity: 0, x: -18 });
    gsap.set('#mm-b2', { opacity: 0, x: 18 });
    gsap.set(['#mm-typing1', '#mm-typing2'], { opacity: 0 });
    gsap.set(svg.querySelectorAll('.td'), { y: 0 });
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set('#mm-ring', { opacity: 0 });
    gsap.set('#mm-logged', { opacity: 0, y: 8 });
  };

  const typing = (tl, id, at, dur) => {
    tl.set(id, { opacity: 1 }, at);
    svg.querySelectorAll(id + ' .td').forEach((d, i) => {
      tl.to(d, { y: -5, duration: 0.25, yoyo: true, repeat: Math.floor(dur / 0.5), ease: 'sine.inOut' }, at + i * 0.12);
    });
    tl.set(id, { opacity: 0 }, at + dur);
  };

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3.5, defaults: { ease: 'power3.out' } });
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
  return { tl, reset };
}
