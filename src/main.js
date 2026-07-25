import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   NAV SCROLL STATE
============================================================ */
const nav = document.querySelector('.nav');
if (nav){
  const toggleNav = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();
}

/* ============================================================
   CUSTOM CURSOR
============================================================ */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

window.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px'; dot.style.top = my + 'px';
});
(function loop(){
  rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, [data-tilt]').forEach(el=>{
  el.addEventListener('mouseenter', ()=> ring.classList.add('is-active'));
  el.addEventListener('mouseleave', ()=> ring.classList.remove('is-active'));
});

/* ============================================================
   MAGNETIC BUTTONS + 3D PRESS
============================================================ */
document.querySelectorAll('[data-magnetic]').forEach(el=>{
  let ox = 0, oy = 0, pressed = false;

  const apply = () => {
    const pressY = pressed ? 5 : 0;
    el.style.transform = `translate(${ox}px, ${oy + pressY}px)`;
    el.classList.toggle('is-pressed', pressed);
  };

  el.addEventListener('mousemove', (e)=>{
    const r = el.getBoundingClientRect();
    ox = (e.clientX - r.left - r.width/2) * 0.25;
    oy = (e.clientY - r.top - r.height/2) * 0.4;
    apply();
  });
  el.addEventListener('mouseleave', ()=>{ ox = 0; oy = 0; pressed = false; apply(); });
  el.addEventListener('mousedown', ()=>{ pressed = true; apply(); });
  el.addEventListener('mouseup', ()=>{ pressed = false; apply(); });
  el.addEventListener('touchstart', ()=>{ pressed = true; apply(); }, { passive:true });
  el.addEventListener('touchend', ()=>{ pressed = false; apply(); });
});

/* ============================================================
   TILT ON PROJECT FRAMES / PRACTICE CARDS / PHOTO
============================================================ */
document.querySelectorAll('[data-tilt]').forEach(el=>{
  el.addEventListener('mousemove', (e)=>{
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px*8}deg) rotateX(${-py*8}deg)`;
  });
  el.addEventListener('mouseleave', ()=>{ el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; });
});

/* ============================================================
   GSAP SCROLL REVEALS
============================================================ */
gsap.utils.toArray('[data-reveal]').forEach((el, i)=>{
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: i * 0.08,
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  });
});

gsap.utils.toArray('.project').forEach(el=>{
  gsap.from(el, {
    opacity: 0, y: 40, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true }
  });
});

gsap.utils.toArray('.practice__card').forEach((el,i)=>{
  gsap.from(el, {
    opacity: 0, y: 24, duration: .8, delay: i*0.05, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true }
  });
});

/* ============================================================
   PROCEDURAL GLASS SCULPTURE — noise-displaced icosahedron
   Built entirely from geometry + shader math, no external
   models. The distortion is what keeps it from reading as
   "stock 3D primitive."
============================================================ */
const noiseGLSL = `
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

function initHero(){
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = window.innerWidth, height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width/height, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // procedural environment for realistic glass reflections (no external HDRI file)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  // --- the sculpture: noise-displaced icosahedron, glass material ---
  const geometry = new THREE.IcosahedronGeometry(1.6, 24);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0d0e10,
    metalness: 0.1,
    roughness: 0.06,
    transmission: 1.0,
    thickness: 1.4,
    ior: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.3,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uAmp = { value: 0.16 };
    material.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uAmp;\n${noiseGLSL}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float n = snoise(position * 1.1 + vec3(0.0, 0.0, uTime * 0.15));
        transformed += normal * n * uAmp;`
      );
  };

  const sculpture = new THREE.Mesh(geometry, material);
  sculpture.position.x = 2.6;
  scene.add(sculpture);

  // --- lighting: rim + key light, cursor-driven ---
  const key = new THREE.PointLight(0x6e56cf, 6, 20);
  key.position.set(3, 2, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0xf2b84b, 3.5, 20);
  rim.position.set(-3, -1, -3);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // --- floating particle field for depth ---
  const particleCount = 140;
  const positions = new Float32Array(particleCount * 3);
  for (let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 14;
    positions[i*3+1] = (Math.random()-0.5) * 8;
    positions[i*3+2] = (Math.random()-0.5) * 8 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xE9E6DF, size: 0.02, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- bloom post-processing ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.7, 0.15);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // --- mouse reactivity: camera parallax + light follows cursor ---
  let targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e)=>{
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  const clock = new THREE.Clock();

  // cinematic entrance
  sculpture.scale.setScalar(0.001);
  gsap.to(sculpture.scale, { x:1, y:1, z:1, duration: 1.6, ease: 'power3.out', delay: 0.2 });

  function animate(){
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    if (material.userData.shader) material.userData.shader.uniforms.uTime.value = t;

    if (!reduceMotion){
      sculpture.rotation.y += dt * 0.12;
      sculpture.rotation.x += dt * 0.04;

      camera.position.x += (targetX * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (-targetY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0,0,0);

      key.position.x = 3 + targetX * 3;
      key.position.y = 2 - targetY * 3;

      particles.rotation.y += dt * 0.01;
    }

    composer.render();
  }
  animate();

  window.addEventListener('resize', ()=>{
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  });
}
initHero();

/* ============================================================
   CONTACT FORM
   Netlify Forms picks this up automatically via data-netlify
   on the <form> tag in index.html, once deployed. Locally it
   just confirms the UI state.
============================================================ */
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form){
  form.addEventListener('submit', (e)=>{
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'){
      e.preventDefault();
      note.textContent = 'Sending…';
      setTimeout(()=>{
        note.textContent = "Looks good locally. Netlify Forms handles real submissions once deployed.";
        form.reset();
      }, 700);
    }
  });
}
