import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

/* Procedural glass sculpture: a noise-displaced icosahedron.
   Loaded lazily from main.js so Three.js never blocks first paint. */
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

export function initHero(){
  const canvas = document.getElementById('heroCanvas');
  const hero = canvas && canvas.parentElement;
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = () => ({ w: hero.clientWidth, h: hero.clientHeight });
  let { w: width, h: height } = size();
  let narrow = width < 800;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, narrow ? 1.5 : 2));
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const geometry = new THREE.IcosahedronGeometry(1.6, narrow ? 12 : 24);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0d0e10, metalness: 0.1, roughness: 0.06,
    transmission: 1.0, thickness: 1.4, ior: 1.4,
    clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uAmp = { value: 0.16 };
    material.userData.shader = shader;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uAmp;\n${noiseGLSL}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float n = snoise(position * 1.1 + vec3(0.0, 0.0, uTime * 0.15));
        transformed += normal * n * uAmp;`);
  };

  const sculpture = new THREE.Mesh(geometry, material);
  scene.add(sculpture);

  const key = new THREE.PointLight(0x6e56cf, 6, 20);
  key.position.set(3, 2, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xf2b84b, 3.5, 20);
  rim.position.set(-3, -1, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  const particleCount = narrow ? 60 : 140;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++){
    positions[i*3]   = (Math.random() - 0.5) * 14;
    positions[i*3+1] = (Math.random() - 0.5) * 8;
    positions[i*3+2] = (Math.random() - 0.5) * 8 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xE9E6DF, size: 0.02, transparent: true, opacity: 0.5 }));
  scene.add(particles);

  // Bloom is skipped on narrow screens: it is the most expensive pass and barely shows there.
  let composer = null;
  if (!narrow){
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.7, 0.15));
    composer.addPass(new OutputPass());
  }

  // Desktop: sculpture sits right of the text. Phone: it sits low, behind the lower half of the hero.
  let base = 1;
  const layout = () => {
    narrow = width < 800;
    base = narrow ? 0.5 : 1;
    if (narrow){
      // Centre the sculpture 170px above the bottom of the hero, whatever the screen height.
      const worldPerPx = (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / height;
      sculpture.position.set(0, (170 - height / 2) * worldPerPx, 0);
    } else {
      sculpture.position.set(2.6, 0, 0);
    }
  };
  layout();

  let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  sculpture.scale.setScalar(0.001);
  gsap.to(sculpture.scale, { x: base, y: base, z: base, duration: 1.6, ease: 'power3.out', delay: 0.2 });

  // Render only while the hero is on screen and the tab is visible.
  let visible = true, running = false;
  const clock = new THREE.Clock();

  function frame(){
    if (!visible || document.hidden){ running = false; return; }
    requestAnimationFrame(frame);
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    if (material.userData.shader) material.userData.shader.uniforms.uTime.value = t;
    if (!reduceMotion){
      sculpture.rotation.y += dt * 0.12;
      sculpture.rotation.x += dt * 0.04;
      camera.position.x += (targetX * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (-targetY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      key.position.x = 3 + targetX * 3;
      key.position.y = 2 - targetY * 3;
      particles.rotation.y += dt * 0.01;
    }
    composer ? composer.render() : renderer.render(scene, camera);
  }
  const start = () => { if (!running && visible && !document.hidden){ running = true; clock.getDelta(); frame(); } };

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', start);
  start();

  // Resize on width change only, so the mobile address bar does not trigger a re-layout.
  let lastW = width;
  window.addEventListener('resize', () => {
    const s = size();
    if (s.w === lastW) return;
    lastW = s.w; width = s.w; height = s.h;
    layout();
    sculpture.scale.setScalar(base);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer && composer.setSize(width, height);
  });

  canvas.classList.add('is-ready');
}
