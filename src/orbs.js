import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { noiseGLSL } from './noise.js';

/* Two small ambient scenes, each in its own canvas and loaded only when its
   section is near the screen:
     contactBlob  a glass blob that breathes, behind the contact form
     aboutOrbit   a gyroscope of rings and nodes around the portrait
   Each one runs while visible, pauses when off screen, and plays its
   entrance again every time it comes back into view. */

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function stage(host, fov, z){
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50);
  camera.position.set(0, 0, z);
  const fit = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  fit();
  window.addEventListener('resize', fit);
  return { canvas, renderer, scene, camera };
}

/* Runs `frame` while the host is visible; calls `enter` on every re-entry. */
function lifecycle(host, canvas, { frame, enter, still }){
  if (reduce()){ still(); canvas.classList.add('is-ready'); return; }
  let running = false, last = 0;
  const loop = (t) => { if (!running) return; frame(t, Math.min((t - last) / 1000, 0.05)); last = t; requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running){
      running = true; last = performance.now(); enter(); canvas.classList.add('is-ready'); requestAnimationFrame(loop);
    } else if (!e.isIntersecting){ running = false; }
  }, { threshold: 0.1 }).observe(host);
}

/* ---------- Contact: glass blob ---------- */
export function contactBlob(host){
  const { canvas, renderer, scene, camera } = stage(host, 38, 7);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const small = host.clientWidth < 480;
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x0d0e10, roughness: 0.06, transmission: 1, thickness: 1.4, ior: 1.4,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 }; mat.userData.sh = sh;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\n${noiseGLSL}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * snoise(position * 1.1 + vec3(0.0, 0.0, uTime * 0.15)) * 0.17;`);
  };
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, small ? 10 : 20), mat);
  scene.add(blob);
  const key = new THREE.PointLight(0x8f7bf0, 9, 20); key.position.set(3, 2, 4); scene.add(key);
  const rim = new THREE.PointLight(0xf2b84b, 6, 20); rim.position.set(-3, -1, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const draw = () => { if (mat.userData.sh) mat.userData.sh.uniforms.uTime.value = performance.now() / 1000; renderer.render(scene, camera); };
  lifecycle(host, canvas, {
    still: draw,
    enter: () => { blob.scale.setScalar(0.01); gsap.to(blob.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'power3.out' }); },
    frame: (t, dt) => {
      if (mat.userData.sh) mat.userData.sh.uniforms.uTime.value = t / 1000;
      blob.rotation.y += dt * 0.12; blob.rotation.x += dt * 0.04;
      renderer.render(scene, camera);
    },
  });
}

/* ---------- About: gyroscope around the portrait ---------- */
export function aboutOrbit(host){
  const { canvas, renderer, scene, camera } = stage(host, 36, 9);
  const root = new THREE.Group(); scene.add(root);
  const ringColor = [0x8f7bf0, 0xf2b84b, 0xc9bdf5];
  const ringMat = (c) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.85 });
  const circle = (r) => {
    const p = []; for (let i = 0; i <= 128; i++){ const a = (i / 128) * Math.PI * 2; p.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    return new THREE.BufferGeometry().setFromPoints(p);
  };
  const rings = [2.5, 2.05, 1.65].map((r, i) => {
    const g = new THREE.Group();
    g.add(new THREE.LineLoop(circle(r), ringMat(ringColor[i])));
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshBasicMaterial({ color: ringColor[i] }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), new THREE.MeshBasicMaterial({ color: ringColor[i], transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    node.add(halo); g.add(node);
    g.rotation.set([1.2, 0.5, -0.9][i], [0.3, 1.0, -0.4][i], 0);
    root.add(g);
    return { g, node, r, speed: 0.7 + i * 0.35, spin: [0.05 + i * 0.03, 0.08 - i * 0.02] };
  });
  // a lattice of faint points on a sphere, like a data shell
  const N = 360, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++){
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
    pos.set([Math.cos(th) * rad * 2.9, y * 2.9, Math.sin(th) * rad * 2.9], i * 3);
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const shell = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc9bdf5, size: 0.035, transparent: true, opacity: 0.55 }));
  root.add(shell);
  const draw = () => renderer.render(scene, camera);
  const place = (t) => rings.forEach((o) => { const a = t * o.speed; o.node.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0); });
  lifecycle(host, canvas, {
    still: () => { place(0.8); draw(); },
    enter: () => { root.scale.setScalar(0.01); gsap.to(root.scale, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'back.out(1.4)' }); },
    frame: (t, dt) => {
      place(t / 1000);
      rings.forEach((o) => { o.g.rotation.x += dt * o.spin[0]; o.g.rotation.y += dt * o.spin[1]; });
      shell.rotation.y += dt * 0.06;
      draw();
    },
  });
}
