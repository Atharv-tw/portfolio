"""
Shapes, materials and export shared by the Blender build scripts.

Everything is authored in the site's own space (three.js: +Y up, +Z towards
the viewer, the units of src/three/Mascot/states.ts) and turned into Blender's
Z-up space once, as each mesh is made. The glTF exporter turns it back.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

# three.js space → Blender space: a quarter turn about X
TO_BLENDER = Matrix.Rotation(math.radians(90), 4, "X")


def V(x, y, z):
    return Vector((x, y, z))


def to_blender(p):
    return TO_BLENDER @ Vector(p)


# ---------------------------------------------------------------- scene


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    return scene


def collection(name):
    col = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col


def link(obj, col=None):
    (col or bpy.context.scene.collection).objects.link(obj)
    return obj


def empty(name, at=(0, 0, 0), parent=None, col=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = 0.15
    obj.location = to_blender(at)
    link(obj, col)
    if parent:
        set_parent(obj, parent)
    return obj


def set_parent(child, parent):
    """Parent without moving: the child keeps its place in the world."""
    bpy.context.view_layer.update()
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = Matrix.Identity(4)
    child.matrix_world = world


# ---------------------------------------------------------------- materials


def srgb(hex_colour):
    """'#ff6a17' → linear RGBA for a node socket."""
    h = hex_colour.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, colour, rough=0.5, coat=0.0, emit=None, emit_strength=0.0):
    """
    A plain Principled material. The site re-skins every material by name at
    load (see CharacterBody.tsx), so only the name and colour really travel;
    the rest is for the preview renders.
    """
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb(colour)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.3
    if emit:
        bsdf.inputs["Emission Color"].default_value = srgb(emit)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    mat.diffuse_color = srgb(colour)
    return mat


# ---------------------------------------------------------------- meshes


def from_bmesh(name, bm, mat, col=None, smooth=True, subdiv=0, keep_uv=False):
    """Turns a bmesh built in site space into an object in Blender space."""
    bm.transform(TO_BLENDER)
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if not keep_uv:
        while me.uv_layers:
            me.uv_layers.remove(me.uv_layers[0])
    for poly in me.polygons:
        poly.use_smooth = smooth
    me.materials.append(mat)
    obj = link(bpy.data.objects.new(name, me), col)
    if subdiv:
        mod = obj.modifiers.new("Subdivision", "SUBSURF")
        mod.levels = subdiv
        mod.render_levels = subdiv
    return obj


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def ellipsoid(name, centre, radii, mat, col=None, seg=40, rings=24, shape=None):
    """
    A squashed sphere. `shape(v)` may move each vertex (site space, centred on
    the origin) before it is placed: chins, flattened backs, bumps.
    """
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts:
        v.co = V(v.co.x * radii[0], v.co.z * radii[1], -v.co.y * radii[2])
        if shape:
            v.co = shape(v.co)
        v.co += V(*centre)
    return from_bmesh(name, bm, mat, col)


def capsule(name, a, b, r, mat, col=None, seg=24, rings=16, r_end=None):
    """A capsule from point a to point b, tapering from r to r_end."""
    a, b = V(*a), V(*b)
    r_end = r if r_end is None else r_end
    axis = b - a
    length = axis.length
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts:
        # sphere's z runs along the axis: top half goes to b, bottom half to a
        t = 1.0 if v.co.z > 0 else 0.0
        rad = r_end if t else r
        v.co = V(v.co.x * rad, v.co.y * rad, v.co.z * rad + (length if t else 0))
    rot = V(0, 0, 1).rotation_difference(axis.normalized()).to_matrix().to_4x4()
    bm.transform(Matrix.Translation(a) @ rot)
    return from_bmesh(name, bm, mat, col)


def rounded_box(name, centre, size, radius, mat, col=None, segments=4):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = V(v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])
    r = min(radius, min(size) / 2 - 1e-4)
    bmesh.ops.bevel(
        bm,
        geom=list(bm.verts) + list(bm.edges),
        offset=r,
        segments=segments,
        profile=0.5,
        affect="EDGES",
        clamp_overlap=True,
    )
    bm.transform(Matrix.Translation(V(*centre)))
    return from_bmesh(name, bm, mat, col)


def cylinder(name, centre, radius, depth, mat, col=None, axis="Y", seg=40, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=seg, radius1=radius, radius2=radius, depth=depth
    )
    if bevel:
        rims = [e for e in bm.edges if abs(abs(e.verts[0].co.z) - depth / 2) < 1e-5 and abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-5]
        bmesh.ops.bevel(bm, geom=rims, offset=bevel, segments=3, profile=0.5, affect="EDGES")
    # bmesh cones stand on z; turn to the wanted site axis
    turn = {
        "Y": Matrix.Rotation(math.radians(-90), 4, "X"),
        "X": Matrix.Rotation(math.radians(90), 4, "Y"),
        "Z": Matrix.Identity(4),
    }[axis]
    bm.transform(Matrix.Translation(V(*centre)) @ turn)
    return from_bmesh(name, bm, mat, col)


def torus(name, centre, major, minor, mat, col=None, seg=48, ring=14, arc=2 * math.pi, start=0.0, turn=None, scale=(1, 1, 1)):
    """A torus (or an arc of one) lying in the site XZ plane, then turned."""
    bm = bmesh.new()
    closed = abs(arc - 2 * math.pi) < 1e-6
    steps = seg if closed else seg + 1
    rows = []
    for i in range(steps):
        a = start + arc * i / seg
        cx, cz = math.cos(a) * major, math.sin(a) * major
        out = V(math.cos(a), 0, math.sin(a))
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            p = V(cx, 0, cz) + out * (math.cos(b) * minor) + V(0, math.sin(b) * minor, 0)
            row.append(bm.verts.new(V(p.x * scale[0], p.y * scale[1], p.z * scale[2])))
        rows.append(row)
    pairs = range(len(rows)) if closed else range(len(rows) - 1)
    for i in pairs:
        r0, r1 = rows[i], rows[(i + 1) % len(rows)]
        for j in range(ring):
            bm.faces.new((r0[j], r1[j], r1[(j + 1) % ring], r0[(j + 1) % ring]))
    if not closed:
        for row in (rows[0], rows[-1]):
            bm.faces.new(row if row is rows[-1] else list(reversed(row)))
    m = Matrix.Translation(V(*centre))
    if turn is not None:
        m = m @ turn
    bm.transform(m)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(name, bm, mat, col)


def lathe(name, profile, mat, col=None, seg=48, depth=1.0, centre=(0, 0, 0)):
    """
    Turns a (y, radius) profile, bottom to top, into a round body; `depth`
    squashes it front to back. A radius of 0 closes that end to a point.
    """
    bm = bmesh.new()
    rows = []
    for y, r in profile:
        if r <= 1e-6:
            rows.append([bm.verts.new(V(centre[0], y + centre[1], centre[2]))])
            continue
        rows.append(
            [
                bm.verts.new(
                    V(
                        centre[0] + math.sin(2 * math.pi * i / seg) * r,
                        y + centre[1],
                        centre[2] + math.cos(2 * math.pi * i / seg) * r * depth,
                    )
                )
                for i in range(seg)
            ]
        )
    for r0, r1 in zip(rows, rows[1:]):
        if len(r0) == 1:
            for i in range(seg):
                bm.faces.new((r0[0], r1[(i + 1) % seg], r1[i]))
        elif len(r1) == 1:
            for i in range(seg):
                bm.faces.new((r0[i], r0[(i + 1) % seg], r1[0]))
        else:
            for i in range(seg):
                bm.faces.new((r0[i], r0[(i + 1) % seg], r1[(i + 1) % seg], r1[i]))
    for row in (rows[0], rows[-1]):
        if len(row) > 2:
            bm.faces.new(row)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(name, bm, mat, col)


def _catmull(points, samples):
    """Smooth path through `points` (site-space Vectors), `samples` points long."""
    pts = [points[0] * 2 - points[1]] + list(points) + [points[-1] * 2 - points[-2]]
    out = []
    spans = len(points) - 1
    for k in range(samples):
        u = k / (samples - 1) * spans
        i = min(int(u), spans - 1)
        t = u - i
        p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
        t2, t3 = t * t, t * t * t
        out.append(
            0.5
            * (
                2 * p1
                + (-p0 + p2) * t
                + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
            )
        )
    return out


def strand(bm, points, width, thick, outward, samples=14, ring=8, taper=1.0, flare=0.25):
    """
    Adds one flat, tapering lock of hair to `bm`: a ribbon-like tube along a
    smooth path through `points`, wide across the scalp and thin away from it,
    ending in a point. `outward(p)` says which way is off the head at p.
    """
    path = _catmull([V(*p) for p in points], samples)
    rows = []
    for k, p in enumerate(path):
        t = k / (samples - 1)
        tangent = (path[min(k + 1, samples - 1)] - path[max(k - 1, 0)]).normalized()
        n = outward(p)
        n = (n - tangent * n.dot(tangent)).normalized()
        side = tangent.cross(n).normalized()
        # full most of the way, a little fuller after the root, then a round
        # clay-like tip rather than a spike
        body = (1 - t ** (1.8 / taper)) ** 0.6 * (1 + flare * math.sin(math.pi * min(t * 1.4, 1)))
        w, h = width * body, thick * body
        if k == samples - 1:
            rows.append([bm.verts.new(p)])
            break
        rows.append(
            [
                bm.verts.new(p + side * (math.cos(a) * w) + n * (math.sin(a) * h))
                for a in (2 * math.pi * j / ring for j in range(ring))
            ]
        )
    bm.faces.new(list(reversed(rows[0])))
    for r0, r1 in zip(rows, rows[1:]):
        if len(r1) == 1:
            for j in range(ring):
                bm.faces.new((r0[j], r0[(j + 1) % ring], r1[0]))
        else:
            for j in range(ring):
                bm.faces.new((r0[j], r0[(j + 1) % ring], r1[(j + 1) % ring], r1[j]))


# ---------------------------------------------------------------- export


def export_glb(path, objects):
    """Exports exactly these objects (and nothing else) as a binary glTF."""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    print(f"[export] {path} {os.path.getsize(path) / 1024:.0f} KB")


# ---------------------------------------------------------------- preview


def args():
    """Arguments after `--` on the Blender command line, as a dict of flags."""
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    out = {}
    for i, a in enumerate(argv):
        if a.startswith("--"):
            nxt = argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith("--") else True
            out[a[2:]] = nxt
    return out


def preview(outdir, prefix, target=(0, -0.15, 0), distance=8.5, views=(0, 35, 90, 180), size=900, background="#f4f0e8", lens=55):
    """
    Renders turnaround PNGs with EEVEE under a plain studio rig, so a model can
    be reviewed without opening Blender. Angles are degrees round the
    character, 0 = front.
    """
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("preview") if not scene.world else scene.world
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = srgb(background)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.9

    def light(name, kind, energy, at, colour="#ffffff", size_=3.0):
        if name in bpy.data.objects:
            return bpy.data.objects[name]
        data = bpy.data.lights.new(name, kind)
        data.energy = energy
        data.color = srgb(colour)[:3]
        if kind == "AREA":
            data.size = size_
        obj = link(bpy.data.objects.new(name, data))
        obj.location = to_blender(at)
        obj.rotation_euler = (to_blender(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
        return obj

    light("key", "AREA", 900, (4, 5, 6), "#fff4e6")
    light("fill", "AREA", 300, (-5, 1.5, 4), "#f1f4ff")
    light("rim", "AREA", 700, (-2.5, 4, -5))

    cam = bpy.data.objects.get("cam")
    if not cam:
        cam_data = bpy.data.cameras.new("cam")
        cam_data.lens = lens
        cam = link(bpy.data.objects.new("cam", cam_data))
    scene.camera = cam
    os.makedirs(outdir, exist_ok=True)
    t = V(*target)
    for deg in views:
        a = math.radians(deg)
        eye = t + V(math.sin(a) * distance, 0.9, math.cos(a) * distance)
        cam.location = to_blender(eye)
        cam.rotation_euler = (to_blender(t) - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(outdir, f"{prefix}-{deg:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[preview] {scene.render.filepath}")


def wrinkle(bm, amp, freq=3.0, stretch=(1.0, 0.35, 1.0), seed=0.0):
    """
    Soft fabric folds: pushes each vertex along its normal by smooth noise.
    `stretch` < 1 on an axis draws the folds out along it (0.35 on y makes the
    long vertical folds of a hanging hoodie).
    """
    from mathutils import noise

    bm.normal_update()
    moves = []
    for v in bm.verts:
        p = v.co
        q = Vector((p.x * freq * stretch[0] + seed, p.y * freq * stretch[1], p.z * freq * stretch[2]))
        moves.append(v.normal * (noise.noise(q) * amp))
    for v, m in zip(bm.verts, moves):
        v.co += m


def loop_tube(bm, points, radius, ring=10, samples=None):
    """A closed tube of constant width round a loop of points (a hem, a cuff, a rim)."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    samples = samples or n
    # resample the closed loop smoothly
    path = []
    for k in range(samples):
        u = k / samples * n
        i = int(u)
        t = u - i
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i % n], pts[(i + 1) % n], pts[(i + 2) % n]
        t2, t3 = t * t, t * t * t
        path.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    centre = sum(path, Vector()) / len(path)
    rows = []
    for k, p in enumerate(path):
        tangent = (path[(k + 1) % samples] - path[k - 1]).normalized()
        out = p - centre
        out = (out - tangent * out.dot(tangent)).normalized()
        up = tangent.cross(out).normalized()
        rows.append([bm.verts.new(p + out * (math.cos(a) * radius) + up * (math.sin(a) * radius)) for a in (2 * math.pi * j / ring for j in range(ring))])
    for k in range(samples):
        r0, r1 = rows[k], rows[(k + 1) % samples]
        for j in range(ring):
            bm.faces.new((r0[j], r1[j], r1[(j + 1) % ring], r0[(j + 1) % ring]))
