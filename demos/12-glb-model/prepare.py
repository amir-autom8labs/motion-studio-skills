"""Clean up a 3D model (from TRELLIS, Hunyuan3D, a scan, a CAD export…) so it drops straight into a scene.

  python prepare.py in.glb out.glb [--height 2.0] [--texture 1024]

Does the three things generated meshes almost always need: puts the origin at the centre of the base,
scales to a known height, and shrinks oversized textures. Prints a report so you can see what you got.
"""
import argparse, sys
import bpy
from mathutils import Vector

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--height', type=float, default=2.0)
ap.add_argument('--texture', type=int, default=1024)
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args.src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes: sys.exit('no meshes in file')

# bake transforms so the bounding box is in world space
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
size = hi - lo
k = args.height / size.z                                  # Blender is Z-up; glTF's Y-up is converted on import/export
base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for o in meshes:
    o.location = (o.location - base) * k; o.scale = (k, k, k)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

shrunk = 0
for img in bpy.data.images:
    w, h = img.size
    if max(w, h) > args.texture:
        f = args.texture / max(w, h); img.scale(max(1, int(w * f)), max(1, int(h * f))); shrunk += 1

tris = sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons)
print(f'REPORT meshes={len(meshes)} triangles={tris} materials={len(bpy.data.materials)} images={len(bpy.data.images)} '
      f'original_size=({size.x:.3f}, {size.y:.3f}, {size.z:.3f}) scale_applied={k:.3f} textures_resized={shrunk}')
bpy.ops.export_scene.gltf(filepath=args.dst, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85, export_apply=True)
