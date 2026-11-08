import * as THREE from 'three';
import gsap from 'gsap';

/* Hero: an exploded view of a web app. Five layers (Interface, API, Auth,
   Database, Integrations) float apart, and requests travel down through them
   and back up, forever, while the hero is on screen. Leaving the screen pauses
   it, coming back plays the entrance again. Generic on purpose: it describes
   how I build, not any single project. Loaded lazily from main.js. */

const ACCENT = 0x6e56cf;
const AMBER = 0xf2b84b;

const LAYERS = [
  { name: 'INTERFACE', lines: ['<Dashboard />', 'loading: false', 'optimistic update'] },
  { name: 'API', lines: ['POST /v1/entries', '201 created', 'validated, typed'] },
  { name: 'AUTH', lines: ['session: valid', 'policy: row-level', 'allow'] },
  { name: 'DATABASE', lines: ['entries  ▪▪▪▪▪▪', 'index: user_id', 'stored once'] },
  { name: 'INTEGRATIONS', lines: ['webhook: verified', 'retry: backoff', 'queue: 0'] },
];

function layerTexture(layer, index){
  const w = 640, h = 400, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(17,18,22,0.92)';
  g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 28); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#9A9C9F';
  g.font = '500 26px "JetBrains Mono", ui-monospace, monospace';
  g.fillText(String(index + 1).padStart(2, '0'), 40, 70);
  g.fillStyle = '#EDEDEE';
  g.font = '600 34px "JetBrains Mono", ui-monospace, monospace';
  g.fillText(layer.name, 100, 70);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(40, 100, w - 80, 2);
  g.font = '400 30px "JetBrains Mono", ui-monospace, monospace';
  layer.lines.forEach((t, i) => {
    g.fillStyle = i === 0 ? '#C9BDF5' : '#9A9C9F';
    g.fillText(t, 40, 170 + i * 66);
  });
  g.fillStyle = '#6E56CF'; g.beginPath(); g.arc(w - 56, 62, 9, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function initHero(){
  const canvas = document.getElementById('heroCanvas');
  const hero = canvas && canvas.closest('.hero');
  if (!canvas || !hero) return;
  hero.classList.add('hero--system');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.4, 13);

  const rig = new THREE.Group();   // pointer parallax
  const stack = new THREE.Group(); // fixed isometric tilt
  rig.add(stack); scene.add(rig);
  stack.rotation.set(0.5, -0.62, 0.04);

  const W = 3.4, H = 2.12, GAP = 1.3;
  const layers = LAYERS.map((l, i) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: layerTexture(l, i), transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
    plane.rotation.x = -Math.PI / 2; // lie flat, the stack tilt shows them
    const glowMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.16, H + 0.16), glowMat);
    glow.rotation.x = -Math.PI / 2; glow.position.y = -0.01;
    group.add(glow, plane);
    stack.add(group);
    return { group, glowMat, y: (2 - i) * GAP, pulse: 0 };
  });

  // corner rails joining the layers
  const railMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 });
  const railGeo = new THREE.BufferGeometry();
  const top = 2 * GAP, bottom = -2 * GAP;
  const pts = [];
  [[-W / 2, -H / 2], [W / 2, -H / 2], [-W / 2, H / 2], [W / 2, H / 2]].forEach(([x, z]) => { pts.push(x, top, z, x, bottom, z); });
  railGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const rails = new THREE.LineSegments(railGeo, railMat);
  stack.add(rails);

  // travelling requests
  const packets = [0, 0.33, 0.66].map((offset, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), new THREE.MeshBasicMaterial({ color: i === 1 ? AMBER : 0xb8a9ff }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: i === 1 ? AMBER : ACCENT, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.add(halo); stack.add(m);
    return { m, offset, x: (i - 1) * 0.8, z: (1 - i) * 0.35 };
  });

  const state = { spread: reduce ? 1 : 0, alpha: reduce ? 1 : 0 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  function layout(){
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const unit = 7.45 / h;            // world units per pixel at the scene depth
    if (w < 800){
      rig.scale.setScalar(Math.min(0.62, w / 700));
      rig.position.set(0, -(h / 2 - 215) * unit, 0);
    } else {
      rig.scale.setScalar(Math.min(0.86, w / 1500 + 0.1));
      rig.position.set(w * 0.2 * unit, -0.2, 0);
    }
  }

  function frame(t){
    pointer.sx += (pointer.x - pointer.sx) * 0.06;
    pointer.sy += (pointer.y - pointer.sy) * 0.06;
    rig.rotation.y = pointer.sx * 0.28;
    rig.rotation.x = -pointer.sy * 0.16;
    const sp = state.spread;
    layers.forEach((l) => {
      l.group.position.y = l.y * sp;
      l.pulse *= 0.93;
      l.glowMat.opacity = l.pulse * 0.5 * state.alpha;
      l.group.children[1].material.opacity = state.alpha;
    });
    railMat.opacity = 0.14 * state.alpha * sp;
    const span = top - bottom;
    packets.forEach((p) => {
      const ph = ((t * 0.00011 + p.offset) % 1) * 2;          // 0..2
      const k = ph < 1 ? ph : 2 - ph;                          // down then back up
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const y = (top - e * span) * sp;
      p.m.position.set(p.x, y, p.z);
      p.m.visible = state.alpha > 0.05 && sp > 0.3;
      layers.forEach((l) => { if (Math.abs(y - l.y * sp) < 0.09) l.pulse = 1; });
    });
    renderer.render(scene, camera);
  }

  function intro(){
    gsap.killTweensOf(state);
    state.spread = 0; state.alpha = 0;
    gsap.to(state, { alpha: 1, duration: 0.8, ease: 'power2.out' });
    gsap.to(state, { spread: 1, duration: 1.8, delay: 0.25, ease: 'power3.out' });
  }

  layout();
  window.addEventListener('resize', layout);

  if (reduce){
    frame(0);
    canvas.classList.add('is-ready');
    return;
  }

  if (canHover){
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  }

  let running = false;
  const loop = (t) => { if (!running) return; frame(t); requestAnimationFrame(loop); };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running){
      running = true; intro(); canvas.classList.add('is-ready'); requestAnimationFrame(loop);
    } else if (!entry.isIntersecting){
      running = false;
    }
  }, { threshold: 0.15 }).observe(hero);
}
