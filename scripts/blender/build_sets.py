"""
Builds the little sets the character stands in, one per scene, and exports
public/models/sets.glb.

    blender -b --factory-startup -P scripts/blender/build_sets.py
    blender -b --factory-startup -P scripts/blender/build_sets.py -- --preview /tmp/out --with public/models/atharv.glb

Each set is an empty named Set_<scene> (the scene ids in states.ts), authored
in the character's own space: soles at y = -1.57, facing +Z. The site shows
the set of the scene he is in, scaled and moved with him.

Material names the site reads: `accent` and `screen` take the scene's colour;
the rest are re-skinned by name (see Sets.tsx). Objects whose names start with
`float` bob gently.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import V  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "sets.glb")

FOOT = -1.57
SEAT = -1.2


def place(objs, m):
    """Applies a site-space transform to objects already built."""
    tb = lib.TO_BLENDER
    w = tb @ m @ tb.inverted()
    for o in objs:
        o.matrix_world = w @ o.matrix_world
    return objs


def T(x=0.0, y=0.0, z=0.0, yaw=0.0, pitch=0.0, roll=0.0, s=1.0):
    """site-space transform: move, then turn (degrees) about y, x, z, then scale"""
    return (
        Matrix.Translation(V(x, y, z))
        @ Matrix.Rotation(math.radians(yaw), 4, "Y")
        @ Matrix.Rotation(math.radians(pitch), 4, "X")
        @ Matrix.Rotation(math.radians(roll), 4, "Z")
        @ Matrix.Scale(s, 4)
    )


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


def extruded(name, outline, depth, mat, bevel=0.02):
    """A flat shape from a 2D outline (x, y), extruded along z and bevelled."""
    bm = bmesh.new()
    front = [bm.verts.new(V(x, y, depth / 2)) for x, y in outline]
    back = [bm.verts.new(V(x, y, -depth / 2)) for x, y in outline]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(outline)
    for i in range(n):
        bm.faces.new((front[i], back[i], back[(i + 1) % n], front[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)
    return lib.from_bmesh(name, bm, mat)


def tube(name, pts, r, mat):
    """A cable or a stem: a round tube of constant width along a path."""
    bm = bmesh.new()
    lib.strand(bm, pts, r, r, lambda p: V(0, 1, 0.001), samples=24, ring=8, taper=24, flare=0)
    return lib.from_bmesh(name, bm, mat)


def materials():
    return {
        "cream": lib.material("set_cream", "#f3eee4", 0.6, 0.3),
        "coal": lib.material("set_coal", "#1d1d22", 0.55, 0.3),
        "soft": lib.material("set_soft", "#2a2a31", 0.9),
        "metal": lib.material("set_metal", "#3a3a42", 0.45, 0.2),
        "wood": lib.material("set_wood", "#b9875a", 0.7, 0.15),
        "paper": lib.material("set_paper", "#fbf8f1", 0.7),
        "orange": lib.material("set_orange", "#ff6a17", 0.5, 0.3),
        "green": lib.material("set_green", "#5f9d5a", 0.6, 0.1),
        "sand": lib.material("set_sand", "#d8c39a", 0.95),
        "rock": lib.material("set_rock", "#4f5862", 0.8),
        "kelp": lib.material("set_kelp", "#2f8f6a", 0.6),
        "court": lib.material("set_court", "#c8743f", 0.85),
        "accent": lib.material("accent", "#ff6a17", 0.35, 0.2, "#ff6a17", 3),
        "screen": lib.material("screen", "#ff6a17", 0.3, 0.0, "#ff6a17", 2),
    }


# ---------------------------------------------------------------- the sets


def hero(M):
    """A round plinth, his laptop open beside him, a mug of chai."""
    out = []
    out.append(join("plinth", [
        lib.cylinder("plinth_top", (0, FOOT - 0.075, 0), 1.32, 0.15, M["cream"], axis="Y", seg=72, bevel=0.045),
    ]))
    out.append(lib.cylinder("plinth_band", (0, FOOT - 0.12, 0), 1.335, 0.05, M["coal"], axis="Y", seg=72))

    base = lib.rounded_box("lap_base", (0, 0.022, 0), (0.62, 0.045, 0.42), 0.02, M["coal"])
    lid = lib.rounded_box("lap_lid", (0, 0.21, -0.012), (0.62, 0.42, 0.03), 0.02, M["coal"])
    place([lid], Matrix.Translation(V(0, 0.022, -0.2)) @ Matrix.Rotation(math.radians(-14), 4, "X") @ Matrix.Translation(V(0, -0.022, 0.2)))
    screen = lib.rounded_box("lap_screen", (0, 0.21, 0.006), (0.55, 0.35, 0.008), 0.01, M["screen"])
    place([screen], Matrix.Translation(V(0, 0.022, -0.2)) @ Matrix.Rotation(math.radians(-14), 4, "X") @ Matrix.Translation(V(0, -0.022, 0.2)))
    keys = lib.rounded_box("lap_keys", (0, 0.047, 0.03), (0.52, 0.006, 0.22), 0.003, M["metal"])
    out += place([join("laptop", [base, lid, keys]), screen], T(1.02, FOOT, 0.38, yaw=-28))

    cup = lib.cylinder("mug", (0, 0.11, 0), 0.105, 0.22, M["cream"], axis="Y", seg=36, bevel=0.02)
    handle = lib.torus("mug_handle", (0.115, 0.11, 0), 0.065, 0.018, M["orange"], seg=24, ring=8, turn=Matrix.Rotation(math.radians(90), 4, "X"))
    chai = lib.cylinder("chai", (0, 0.205, 0), 0.088, 0.01, M["wood"], axis="Y", seg=36)
    out += place([cup, handle, chai], T(-1.0, FOOT, 0.42, yaw=30))

    out.append(tube("cable", [(0.86, FOOT + 0.02, 0.22), (0.62, FOOT + 0.015, -0.2), (0.15, FOOT + 0.015, -0.72), (-0.55, FOOT + 0.015, -0.98), (-1.05, FOOT + 0.015, -0.75)], 0.018, M["coal"]))
    return out


def about(M):
    """He sits on a beanbag with his headphones on: a crate of records, a plant."""
    out = []
    bag = lib.ellipsoid("beanbag", (0, SEAT - 0.27, -0.06), (0.78, 0.3, 0.66), M["soft"], seg=48, rings=24,
                        shape=lambda v: V(v.x, v.y - 0.08 * max(0, 1 - (v.x**2 + v.z**2) / 0.25), v.z))
    out.append(bag)

    crate = [lib.rounded_box("crate", (0, -0.2, 0), (0.62, 0.4, 0.46), 0.03, M["wood"])]
    hole = lib.rounded_box("crate_in", (0, -0.12, 0), (0.54, 0.34, 0.38), 0.02, M["soft"])
    records = []
    for i in range(6):
        records.append(lib.cylinder(f"rec{i}", (0, 0, 0), 0.25, 0.012, M["coal"], axis="X", seg=40))
        records.append(lib.cylinder(f"lab{i}", (0, 0, 0), 0.08, 0.016, M["accent"] if i == 2 else M["orange"] if i % 2 else M["cream"], axis="X", seg=24))
        place(records[-2:], T(-0.2 + i * 0.075, 0.02, 0, roll=-6 + i * 2.5))
    discs = [r for r in records if r.name.startswith("rec")]
    labels = [r for r in records if r.name.startswith("lab")]
    out += place([join("crate", crate + [hole]), join("records", discs)] + labels, T(1.15, FOOT, -0.05, yaw=-18))

    pot = lib.cylinder("pot", (0, 0.13, 0), 0.15, 0.26, M["cream"], axis="Y", seg=36, bevel=0.025)
    leaves = [lib.ellipsoid(f"leaf{i}", (0, 0.42 + i * 0.03, 0), (0.07, 0.2, 0.025), M["green"], seg=20, rings=12) for i in range(5)]
    for i, leaf in enumerate(leaves):
        place([leaf], T(0, 0.26, 0) @ T(yaw=i * 72, roll=28) @ T(0, -0.26, 0))
    out += place([pot, join("leaves", leaves)], T(-1.15, FOOT, -0.15))
    return out


def vault(M):
    """A cube to sit on, his phone on a stand, and his notes floating round him."""
    out = [lib.rounded_box("cube_seat", (0, SEAT - 0.24, -0.08), (0.72, 0.48, 0.62), 0.09, M["cream"], segments=5)]

    stand = lib.rounded_box("stand", (0, 0.03, 0), (0.24, 0.06, 0.18), 0.02, M["coal"])
    phone = lib.rounded_box("phone", (0, 0.27, -0.02), (0.24, 0.46, 0.03), 0.03, M["coal"])
    glass = lib.rounded_box("phone_glass", (0, 0.27, -0.004), (0.205, 0.41, 0.006), 0.02, M["screen"])
    place([phone, glass], Matrix.Translation(V(0, 0.05, 0)) @ Matrix.Rotation(math.radians(-12), 4, "X") @ Matrix.Translation(V(0, -0.05, 0)))
    out += place([join("phone", [stand, phone]), glass], T(1.0, FOOT, 0.3, yaw=-24))

    # Markdown notes in an arc behind him: a page each, a heading bar and lines
    for i, (deg, h) in enumerate(((-62, -0.15), (-30, 0.45), (0, 0.72), (30, 0.42), (62, -0.12))):
        card = lib.rounded_box(f"card{i}", (0, 0, 0), (0.44, 0.56, 0.03), 0.04, M["paper"])
        bars = [lib.rounded_box(f"card{i}_h", (-0.06, 0.18, 0.018), (0.26, 0.05, 0.01), 0.012, M["accent"])]
        bars += [lib.rounded_box(f"card{i}_l{k}", (-0.01 if k % 2 else -0.04, 0.06 - k * 0.075, 0.018), (0.34 if k % 2 else 0.28, 0.026, 0.008), 0.008, M["metal"]) for k in range(4)]
        a = math.radians(deg)
        m = T(math.sin(a) * 1.25, h, -0.35 + math.cos(a) * -0.25, yaw=-deg * 0.7, roll=-deg * 0.08)
        out += place([join(f"float_card{i}", [card] + bars[1:]), bars[0]], m)
        bars[0].name = f"float_card{i}_head"
    return out


def onyx(M):
    """A server rack with blinking lights, and the shield that comes back with a fix."""
    out = [lib.rounded_box("floor", (0, FOOT - 0.04, -0.1), (2.9, 0.08, 1.7), 0.04, M["metal"])]
    rack = [lib.rounded_box("rack", (0, 0.68, 0), (0.62, 1.36, 0.58), 0.05, M["coal"])]
    leds = []
    for k in range(6):
        y = 0.2 + k * 0.19
        rack.append(lib.rounded_box(f"slot{k}", (0, y, 0.29), (0.52, 0.13, 0.02), 0.015, M["metal"]))
        leds.append(lib.ellipsoid(f"led{k}a", (-0.19, y, 0.302), (0.022, 0.022, 0.012), M["accent"], seg=12, rings=8))
        if k % 2 == 0:
            leds.append(lib.ellipsoid(f"led{k}b", (-0.12, y, 0.302), (0.022, 0.022, 0.012), M["accent"], seg=12, rings=8))
    out += place([join("rack", rack), join("leds", leds)], T(-1.12, FOOT, -0.35, yaw=18))

    outline = []
    for i in range(25):
        t = i / 24
        # a shield: flat top with round shoulders, sides curving to a point
        x = -0.26 + 0.52 * t
        outline.append((x, 0.3 - 0.05 * (abs(x) / 0.26) ** 3))
    for i in range(1, 24):
        t = i / 24
        y = 0.25 - t * 0.6
        outline.append((0.26 * math.cos(t * math.pi / 2) ** 0.8, y))
    outline.append((0, -0.36))
    for i in range(23, 0, -1):
        t = i / 24
        y = 0.25 - t * 0.6
        outline.append((-0.26 * math.cos(t * math.pi / 2) ** 0.8, y))
    shield = extruded("shield", outline, 0.08, M["coal"], bevel=0.025)
    rim = extruded("shield_face", [(x * 0.82, y * 0.82 + 0.005) for x, y in outline], 0.02, M["accent"], bevel=0.008)
    place([rim], T(z=0.045))
    check = [lib.capsule("tick_a", (-0.1, 0.0, 0.06), (-0.02, -0.08, 0.06), 0.028, M["cream"], seg=12, rings=8),
             lib.capsule("tick_b", (-0.02, -0.08, 0.06), (0.13, 0.1, 0.06), 0.028, M["cream"], seg=12, rings=8)]
    tick = join("tick", check)
    out += place([shield, rim, tick], T(1.12, -0.55, 0.0, yaw=-22, roll=-6))
    for obj, name in ((shield, "float_shield"), (rim, "float_shield_face"), (tick, "float_shield_tick")):
        obj.name = name
    post = lib.capsule("post", (1.12, FOOT, -0.05), (1.12, -0.95, -0.05), 0.035, M["metal"])
    out.append(post)
    return out


def okeanos(M):
    """He floats over a patch of seabed: sand, rocks, kelp, and an Argo float."""
    out = []
    out.append(lib.ellipsoid("sand", (0, FOOT - 0.42, 0), (1.55, 0.24, 0.95), M["sand"], seg=56, rings=24))
    rocks = [
        lib.ellipsoid("rock0", (-1.0, FOOT - 0.28, 0.2), (0.3, 0.2, 0.26), M["rock"], seg=20, rings=12),
        lib.ellipsoid("rock1", (-0.72, FOOT - 0.32, 0.42), (0.16, 0.11, 0.14), M["rock"], seg=16, rings=10),
        lib.ellipsoid("rock2", (0.95, FOOT - 0.3, 0.32), (0.22, 0.14, 0.2), M["rock"], seg=20, rings=12),
    ]
    out.append(join("rocks", rocks))
    kelp = []
    for i, (x, z, h) in enumerate(((-1.18, -0.2, 1.5), (-0.95, -0.42, 1.15), (1.2, -0.3, 1.3))):
        pts = [(x, FOOT - 0.3, z)] + [(x + 0.09 * math.sin(k * 1.7 + i), FOOT - 0.3 + h * k / 4, z + 0.03 * k) for k in range(1, 5)]
        bm = bmesh.new()
        lib.strand(bm, pts, 0.07, 0.016, lambda p: V(0, 0, 1), samples=20, ring=8, taper=1.4, flare=0.6)
        kelp.append(lib.from_bmesh(f"kelp{i}", bm, M["kelp"]))
    out.append(join("kelp", kelp))

    body = lib.capsule("argo", (0, -0.35, 0), (0, 0.45, 0), 0.11, M["cream"])
    collar = lib.torus("argo_ring", (0, -0.05, 0), 0.115, 0.02, M["orange"], seg=24, ring=8)
    mast = lib.capsule("argo_mast", (0, 0.5, 0), (0, 0.78, 0), 0.015, M["coal"], seg=8, rings=6)
    light = lib.ellipsoid("argo_light", (0, 0.81, 0), (0.035, 0.035, 0.035), M["accent"], seg=12, rings=8)
    out += place([join("float_argo", [body, collar, mast]), light], T(1.15, -0.55, -0.35, roll=-8))
    light.name = "float_argo_light"
    return out


def netwm(M):
    """A router at his feet, and the network it watches floating behind him."""
    out = []
    box = lib.rounded_box("router", (0, 0.13, 0), (0.7, 0.26, 0.44), 0.06, M["coal"])
    ants = [lib.capsule(f"ant{i}", (x, 0.2, -0.17), (x * 1.3, 0.72, -0.24), 0.022, M["coal"], seg=10, rings=6) for i, x in enumerate((-0.25, 0, 0.25))]
    lights = [lib.ellipsoid(f"rled{i}", (-0.22 + i * 0.09, 0.14, 0.222), (0.02, 0.02, 0.01), M["accent"], seg=10, rings=6) for i in range(5)]
    out += place([join("router", [box] + ants), join("router_leds", lights)], T(1.08, FOOT, 0.25, yaw=-20))

    nodes = [(-1.25, 0.1, -0.6), (-0.85, 0.85, -0.75), (-0.2, 1.05, -0.95), (0.6, 0.95, -0.8), (1.2, 0.35, -0.6), (-1.1, -0.65, -0.55)]
    links = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (1, 3)]
    balls = [lib.ellipsoid(f"node{i}", p, (0.075, 0.075, 0.075), M["accent"], seg=16, rings=10) for i, p in enumerate(nodes)]
    wires = [lib.capsule(f"link{i}", nodes[a], nodes[b], 0.012, M["metal"], seg=8, rings=4) for i, (a, b) in enumerate(links)]
    out.append(join("float_net", wires))
    out.append(join("float_net_nodes", balls))
    return out


def outside(M):
    """A patch of court and a hoop; the ball he dribbles is the site's own."""
    out = [lib.rounded_box("court", (0, FOOT - 0.035, -0.1), (3.0, 0.07, 1.8), 0.035, M["court"])]
    lines = [
        lib.rounded_box("line_a", (0, FOOT + 0.002, 0.55), (2.9, 0.01, 0.035), 0.004, M["cream"]),
        lib.torus("line_arc", (0.9, FOOT + 0.002, -0.55), 0.62, 0.018, M["cream"], seg=40, ring=6, arc=math.pi, start=0, scale=(1, 0.3, 1)),
    ]
    out.append(join("court_lines", lines))
    pole = lib.capsule("pole", (1.32, FOOT, -0.75), (1.32, 0.75, -0.75), 0.06, M["coal"])
    arm = lib.capsule("arm", (1.32, 0.62, -0.75), (1.05, 0.62, -0.62), 0.04, M["coal"])
    board = lib.rounded_box("board", (0.95, 0.72, -0.58), (0.86, 0.56, 0.05), 0.03, M["cream"])
    square = lib.rounded_box("board_sq", (0.95, 0.66, -0.552), (0.3, 0.22, 0.01), 0.01, M["orange"])
    rim = lib.torus("rim", (0.95, 0.5, -0.36), 0.19, 0.02, M["accent"], seg=32, ring=8)
    net = [lib.capsule(f"net{i}", (0.95 + math.cos(a) * 0.19, 0.5, -0.36 + math.sin(a) * 0.19), (0.95 + math.cos(a) * 0.11, 0.24, -0.36 + math.sin(a) * 0.11), 0.007, M["cream"], seg=6, rings=4)
           for i, a in enumerate(i * math.tau / 10 for i in range(10))]
    out += [join("hoop", [pole, arm]), join("board", [board]), square, rim, join("net", net)]
    return out


def contact(M):
    """A mailbox with its flag up, and a letter on its way."""
    out = []
    post = lib.capsule("mail_post", (1.1, FOOT, -0.1), (1.1, -0.75, -0.1), 0.05, M["coal"])
    box = lib.rounded_box("mail_box", (1.1, -0.58, -0.1), (0.36, 0.26, 0.6), 0.05, M["cream"])
    roof = lib.cylinder("mail_roof", (1.1, -0.45, -0.1), 0.18, 0.6, M["cream"], axis="Z", seg=36, bevel=0.03)
    door = lib.rounded_box("mail_door", (1.1, -0.52, 0.205), (0.3, 0.32, 0.02), 0.03, M["coal"])
    flag_post = lib.capsule("flag_post", (1.3, -0.62, -0.2), (1.3, -0.25, -0.2), 0.018, M["coal"], seg=8, rings=4)
    flag = lib.rounded_box("flag", (1.3, -0.3, -0.12), (0.03, 0.12, 0.16), 0.01, M["accent"])
    out += [join("mailbox", [post, box, roof]), door, join("flag", [flag_post]), flag]

    env = lib.rounded_box("envelope", (0, 0, 0), (0.5, 0.32, 0.03), 0.025, M["paper"])
    flap = extruded("env_flap", [(-0.24, 0.15), (0.24, 0.15), (0, -0.03)], 0.012, M["accent"], bevel=0.004)
    place([flap], T(z=0.02))
    out += place([join("float_envelope", [env]), flap], T(-1.2, 0.35, 0.1, yaw=18, roll=12))
    flap.name = "float_envelope_flap"
    return out


SETS = {"hero": hero, "about": about, "vault": vault, "onyx": onyx, "okeanos": okeanos, "netwm": netwm, "outside": outside, "contact": contact}


def build():
    lib.reset_scene()
    M = materials()
    roots, objects = [], []
    for scene, make in SETS.items():
        root = lib.empty(f"Set_{scene}")
        made = make(M)
        for obj in made:
            lib.apply_modifiers(obj)
            lib.set_parent(obj, root)
        roots.append(root)
        objects += [root] + made
    return roots, objects


if __name__ == "__main__":
    import bake

    opts = lib.args()
    roots, objects = build()
    # each set baked on its own: they all stand in the same spot
    bake.bake_ao([[o for o in r.children_recursive if o.type == "MESH"] for r in roots], "ao_sets", size=1024, samples=32, distance=0.3)
    lib.export_glb(opts.get("out", OUT), objects)
    if opts.get("preview"):
        # render each set on its own, with the character standing in it
        if opts.get("with"):
            bpy.ops.import_scene.gltf(filepath=os.path.abspath(opts["with"]))
        only = str(opts.get("only", ",".join(SETS))).split(",")
        for root in roots:
            for r in roots:
                hide = r is not root
                for o in [r] + list(r.children_recursive):
                    o.hide_render = hide
            name = root.name[4:]
            if name in only:
                lib.preview(opts["preview"], f"set-{name}", target=(0, -0.3, 0), distance=8.2, views=[20])
