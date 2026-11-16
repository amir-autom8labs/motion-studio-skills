---
name: threejs-3d
description: Build 3D shots with three.js — product and device mockups with a live UI on the screen, turntables and camera fly-arounds, 3D logos and text, loaded GLB/glTF models, 3D scenes with titles on top. Use for any launch, social or demo shot that needs depth, a rotating product, a phone or laptop mockup, or a 3D object, and as the default 3D route before reaching for Blender.
---

# three.js 3D shots

Template: `${CLAUDE_PLUGIN_ROOT}/demos/10-three-product-spin/scene.js` — a phone modelled from primitives with a UI texture on its screen, environment reflections, soft shadow, orbiting spheres, a camera dolly, and a DOM title on top. Render mechanics: `render-pipeline` skill.

```js
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 6, background: '#07080d', workers: 2, seekable: true };

export default async function scene({ root, width, height, transparent }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setSize(width, height); renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  root.appendChild(renderer.domElement);
  const sc = new THREE.Scene();
  sc.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  // … meshes, lights
  return (t) => { /* set transforms and camera from t */ renderer.render(sc, cam); };
}
```

## What matters

- **Pure function of time → `seekable: true`.** Set every position, rotation and camera value from `t` with `prog()`/`lerp()`; no `Clock`, no `setAnimationLoop`, no accumulating `+=`. Contact sheets then take seconds.
- **`workers: 2`** and expect about 3 frames/s at 1080p on a machine with no GPU (a 6 s shot ≈ 1 minute). Antialiasing and soft shadows cost ~25% more; many transparent or transmissive surfaces cost far more.
- **Lighting is most of the look.** Use `RoomEnvironment` for reflections (no HDRI file needed) at `environmentIntensity` 0.4–0.7, one shadow-casting key light, and two coloured rim `PointLight`s behind the subject in brand colours. Keep rim lights well above the floor or they paint a bright blob on it.
- **Hide the horizon**: dark floor the same colour as the background plus `scene.fog` in that colour. A lighter or metallic floor shows a hard grey band.
- **Materials**: `MeshPhysicalMaterial` with `metalness: 1, roughness: 0.2, clearcoat: 1` for device bodies; `roughness: 0.15, clearcoat: 1` for glossy plastic. Avoid `transmission` (glass) on software GL.
- **Screens**: draw the UI on a 2D canvas (or load a screenshot) → `CanvasTexture` with `colorSpace = SRGBColorSpace` on a `MeshBasicMaterial({ toneMapped: false })` so UI colours stay exact and bright. Add a nearly transparent clearcoat plane 0.002 in front to catch highlights. For a moving UI, redraw the canvas in the frame function and set `texture.needsUpdate = true`.
- **Modelling from code** works for hard-surface shapes: `RoundedBoxGeometry`, `ExtrudeGeometry` from an SVG path (`SVGLoader`) for 3D logos, `TextGeometry` for 3D type, `LatheGeometry` for bottles and cups. Detailed or organic products need a real model.
- **Loading a model**: put the `.glb` next to the scene, `await new GLTFLoader().loadAsync('./product.glb')` inside `scene()`. Centre and scale it from its bounding box. Draco/KTX2-compressed files need their decoders bundled locally — remote decoder URLs are blocked.
- **Camera**: long lens (FOV 25–35) for product shots; one slow move per shot (dolly-in or a 20–40° orbit). Entrances: bring the object in with rotation and position together, `ease.outExpo`, ~1.8 s.
- **Titles stay in the DOM** on top of the canvas — sharper than 3D text and easy to restyle. Keep orbiting props away from the title's side of the frame.
- **Composition per aspect**: offset the subject to one side in landscape, centre it under the title in portrait; widen FOV and pull the camera back for portrait.
- **Transparent output**: `alpha: true`, skip background/fog/floor, render `--transparent` to place the object over other shots.
