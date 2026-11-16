"""Ray-trace a prepared model (see prepare.py) as a product still or turntable frame.

  python render.py --model model.glb --quality review --frames 1 --out out/still_
"""
import argparse, math, os, sys, time
import bpy

QUALITY = {'draft': (640, 16), 'review': (960, 32), 'final': (1920, 96)}
ap = argparse.ArgumentParser()
ap.add_argument('--model', default='model.glb'); ap.add_argument('--quality', default='draft', choices=QUALITY)
ap.add_argument('--frames', default='1'); ap.add_argument('--total', type=int, default=36); ap.add_argument('--out', default='out/frame_')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
width, samples = QUALITY[args.quality]
a, _, b = args.frames.partition('-'); first, last = int(a), int(b or a)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.abspath(args.model))
parts = [o for o in sc.objects if o.type == 'MESH']
bpy.ops.object.empty_add(location=(0, 0, 0)); pivot = bpy.context.object      # spin one empty, not every part
for o in parts: o.parent = pivot

bpy.ops.mesh.primitive_plane_add(size=80); floor = bpy.context.object
m = bpy.data.materials.new('floor'); m.use_nodes = True; p = m.node_tree.nodes['Principled BSDF']
p.inputs['Base Color'].default_value = (0.012, 0.014, 0.022, 1); p.inputs['Roughness'].default_value = 0.2; floor.data.materials.append(m)

def area(loc, rot, energy, size, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=[math.radians(v) for v in rot])
    l = bpy.context.object.data; l.energy = energy; l.size = size; l.color = color
area((3, -4, 5), (45, 0, 35), 2400, 5)                   # soft key
area((-3.5, -4, 2), (70, 0, -40), 500, 6)                 # low fill so the shadow side keeps detail
area((-4, 2.5, 2.5), (-70, 0, -120), 500, 3, (0.2, 0.11, 1.0))   # violet rim
area((4, 3, 1.5), (-80, 0, 125), 400, 3, (0.016, 0.65, 0.85))    # cyan rim
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.006, 0.007, 0.012, 1)

bpy.ops.object.camera_add(location=(0, -9.5, 1.9), rotation=(math.radians(85), 0, 0)); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 60; cam.data.dof.use_dof = True; cam.data.dof.focus_object = pivot; cam.data.dof.aperture_fstop = 4

sc.render.resolution_x, sc.render.resolution_y = width, width * 9 // 16
sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'

os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
for f in range(first, last + 1):
    path = f'{os.path.abspath(args.out)}{f:04d}.png'
    if os.path.exists(path): continue
    pivot.rotation_euler = (0, 0, math.radians(200) + (f - 1) / args.total * 2 * math.pi)   # full turn over --total frames: loops
    sc.render.filepath = path; t = time.time(); bpy.ops.render.render(write_still=True)
    print(f'RENDERED frame {f} {args.quality} {width}px {samples}spp in {time.time() - t:.1f}s', flush=True)
