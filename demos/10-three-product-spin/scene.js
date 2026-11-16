// three.js — a device mockup with a live UI on its screen, modelled from primitives, lit with an
// environment map, and moved by a camera that is a pure function of time. DOM title on top.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { el, css, unit, prog, ease, lerp, rng } from 'motion-kit';
import { brand, gradient } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 6, background: brand.bg, workers: 2, seekable: true };

// The screen is a 2D canvas used as a texture: draw any UI you like, or load a screenshot instead.
function screenTexture() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1900;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0c14'; g.fillRect(0, 0, 900, 1900);
  const hero = g.createLinearGradient(0, 0, 900, 700); hero.addColorStop(0, brand.a); hero.addColorStop(1, brand.b);
  g.fillStyle = hero; g.beginPath(); g.roundRect(50, 150, 800, 620, 56); g.fill();
  g.fillStyle = '#fff'; g.font = `800 96px 'Inter Display', Inter, sans-serif`; g.fillText('Lumen', 100, 330);
  g.font = `500 44px Inter, sans-serif`; g.globalAlpha = 0.85; g.fillText('Render queue · 3 active', 100, 410); g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.roundRect(100, 640, 700, 22, 11); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(100, 640, 470, 22, 11); g.fill();
  [brand.c, brand.b, brand.d, brand.a].forEach((col, i) => {
    const y = 850 + i * 245;
    g.fillStyle = '#161825'; g.beginPath(); g.roundRect(50, y, 800, 205, 44); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(90, y + 42, 120, 120, 30); g.fill();
    g.fillStyle = '#f4f5fa'; g.font = `650 52px Inter, sans-serif`; g.fillText(['Teaser exported', 'Review requested', 'Captions synced', 'Reel published'][i], 250, y + 95);
    g.fillStyle = '#8b90a6'; g.font = `500 38px Inter, sans-serif`; g.fillText(['4K · 12 s', '3 comments', '2 languages', '5 platforms'][i], 250, y + 150);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

export default async function scene({ root, width, height, transparent }) {
  const u = unit(width, height), portrait = height > width, rand = rng(5);
  await document.fonts.load(`800 96px 'Inter Display'`);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setSize(width, height); renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0';
  root.appendChild(renderer.domElement);

  const sc = new THREE.Scene();
  const bg = new THREE.Color(brand.bg);
  if (!transparent) { sc.background = bg; sc.fog = new THREE.Fog(bg, 11, 26); } // fog hides the floor's horizon line
  sc.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; // reflections, no HDRI file needed
  sc.environmentIntensity = 0.55;
  const cam = new THREE.PerspectiveCamera(portrait ? 40 : 30, width / height, 0.1, 100);

  const phone = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, 4.5, 0.22, 10, 0.24),
    new THREE.MeshPhysicalMaterial({ color: '#23263a', metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }));
  body.castShadow = true;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 4.34), new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false }));
  screen.position.z = 0.112;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 4.34), // thin reflective layer so the screen catches highlights
    new THREE.MeshPhysicalMaterial({ color: '#000', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.12, clearcoat: 1 }));
  glass.position.z = 0.114;
  phone.add(body, screen, glass); sc.add(phone);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#0a0b12', roughness: 0.55, metalness: 0, envMapIntensity: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.7; floor.receiveShadow = true; if (!transparent) sc.add(floor);

  const key = new THREE.DirectionalLight('#ffffff', 2.6); key.position.set(4, 7, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); key.shadow.radius = 6;
  const rimA = new THREE.PointLight(brand.a, 60, 20); rimA.position.set(-4, 3, -2);
  const rimB = new THREE.PointLight(brand.b, 40, 20); rimB.position.set(5, 2.5, -2);
  sc.add(key, rimA, rimB);

  const orbs = Array.from({ length: 9 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + rand() * 0.16, 48, 32),
      new THREE.MeshPhysicalMaterial({ color: [brand.a, brand.b, brand.c][i % 3], metalness: 0.2, roughness: 0.15, clearcoat: 1 }));
    m.castShadow = true; sc.add(m);
    // orbit radius is kept tight so nothing drifts over the title
    return { m, r: 1.7 + rand() * 1.1, a: rand() * Math.PI * 2, y: -1.6 + rand() * 3.6, sp: 0.25 + rand() * 0.3 };
  });

  css(root, `.cap{position:absolute;${portrait ? `left:0;right:0;top:${u(12)}px;text-align:center` : `left:${u(9)}px;top:50%;transform:translateY(-50%);width:${u(70)}px`};
      font-family:${brand.font};color:${brand.text}}
    .cap .k{font:600 ${u(2.5)}px ${brand.mono};letter-spacing:.28em;color:${brand.b}}
    .cap .h{font-weight:800;font-size:${u(11)}px;letter-spacing:-.04em;line-height:1.02;margin-top:${u(2.2)}px}
    .cap .h span{background:${gradient};-webkit-background-clip:text;color:transparent}
    .cap .s{font-size:${u(3.4)}px;color:${brand.dim};margin-top:${u(2.6)}px;line-height:1.35}`);
  const cap = el('div', { class: 'cap' }, root);
  cap.innerHTML = `<div class="k">NOW ON MOBILE</div><div class="h">Your studio,<br><span>in your pocket.</span></div><div class="s">Review, approve and publish from anywhere.</div>`;
  const parts = [...cap.children];

  const X = portrait ? 0 : 2.6, Y = portrait ? -0.9 : 0;
  return (t) => {
    const enter = prog(t, 0.1, 1.8, ease.outExpo), exit = prog(t, 5.3, 0.7, ease.inCubic);
    phone.position.set(X, Y + lerp(-6, 0, enter) + Math.sin(t * 1.1) * 0.06 + exit * 7, 0);
    phone.rotation.set(lerp(0.5, -0.06, enter), lerp(-2.4, -0.42, enter) + t * 0.09, lerp(0.3, 0.04, enter));
    for (const o of orbs) {
      const a = o.a + t * o.sp, k = prog(t, 0.6, 1.6, ease.outBack) * (1 - exit);
      o.m.position.set(X + Math.cos(a) * o.r, Y + o.y + Math.sin(t * 0.8 + o.a) * 0.25, Math.sin(a) * o.r - 0.5);
      o.m.scale.setScalar(Math.max(0.001, k));
    }
    cam.position.set(X * 0.35 + Math.sin(t * 0.35) * 0.5, 0.5, (portrait ? 14.5 : 12.5) - t * 0.22); // slow dolly-in
    cam.lookAt(X * 0.5, Y + 0.1, 0);
    parts.forEach((p, i) => {
      const k = prog(t, 0.9 + i * 0.18, 0.8, ease.outExpo);
      p.style.opacity = k * (1 - prog(t, 5.2, 0.5));
      p.style.transform = `translateY(${(1 - k) * u(3)}px)`;
    });
    renderer.render(sc, cam);
  };
}
