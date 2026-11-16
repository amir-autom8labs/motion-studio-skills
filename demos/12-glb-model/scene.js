// three.js — load a real model file (.glb) and turn it into a product shot. The model can come from
// TRELLIS / Hunyuan3D, a scan or a CAD export; run prepare.py on it first so it is centred and 2 units tall.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { el, css, unit, prog, ease, lerp } from 'motion-kit';
import { brand, gradient } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 6, background: brand.bg, workers: 2, seekable: true };

export default async function scene({ root, width, height, transparent, params }) {
  const u = unit(width, height), portrait = height > width;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setSize(width, height); renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0';
  root.appendChild(renderer.domElement);

  const sc = new THREE.Scene(), bg = new THREE.Color(brand.bg);
  if (!transparent) { sc.background = bg; sc.fog = new THREE.Fog(bg, 7, 16); }
  sc.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  sc.environmentIntensity = 0.8;
  const cam = new THREE.PerspectiveCamera(portrait ? 36 : 28, width / height, 0.1, 100);

  // the model file sits next to this scene; relative fetches are served from the scene's folder
  const gltf = await new GLTFLoader().loadAsync(params.model ?? './model.glb');
  const model = gltf.scene;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material.envMapIntensity = 1; } });
  const pivot = new THREE.Group(); pivot.add(model); sc.add(pivot);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: '#04050a', roughness: 0.75, metalness: 0, envMapIntensity: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; if (!transparent) sc.add(floor);
  const key = new THREE.DirectionalLight('#ffffff', 2.8); key.position.set(3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); key.shadow.radius = 6;
  const rimA = new THREE.PointLight(brand.a, 30, 7); rimA.position.set(-2.5, 4.2, -2);
  const rimB = new THREE.PointLight(brand.b, 26, 7); rimB.position.set(3, 4.4, -2);   // short range + height keeps them off the floor
  sc.add(key, rimA, rimB);

  css(root, `.cap{position:absolute;${portrait ? `left:0;right:0;top:${u(11)}px;text-align:center` : `left:${u(9)}px;top:50%;transform:translateY(-50%);width:${u(72)}px`};font-family:${brand.font};color:${brand.text}}
    .cap .k{font:600 ${u(2.5)}px ${brand.mono};letter-spacing:.28em;color:${brand.b}}
    .cap .h{font-weight:800;font-size:${u(10.5)}px;letter-spacing:-.04em;line-height:1.02;margin-top:${u(2.2)}px}
    .cap .h span{background:${gradient};-webkit-background-clip:text;color:transparent}
    .cap .s{font-size:${u(3.3)}px;color:${brand.dim};margin-top:${u(2.6)}px;line-height:1.35}`);
  const cap = el('div', { class: 'cap' }, root);
  cap.innerHTML = `<div class="k">FROM A MODEL FILE</div><div class="h">Any product,<br><span>any angle.</span></div><div class="s">Photo → 3D model → turntable. No studio.</div>`;
  const parts = [...cap.children];

  const X = portrait ? 0 : 1.7;
  return (t) => {
    const enter = prog(t, 0.1, 1.6, ease.outExpo);
    pivot.position.set(X, lerp(-3.2, 0, enter), 0);
    pivot.rotation.y = lerp(-2.6, 0, enter) + t * 0.55;                // settle, then a steady turntable
    pivot.scale.setScalar(lerp(0.6, 1, enter));
    cam.position.set(X * 0.4 + Math.sin(t * 0.3) * 0.35, 1.75 - t * 0.05, (portrait ? 8 : 6.6) - t * 0.14);
    cam.lookAt(X * 0.55, 1.0, 0);
    parts.forEach((p, i) => {
      const k = prog(t, 0.8 + i * 0.18, 0.8, ease.outExpo);
      p.style.opacity = k * (1 - prog(t, 5.4, 0.5)); p.style.transform = `translateY(${(1 - k) * u(3)}px)`;
    });
    renderer.render(sc, cam);
  };
}
