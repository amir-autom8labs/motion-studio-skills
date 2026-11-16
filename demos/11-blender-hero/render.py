"""Blender (bpy) hero shot: a device modelled from primitives, ray-traced with Cycles on CPU or GPU.

  python render.py --quality draft --frames 1-36 --out out/turntable_   # fast preview sequence
  python render.py --quality final --frames 18 --out out/hero_          # one finished still

Everything is a function of the frame number, so frames can be rendered in any order,
on several machines, or resumed after a crash (existing files are skipped).
"""
import argparse, math, os, sys, time
import bpy

QUALITY = {  # width, samples — time per frame grows with both
    'draft': (640, 16),
    'review': (960, 32),
    'final': (1920, 96),
}
ap = argparse.ArgumentParser()
ap.add_argument('--quality', default='draft', choices=QUALITY)
ap.add_argument('--frames', default='1')          # "18" or "1-36"
ap.add_argument('--total', type=int, default=36)  # frames in the full move
ap.add_argument('--out', default='out/frame_')
ap.add_argument('--transparent', action='store_true')
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
width, samples = QUALITY[args.quality]
a, _, b = args.frames.partition('-'); first, last = int(a), int(b or a)

BG, VIOLET, CYAN, PINK = (0.006, 0.007, 0.012), (0.2, 0.11, 1.0), (0.016, 0.65, 0.85), (1.0, 0.11, 0.25)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def material(name, color, metallic=0.0, roughness=0.4, emission=None, strength=1.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Coat Weight'].default_value = coat
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = strength
    return m

def add(obj_op, mat, smooth=True, **kw):
    obj_op(**kw); o = bpy.context.object
    if smooth: bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o

# --- model: bevelled slab + emissive screen, parented so one rotation moves both
body = add(bpy.ops.mesh.primitive_cube_add, material('body', (0.10, 0.11, 0.17), 1.0, 0.22, coat=1.0), size=1)
body.scale = (2.2, 0.22, 4.5); bpy.ops.object.transform_apply(scale=True)
bev = body.modifiers.new('bevel', 'BEVEL'); bev.width = 0.105; bev.segments = 10

screen_mat = material('screen', (0, 0, 0), 0, 0.15, emission=(1, 1, 1), strength=0.9)
nt = screen_mat.node_tree; grad = nt.nodes.new('ShaderNodeTexGradient'); ramp = nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (*VIOLET, 1); ramp.color_ramp.elements[1].color = (*CYAN, 1)
nt.links.new(grad.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Emission Color'])
screen = add(bpy.ops.mesh.primitive_plane_add, screen_mat, smooth=False, size=1)
screen.scale = (2.02, 4.32, 1); screen.rotation_euler = (math.pi / 2, 0, 0); screen.location = (0, -0.112, 0); screen.parent = body

if not args.transparent:
    add(bpy.ops.mesh.primitive_plane_add, material('floor', (0.012, 0.014, 0.022), 0.0, 0.18), smooth=False, size=80, location=(0, 0, -2.45))

orbs = []
for i in range(9):
    ang = i * 2.4; r = 2.0 + (i % 3) * 0.55
    o = add(bpy.ops.mesh.primitive_uv_sphere_add, material(f'orb{i}', (VIOLET, CYAN, PINK)[i % 3], 0.1, 0.12, coat=1.0),
            radius=0.16 + (i % 4) * 0.05, segments=48, ring_count=24, location=(0, 0, 0))
    orbs.append((o, ang, r, -1.4 + (i * 0.37) % 3.2))

# --- light: big soft key, coloured rims, dim world. Area lights give the soft reflections on the glass.
def area(loc, rot, energy, size, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=[math.radians(v) for v in rot])
    l = bpy.context.object.data; l.energy = energy; l.size = size; l.color = color
area((4.5, -5, 6), (48, 0, 38), 2600, 6)
area((-6, 3, 3), (-70, 0, -120), 900, 4, VIOLET)
area((6, 4, 1), (-80, 0, 120), 700, 4, CYAN)
world = bpy.data.worlds.new('world'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (*BG, 1)

# --- camera with shallow depth of field, focused on the device
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 50; cam.data.dof.use_dof = True; cam.data.dof.focus_object = body; cam.data.dof.aperture_fstop = 2.8

# --- render settings
sc.render.resolution_x, sc.render.resolution_y = width, width * 9 // 16
sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
sc.cycles.device = 'CPU'   # for a GPU box: enable devices in preferences and set 'GPU'
sc.render.film_transparent = args.transparent
sc.render.image_settings.file_format = 'PNG'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'

def pose(frame):
    k = (frame - 1) / max(1, args.total - 1)                    # 0..1 through the move
    body.rotation_euler = (math.radians(-4), 0, math.radians(-38 + 46 * k))
    for o, ang, r, z in orbs:
        a2 = ang + k * 1.2
        o.location = (math.cos(a2) * r, math.sin(a2) * r, z + math.sin(k * 6.28 + ang) * 0.12)
    d = 15.5 - 1.2 * k                                          # slow dolly-in
    cam.location = (math.sin(-0.18 + 0.2 * k) * d, -math.cos(-0.18 + 0.2 * k) * d, 0.9)
    direction = body.location - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
for f in range(first, last + 1):
    path = f'{os.path.abspath(args.out)}{f:04d}.png'
    if os.path.exists(path): continue
    pose(f); sc.render.filepath = path
    t = time.time(); bpy.ops.render.render(write_still=True)
    print(f'RENDERED frame {f} {args.quality} {width}px {samples}spp in {time.time() - t:.1f}s', flush=True)
