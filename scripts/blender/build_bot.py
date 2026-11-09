"""
Builds the bot and exports public/models/bot.glb.

    blender -b --factory-startup -P scripts/blender/build_bot.py
    blender -b --factory-startup -P scripts/blender/build_bot.py -- --preview /tmp/out --face face.png

He is the same designer-toy bot as the procedural one in MascotBody.tsx (big
soft-cornered head, glossy visor, over-ear headphones, the "/" antenna, stubby
limbs, chunky shoes), modelled with the detail primitives cannot give: a
bezel round the visor, a seam at the waist, a back panel with vents, joints,
mitten hands with thumbs, laces.

The node names and proportions are the contract in src/three/Mascot/parts.ts:
2.86 units tall, soles at y = -1.57, facing +Z; groups Squash, Head, Torso,
ArmL, ArmR, Legs; meshes Face, AntennaTip, Emblem. Numbers are in the site's
space (y up, +z towards the viewer); lib.py turns them for Blender.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import V  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "bot.glb")

FOOT = 1.57
ORANGE = "#ff6a17"
CREAM = "#f3eee4"
COAL = "#17171b"
VISOR = "#030304"

# where each part pivots, as in MascotBody.tsx
PIVOT = {
    "Head": (0, -0.14, 0),
    "Torso": (0, -0.68, 0),
    "ArmL": (-0.45, -0.36, 0),
    "ArmR": (0.45, -0.36, 0),
    "Legs": (0, -1.1, 0),
}

# the torso: a capsule of radius 0.4, 0.3 long, squashed (1.08, 1, 0.92)
TORSO_R = 0.4
TORSO_LEN = 0.3
TORSO_SX = 1.08
TORSO_SZ = 0.92


def torso_radius(y):
    """radius of the torso capsule at height y (before its x/z squash)"""
    c = PIVOT["Torso"][1]
    top, bottom = c + TORSO_LEN / 2, c - TORSO_LEN / 2
    if bottom <= y <= top:
        return TORSO_R
    d = y - top if y > top else bottom - y
    return math.sqrt(max(0.0, TORSO_R**2 - d**2))


def pill(w, h, r, n=10):
    """a rounded-rectangle outline, (x, y) points, counter-clockwise"""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, -h / 2 + r, -90), (w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def slab(name, outline, z0, z1, mat, bevel=0.0, segments=4):
    """a flat shape from an outline, between two depths, edges rounded"""
    bm = bmesh.new()
    front = [bm.verts.new(V(x, y, z1)) for x, y in outline]
    back = [bm.verts.new(V(x, y, z0)) for x, y in outline]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(outline)
    for i in range(n):
        bm.faces.new((front[i], back[i], back[(i + 1) % n], front[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    if bevel:
        rims = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
        bmesh.ops.bevel(bm, geom=rims, offset=bevel, segments=segments, profile=0.5, affect="EDGES", clamp_overlap=True)
    return bm


def join(name, objs):
    objs = [o for o in objs if o]
    for o in objs:
        lib.apply_modifiers(o)
    if len(objs) > 1:
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
    objs[0].name = name
    objs[0].data.name = name
    return objs[0]


def set_origin(obj, site_point):
    p = lib.to_blender(site_point)
    obj.data.transform(Matrix.Translation(-p))
    obj.location = p


def wrapped(name, mat, a0, a1, y0, y1, lift, cols=20, rows=6, thick=0.0):
    """
    A panel laid on the torso's surface between two angles (0 = front, pi =
    back) and two heights, lifted off it, optionally with a thickness.
    """
    bm = bmesh.new()
    layers = [(lift, False)] + ([(lift - thick, True)] if thick else [])
    grids = []
    for off, back in layers:
        g = []
        for j in range(rows + 1):
            y = y0 + (y1 - y0) * j / rows
            r = torso_radius(y) + off
            g.append([bm.verts.new(V(math.sin(a) * r * TORSO_SX, y, math.cos(a) * r * TORSO_SZ)) for a in (a0 + (a1 - a0) * i / cols for i in range(cols + 1))])
        grids.append((g, back))
    for g, back in grids:
        for j in range(rows):
            for i in range(cols):
                quad = (g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i])
                bm.faces.new(tuple(reversed(quad)) if back else quad)
    if thick:
        (f, _), (b, _) = grids
        edges = [
            ([f[0][i] for i in range(cols + 1)], [b[0][i] for i in range(cols + 1)]),
            ([f[j][cols] for j in range(rows + 1)], [b[j][cols] for j in range(rows + 1)]),
            ([f[rows][i] for i in range(cols, -1, -1)], [b[rows][i] for i in range(cols, -1, -1)]),
            ([f[j][0] for j in range(rows, -1, -1)], [b[j][0] for j in range(rows, -1, -1)]),
        ]
        for a, c in edges:
            for k in range(len(a) - 1):
                bm.faces.new((a[k + 1], a[k], c[k], c[k + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat)


def materials():
    return {
        "shell": lib.material("shell", ORANGE, 0.45, 0.6),
        "cream": lib.material("cream", CREAM, 0.6, 0.45),
        "coal": lib.material("coal", COAL, 0.5, 0.35),
        "pad": lib.material("pad", COAL, 0.95),
        "visor": lib.material("visor", VISOR, 0.15, 1.0),
        "tip": lib.material("tip", ORANGE, 0.3, 0.5, ORANGE, 4),
        "emblem": lib.material("emblem", CREAM, 0.5, 0.6),
        "face": lib.material("face", "#000000", 0.5),
    }


def build():
    lib.reset_scene()
    M = materials()
    squash = lib.empty("Squash", (0, -FOOT, 0))
    groups = {name: lib.empty(name, at, squash) for name, at in PIVOT.items()}
    parts = {name: [] for name in PIVOT}

    # ---------- head ----------
    hc = (0, 0.42, 0)
    shell = lib.rounded_box("head_shell", hc, (1.5, 1.2, 1.2), 0.46, M["shell"], segments=10)
    parts["Head"].append(shell)

    # visor: black glass on a cream bezel, both pill-shaped like the canvas face
    bezel = lib.from_bmesh("bezel", slab("bezel", pill(1.3, 0.86, 0.37), 0.5, 0.6, M["cream"], bevel=0.03), M["cream"])
    glass = lib.from_bmesh("visor", slab("visor", pill(1.18, 0.74, 0.31), 0.55, 0.64, M["visor"], bevel=0.04, segments=6), M["visor"])
    for o in (bezel, glass):
        o.location = lib.to_blender((0, 0.41, 0))
    parts["Head"] += [bezel, glass]

    face = lib.from_bmesh("Face", _plane(1.08, 0.6075), M["face"], keep_uv=True)
    face.location = lib.to_blender((0, 0.41, 0.662))
    parts["Head"].append(face)

    # headphones: band over the top tilted back, cups with cream cushions and a light ring
    band = lib.torus("band", (0, 0, 0), 0.845, 0.052, M["coal"], arc=math.pi, seg=56, ring=12, turn=Matrix.Rotation(math.radians(-90), 4, "X"))
    band.matrix_world = lib.TO_BLENDER @ Matrix.Translation(V(0, 0.38, 0)) @ Matrix.Rotation(-0.3, 4, "X") @ lib.TO_BLENDER.inverted() @ band.matrix_world
    cups, cushions, rings = [band], [], []
    for side in (-1, 1):
        cups.append(lib.cylinder(f"cup{side}", (side * 0.8, 0.38, 0), 0.3, 0.15, M["pad"], axis="X", seg=48, bevel=0.03))
        cups.append(lib.cylinder(f"cap{side}", (side * 0.89, 0.38, 0), 0.22, 0.05, M["coal"], axis="X", seg=48, bevel=0.015))
        cups.append(lib.rounded_box(f"slider{side}", (side * 0.84, 0.72, -0.1), (0.07, 0.2, 0.1), 0.03, M["coal"]))
        cushions.append(lib.ellipsoid(f"cushion{side}", (side * 0.72, 0.38, 0), (0.09, 0.32, 0.32), M["cream"], seg=40, rings=20))
        rings.append(lib.torus(f"ring{side}", (side * 0.92, 0.38, 0), 0.15, 0.022, M["tip"], seg=40, ring=10, turn=Matrix.Rotation(math.radians(90), 4, "Z")))
    parts["Head"] += [join("headphones", cups), join("cushions", cushions)]

    # the antenna is the "/" of the AT/ mark: a rod on a joint, a glowing tip
    tilt = Matrix.Translation(V(0.9, 0.7, 0)) @ Matrix.Rotation(-0.42, 4, "Z")
    rod = lib.rounded_box("rod", (0, 0.23, 0), (0.09, 0.46, 0.09), 0.04, M["shell"], segments=4)
    joint = lib.ellipsoid("joint", (0, 0.0, 0), (0.08, 0.06, 0.08), M["cream"], seg=24, rings=12)
    tip = lib.ellipsoid("AntennaTip", (0, 0.52, 0), (0.085, 0.085, 0.085), M["tip"], seg=32, rings=20)
    for o in (rod, joint, tip):
        o.matrix_world = lib.TO_BLENDER @ tilt @ lib.TO_BLENDER.inverted() @ o.matrix_world
    parts["Head"] += [join("antenna", [rod, joint]), join("AntennaTip", [tip])]
    # the light rings on the cups glow with the tip; they are the tip's material
    parts["Head"].append(join("cuprings", rings))

    # ---------- torso ----------
    body = lib.capsule("torso_shell", (0, -0.68 - TORSO_LEN / 2, 0), (0, -0.68 + TORSO_LEN / 2, 0), TORSO_R, M["shell"], seg=48, rings=32)
    body.scale = (TORSO_SX, TORSO_SZ, 1)  # Blender axes: x, depth, height
    lib.apply_modifiers(body)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    seam = lib.torus("seam", (0, -0.95, 0), torso_radius(-0.95) * TORSO_SX + 0.004, 0.014, M["coal"], seg=64, ring=8, scale=(1, 1, TORSO_SZ / TORSO_SX))
    collar = lib.torus("collar", (0, -0.3, 0), 0.25, 0.05, M["coal"], seg=40, ring=10, scale=(1, 1, 0.92))
    panel = wrapped("back_panel", M["cream"], math.pi - 0.62, math.pi + 0.62, -0.8, -0.52, 0.012, thick=0.03)
    vents = [wrapped(f"vent{k}", M["coal"], math.pi - 0.42, math.pi + 0.42, -0.73 + k * 0.07, -0.705 + k * 0.07, 0.03, cols=14, rows=1, thick=0.02) for k in range(3)]
    screws = []
    for a in (math.pi - 0.5, math.pi + 0.5):
        for y in (-0.555, -0.765):
            r = torso_radius(y) + 0.045
            screws.append(lib.ellipsoid("screw", (math.sin(a) * r * TORSO_SX, y, math.cos(a) * r * TORSO_SZ), (0.022, 0.022, 0.022), M["coal"], seg=12, rings=8))
    parts["Torso"] += [body, join("torso_trim", [seam, collar] + vents + screws), join("back_panel", [panel])]

    emblem = lib.ellipsoid("Emblem", (0, -0.62, 0.372), (0.135, 0.135, 0.0405), M["emblem"], seg=36, rings=20)
    set_origin(emblem, (0, -0.62, 0.372))
    slash = lib.rounded_box("slash", (0, 0, 0), (0.032, 0.13, 0.02), 0.009, M["coal"], segments=2)
    slash.matrix_world = lib.TO_BLENDER @ Matrix.Translation(V(0, -0.62, 0.414)) @ Matrix.Rotation(-0.42, 4, "Z") @ lib.TO_BLENDER.inverted() @ slash.matrix_world
    parts["Torso"] += [emblem, join("slash", [slash])]

    # ---------- arms: shoulder joint, arm, wrist band, mitten with a thumb ----------
    for name, side in (("ArmL", -1), ("ArmR", 1)):
        px = side * 0.45
        arm = lib.capsule(f"arm{side}", (px, -0.36 - 0.07, 0), (px, -0.36 - 0.33, 0), 0.105, M["shell"])
        shoulder = lib.ellipsoid(f"shoulder{side}", (px, -0.38, 0), (0.12, 0.12, 0.12), M["cream"], seg=28, rings=16)
        band_ = lib.torus(f"wristband{side}", (px, -0.36 - 0.33, 0), 0.1, 0.03, M["coal"], seg=28, ring=8)
        hand = lib.ellipsoid(f"hand{side}", (px, -0.36 - 0.48, 0), (0.15, 0.165, 0.14), M["cream"], seg=32, rings=20)
        thumb = lib.ellipsoid(f"thumb{side}", (px - side * 0.105, -0.36 - 0.43, 0.08), (0.06, 0.075, 0.06), M["cream"], seg=20, rings=12)
        parts[name] += [join(f"arm_{name}", [arm]), join(f"joint_{name}", [shoulder, band_]), join(f"hand_{name}", [hand, thumb])]

    # ---------- legs: hip, leg, chunky shoes with laces and a heel tab ----------
    shells, shoes, soles, trim = [], [], [], []
    for side in (-1, 1):
        x = side * 0.21
        shells.append(lib.capsule(f"leg{side}", (x, -1.1 - 0.08, 0), (x, -1.1 - 0.18, 0), 0.13, M["shell"]))
        shoes.append(lib.rounded_box(f"shoe{side}", (x, -1.1 - 0.335, 0.07), (0.33, 0.2, 0.48), 0.095, M["cream"], segments=6))
        soles.append(lib.rounded_box(f"sole{side}", (x, -1.1 - 0.435, 0.07), (0.35, 0.07, 0.5), 0.032, M["coal"], segments=3))
        trim.append(lib.rounded_box(f"tab{side}", (x, -1.1 - 0.29, -0.17), (0.1, 0.1, 0.04), 0.02, M["shell"], segments=2))
        for k, z in enumerate((0.12, 0.2)):
            trim.append(lib.rounded_box(f"lace{side}{k}", (x, -1.1 - 0.234 - k * 0.012, z), (0.16, 0.022, 0.032), 0.01, M["coal"], segments=2))
    laces = [t for t in trim if t.name.startswith("lace")]
    tabs = [t for t in trim if t.name.startswith("tab")]
    parts["Legs"] += [join("legs", shells), join("shoes", shoes), join("soles", soles + laces), join("heeltabs", tabs)]

    objects = [squash] + list(groups.values())
    for name, objs in parts.items():
        for obj in objs:
            lib.apply_modifiers(obj)
            lib.set_parent(obj, groups[name])
            objects.append(obj)
    return squash, groups, objects


def _plane(w, h):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    vs = [bm.verts.new(V(x, y, 0)) for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
    f = bm.faces.new(vs)
    for loop, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop[uv].uv = c
    return bm


def preview_decal(path, mat_name):
    """For the preview renders only: puts a PNG on a decal material."""
    if not path or not os.path.exists(path):
        return
    mat = bpy.data.materials[mat_name]
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.abspath(path))
    bsdf = nodes["Principled BSDF"]
    links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 2.0
    links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"


if __name__ == "__main__":
    opts = lib.args()
    root, groups, objects = build()
    lib.export_glb(opts.get("out", OUT), objects)
    if opts.get("preview"):
        preview_decal(opts.get("face"), "face")
        lib.preview(opts["preview"], "bot", target=(0, -0.1, 0), distance=6.6, views=[int(v) for v in str(opts.get("views", "0,35,90,180")).split(",")])
