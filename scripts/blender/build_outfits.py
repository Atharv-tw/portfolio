"""
Builds the bot's clothes, one outfit for each day of the week, and exports
public/models/outfits/<day>.glb (mon … sun).

    blender -b --factory-startup -P scripts/blender/build_outfits.py
    blender -b --factory-startup -P scripts/blender/build_outfits.py -- --preview /tmp/out --face face.png --only tue

Designer-toy streetwear: oversized, soft, with folds. Each file holds one
empty, Outfit_<day>, with an empty per body part (<day>_Head, <day>_Torso,
<day>_ArmL, <day>_ArmR, <day>_Legs) at that part's pivot; the site moves the
pieces under those empties onto the matching part of the bot, so a sleeve
swings with its arm and a hat turns with the head. An outfit can ask for
parts of the bot to be hidden (the custom property `hides`, e.g. the
headphones under a hood).
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_bot  # noqa: E402
import lib  # noqa: E402
from build_bot import PIVOT, TORSO_SX, TORSO_SZ, torso_radius  # noqa: E402
from lib import V  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "outfits")
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
DEPTH = TORSO_SZ / TORSO_SX


def cloth(name, colour, rough=0.85):
    """fabric: the site gives every `cloth_` material a soft sheen"""
    return lib.material(f"cloth_{name}", colour, rough)


def C():
    return {
        "coal": cloth("coal", "#2a2a30"),
        "black": cloth("black", "#121215", 0.7),
        "grey": cloth("grey", "#9c9ea6"),
        "white": cloth("white", "#f4f2ec"),
        "cream": cloth("cream", "#eadfc8"),
        "olive": cloth("olive", "#5d6548"),
        "sand": cloth("sand", "#c8b38c"),
        "rust": cloth("rust", "#b5552c"),
        "orange": cloth("orange", "#ff7a2e"),
        "knit": cloth("knit", "#ebe4d4"),
        "trim": lib.material("trim_orange", "#ff6a17", 0.45, 0.5),
        "zip": lib.material("trim_metal", "#c9c9cf", 0.3, 0.6),
    }


# ---------------------------------------------------------------- shapes


def garment_r(y, off, flare=0.0):
    """the radius of a top worn over the torso: it hangs straight below the waist"""
    if y < -0.83:
        return 0.4 + off + flare * (-0.83 - y) / 0.35
    return torso_radius(y) + off


def lathe_bm(profile, seg=64, depth=DEPTH, cx=0.0, cz=0.0, sx=TORSO_SX):
    """(y, radius) rows, bottom to top, round a vertical axis; radius 0 closes"""
    bm = bmesh.new()
    rows = []
    for y, r in profile:
        if r <= 1e-6:
            rows.append([bm.verts.new(V(cx, y, cz))])
        else:
            rows.append([bm.verts.new(V(cx + math.sin(2 * math.pi * i / seg) * r * sx, y, cz + math.cos(2 * math.pi * i / seg) * r * sx * depth)) for i in range(seg)])
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
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return bm


def top(name, mat, off=0.08, hem=-1.15, flare=0.03, folds=0.016, seed=0.0, neck=-0.2, ribs=0, gather=0.0):
    """
    The body of a jacket, hoodie, tee or sweater. `gather` pulls the last bit
    above the hem in, so the body blouses over a tighter rib.
    """
    ys = [hem + (neck - hem) * k / 26 for k in range(27)]

    def r(y):
        pull = gather * max(0.0, 1 - (y - hem) / 0.1) ** 2
        return garment_r(y, off, flare) - pull

    profile = [(hem + 0.01, 0.0), (hem, r(hem) * 0.95)]
    profile += [(y, r(y)) for y in ys[1:]]
    profile += [(neck + 0.01, 0.0)]
    bm = lathe_bm(profile)
    if ribs:
        knit(bm, ribs)
    lib.wrinkle(bm, folds, freq=3.2, seed=seed)
    return lib.from_bmesh(name, bm, mat, subdiv=1)


def knit(bm, count, amp=0.009):
    """vertical knit ribs"""
    bm.normal_update()
    for v in bm.verts:
        a = math.atan2(v.co.x, v.co.z)
        v.co += v.normal * (math.sin(a * count) * amp)


def ring(name, mat, y, off, tube, flare=0.0, seg=64):
    """a hem, a waistband, a belt: a tube round the top at height y"""
    r = garment_r(y, off, flare)
    bm = bmesh.new()
    lib.loop_tube(bm, [V(math.sin(a) * r * TORSO_SX, y, math.cos(a) * r * TORSO_SZ) for a in (2 * math.pi * i / seg for i in range(seg))], tube)
    return lib.from_bmesh(name, bm, mat)


def on_top(a, y, off, lift=0.0):
    """a point on a top's surface: a = angle from the front, y = height"""
    r = garment_r(y, off) + lift
    return V(math.sin(a) * r * TORSO_SX, y, math.cos(a) * r * TORSO_SZ)


def strip(name, mat, pts, width, off, lift=0.012, thick=0.012, samples=24):
    """a flat band lying on a top: lapels, straps, a zip, a lanyard"""
    path = lib._catmull([V(a, y, 0) for a, y in pts], samples)
    bm = bmesh.new()
    rows = []
    for k, q in enumerate(path):
        p = on_top(q.x, q.y, off, lift)
        n = V(p.x / TORSO_SX**2, 0, p.z / TORSO_SZ**2).normalized()
        nxt = on_top(path[min(k + 1, samples - 1)].x, path[min(k + 1, samples - 1)].y, off, lift)
        prv = on_top(path[max(k - 1, 0)].x, path[max(k - 1, 0)].y, off, lift)
        t = (nxt - prv).normalized()
        side = t.cross(n).normalized() * (width / 2)
        rows.append([bm.verts.new(p + side), bm.verts.new(p - side), bm.verts.new(p - side - n * thick), bm.verts.new(p + side - n * thick)])
    for r0, r1 in zip(rows, rows[1:]):
        for j in range(4):
            bm.faces.new((r0[j], r1[j], r1[(j + 1) % 4], r0[(j + 1) % 4]))
    bm.faces.new(rows[0][::-1])
    bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat)


def print_on(name, mat, outline, cx, cy, off, lift=0.008, thick=0.012):
    """a flat shape printed on the front of a top: (x, y) outline round (cx, cy)"""
    bm = bmesh.new()

    def surf(x, y):
        r = garment_r(y, off) + lift
        s = max(-0.99, min(0.99, x / (r * TORSO_SX)))
        return math.cos(math.asin(s)) * r * TORSO_SZ

    front = [bm.verts.new(V(cx + x, cy + y, surf(cx + x, cy + y))) for x, y in outline]
    back = [bm.verts.new(V(cx + x, cy + y, surf(cx + x, cy + y) - thick)) for x, y in outline]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(outline)
    for i in range(n):
        bm.faces.new((front[i], back[i], back[(i + 1) % n], front[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat)


def print_ring(name, mat, outer, inner, cx, cy, off, lift=0.008, thick=0.012):
    """a printed shape with a hole in it (an 0): two outlines with as many points"""
    bm = bmesh.new()

    def surf(x, y):
        r = garment_r(y, off) + lift
        s = max(-0.99, min(0.99, x / (r * TORSO_SX)))
        return math.cos(math.asin(s)) * r * TORSO_SZ

    def loop(pts, dz):
        return [bm.verts.new(V(cx + x, cy + y, surf(cx + x, cy + y) - dz)) for x, y in pts]

    of, inf, ob, ib = loop(outer, 0), loop(inner, 0), loop(outer, thick), loop(inner, thick)
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((of[i], of[j], inf[j], inf[i]))
        bm.faces.new((ob[j], ob[i], ib[i], ib[j]))
        bm.faces.new((of[j], of[i], ob[i], ob[j]))
        bm.faces.new((inf[i], inf[j], ib[j], ib[i]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat)


def sleeve(name, mat, side, length=0.37, r0=0.165, r1=0.15, folds=0.012, cuff=None, puffs=0, seed=0.0):
    """a sleeve round one arm, from the shoulder down; `cuff` = (material, tube)"""
    px, py = PIVOT["ArmR"][0] * side, PIVOT["ArmR"][1]
    bottom = py - length
    rows = [(py + 0.06, 0.0), (py + 0.04, r0 * 0.7), (py + 0.0, r0 * 0.95)]
    rows += [(py - length * k / 10, r0 + (r1 - r0) * k / 10) for k in range(1, 11)]
    rows += [(bottom - 0.005, r1 * 0.75), (bottom - 0.01, 0.0)]
    bm = lathe_bm(rows, seg=32, depth=1.0, cx=px, sx=1.0)
    lib.wrinkle(bm, folds, freq=4.0, seed=seed + side)
    out = [lib.from_bmesh(name, bm, mat, subdiv=1)]
    if cuff:
        mat_c, tube = cuff
        bm = bmesh.new()
        lib.loop_tube(bm, [V(px + math.sin(a) * (r1 - 0.02), bottom + 0.02, math.cos(a) * (r1 - 0.02)) for a in (2 * math.pi * i / 32 for i in range(32))], tube)
        out.append(lib.from_bmesh(name + "_cuff", bm, mat_c))
    for k in range(puffs):
        y = py - 0.06 - k * (length - 0.06) / max(1, puffs - 1)
        r = r0 + (r1 - r0) * (py - y) / length
        bm = bmesh.new()
        lib.loop_tube(bm, [V(px + math.sin(a) * r, y, math.cos(a) * r) for a in (2 * math.pi * i / 32 for i in range(32))], 0.05)
        out.append(lib.from_bmesh(name + f"_puff{k}", bm, mat))
    return out


def pants(name, mat, bottom=-1.33, r0=0.2, r1=0.175, folds=0.014, cuff=True, seed=0.0, shorts=False):
    """a pair: a tube round each leg and a seat that joins them"""
    out = []
    for side in (-1, 1):
        x = side * 0.21
        rows = [(bottom - 0.01, 0.0), (bottom, r1 * 0.85)]
        rows += [(bottom + (-1.0 - bottom) * k / 8, r1 + (r0 - r1) * k / 8) for k in range(1, 9)]
        rows += [(-0.98, 0.0)]
        bm = lathe_bm(rows, seg=32, depth=0.95, cx=x, sx=1.0)
        lib.wrinkle(bm, folds * (0.6 if shorts else 1), freq=4.2, stretch=(1, 0.3 if not shorts else 0.6, 1), seed=seed + side)
        out.append(lib.from_bmesh(f"{name}{side}", bm, mat, subdiv=1))
        if cuff and not shorts:
            bm = bmesh.new()
            lib.loop_tube(bm, [V(x + math.sin(a) * (r1 - 0.012), bottom + 0.025, math.cos(a) * (r1 - 0.012) * 0.95) for a in (2 * math.pi * i / 32 for i in range(32))], 0.035)
            out.append(lib.from_bmesh(f"{name}_cuff{side}", bm, mat))
    seat = lathe_bm([(-1.14, 0.0), (-1.13, 0.3), (-1.06, 0.4), (-0.96, 0.4), (-0.94, 0.0)], seg=40, depth=0.85, sx=1.0)
    out.append(lib.from_bmesh(name + "_seat", seat, mat, subdiv=1))
    return out


def rounded_box_bm(centre, size, radius, segments=6):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = V(v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])
    bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=radius, segments=segments, profile=0.5, affect="EDGES", clamp_overlap=True)
    bm.transform(Matrix.Translation(V(*centre)))
    return bm


def rim_of(bm, pick, centre):
    """the boundary vertices that `pick` accepts, in order round `centre` (x, y)"""
    edge = {v for e in bm.edges if e.is_boundary for v in e.verts if pick(v.co)}
    return sorted((v.co.copy() for v in edge), key=lambda p: math.atan2(p.y - centre[1], p.x - centre[0]))


OPEN_X, OPEN_Y, OPEN_C, OPEN_P = 0.675, 0.455, 0.41, 3.0


def squircle(theta):
    c, s_ = math.cos(theta), math.sin(theta)
    return (OPEN_X * math.copysign(abs(c) ** (2 / OPEN_P), c), OPEN_C + OPEN_Y * math.copysign(abs(s_) ** (2 / OPEN_P), s_))


def hood(name, mat, rim_mat=None):
    """hood up: a soft shell round the head, open round the visor"""
    bm = rounded_box_bm((0, 0.45, -0.07), (1.7, 1.4, 1.38), 0.6, segments=8)
    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=2, use_grid_fill=True)
    inside = lambda c: c.z > 0.25 and (abs(c.x) / OPEN_X) ** OPEN_P + (abs(c.y - OPEN_C) / OPEN_Y) ** OPEN_P < 1
    gone = [f for f in bm.faces if inside(f.calc_center_median()) or f.calc_center_median().y < -0.08]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    # the deleted faces leave stair-stepped edges: pull them onto clean curves
    rim = []
    for v in {v for e in bm.edges if e.is_boundary for v in e.verts}:
        if v.co.z > 0.2 and v.co.y > -0.05:
            theta = math.atan2((v.co.y - OPEN_C) / OPEN_Y, v.co.x / OPEN_X)
            v.co.x, v.co.y = squircle(theta)
            rim.append(theta)
        else:
            v.co.y = -0.1
    lib.wrinkle(bm, 0.022, freq=2.6, stretch=(1, 0.6, 1), seed=3)
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.04)
    out = [lib.from_bmesh(name, bm, mat, subdiv=1)]
    bm = bmesh.new()
    pts = []
    for k in range(72):
        x, y = squircle(2 * math.pi * k / 72)
        # sit the rim on the hood's front, which curves back towards the sides
        z = 0.615 - 0.16 * (abs(x) / OPEN_X) ** 4
        pts.append(V(x * 1.02, y, z))
    lib.loop_tube(bm, pts, 0.055, samples=96)
    out.append(lib.from_bmesh(name + "_rim", bm, rim_mat or mat))
    return out


def crown(name, mat, base_y=0.62, height=0.6, sx=0.82, sz=0.69, ribs=0, cuff=None, pompom=None, peak=None, tilt=14.0):
    """
    A beanie or a cap: a dome over the head from base_y up, open below,
    pushed back by `tilt` degrees so its front edge clears the visor.
    """
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1)
    for v in bm.verts:
        v.co = V(v.co.x * sx, max(0.0, -v.co.y) * height, v.co.z * sz)
    gone = [f for f in bm.faces if all(v.co.y <= 1e-6 for v in f.verts)]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # soften the top into a dome rather than an egg
    for v in bm.verts:
        t = min(1.0, max(0.0, v.co.y / height))
        v.co.x *= 1 - 0.1 * t**3
        v.co.z *= 1 - 0.1 * t**3
        v.co.y = height * (1 - (1 - t) ** 1.6) if t > 0 else 0
    bm.transform(Matrix.Translation(V(0, base_y, -0.03)))
    if ribs:
        bm.normal_update()
        for v in bm.verts:
            v.co += v.normal * (math.sin(math.atan2(v.co.x, v.co.z) * ribs) * 0.008)
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.03)
    out = [lib.from_bmesh(name, bm, mat, subdiv=1)]
    if cuff:
        mat_c, tube = cuff
        bm = bmesh.new()
        lib.loop_tube(bm, [V(math.sin(a) * (sx + 0.01), base_y + tube * 0.7, math.cos(a) * (sz + 0.01) - 0.03) for a in (2 * math.pi * i / 48 for i in range(48))], tube)
        if ribs:
            knit(bm, ribs, 0.01)
        out.append(lib.from_bmesh(name + "_cuff", bm, mat_c))
    if pompom:
        mat_p, r = pompom
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r)
        bm.transform(Matrix.Translation(V(0, base_y + height + r * 0.6, -0.03)))
        lib.wrinkle(bm, r * 0.18, freq=14, stretch=(1, 1, 1), seed=7)
        out.append(lib.from_bmesh(name + "_pompom", bm, mat_p))
    if peak:
        mat_k, back = peak
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=12, radius=1)
        for v in bm.verts:
            v.co = V(v.co.x * 0.46, v.co.y * 0.03, v.co.z * 0.42)
        bm.transform(Matrix.Translation(V(0, base_y + 0.03, (-1 if back else 1) * (sz + 0.12) - 0.03)) @ Matrix.Rotation(math.radians(8 if back else -8), 4, "X"))
        out.append(lib.from_bmesh(name + "_peak", bm, mat_k))
    pivot = V(0, base_y, -0.03)
    m = lib.TO_BLENDER @ Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(-tilt), 4, "X") @ Matrix.Translation(-pivot) @ lib.TO_BLENDER.inverted()
    for o in out:
        o.matrix_world = m @ o.matrix_world
    return out


def band_round_head(name, mat, y, tube, grow=0.0):
    """a tube that follows the head's rounded-box outline at height y"""
    # the head is a 1.5 × 1.2 × 1.2 box with corners of radius 0.46 centred at y 0.42
    dy = max(0.0, y - (0.42 + 0.6 - 0.46))
    reach = math.sqrt(max(0.0, 0.46**2 - dy**2)) if dy else 0.46
    hx, hz, rc = 0.75 - 0.46 + reach + grow, 0.6 - 0.46 + reach + grow, reach + grow
    pts = []
    for cx, cz, a0 in ((hx - rc, hz - rc, 0), (-(hx - rc), hz - rc, 90), (-(hx - rc), -(hz - rc), 180), (hx - rc, -(hz - rc), 270)):
        for i in range(9):
            a = math.radians(a0 + 90 * i / 8)
            pts.append(V(cx + math.cos(a) * rc, y, cz + math.sin(a) * rc))
    bm = bmesh.new()
    lib.loop_tube(bm, pts, tube, samples=64)
    return lib.from_bmesh(name, bm, mat)


def blob(name, mat, centre, radii, seed=0.0, amp=0.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=1)
    for v in bm.verts:
        v.co = V(v.co.x * radii[0], v.co.z * radii[1], -v.co.y * radii[2])
    if amp:
        lib.wrinkle(bm, amp, freq=6, seed=seed)
    bm.transform(Matrix.Translation(V(*centre)))
    return lib.from_bmesh(name, bm, mat)


def digit_one(h=0.24, w=0.07):
    return [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2 - 0.02, h / 2 - 0.01), (-w / 2 - 0.06, h / 2 - 0.05), (-w / 2, h / 2 - 0.06)]


def oval(rx, ry, n=28):
    return [(math.cos(2 * math.pi * i / n) * rx, math.sin(2 * math.pi * i / n) * ry) for i in range(n)]


def slash_outline(h=0.2, w=0.05, lean=0.42):
    dx = math.tan(lean) * h / 2
    return [(-dx - w / 2, -h / 2), (-dx + w / 2, -h / 2), (dx + w / 2, h / 2), (dx - w / 2, h / 2)]


# ---------------------------------------------------------------- the week


def mon(M):
    """Monday, ship mode: a black techwear shell, orange straps and zip, olive cargos."""
    off = 0.085
    torso = [top("shell", M["coal"], off, hem=-1.15, folds=0.012, seed=1)]
    collar = lathe_bm([(-0.34, 0.0), (-0.33, 0.3), (-0.24, 0.31), (-0.12, 0.28), (-0.11, 0.0)], seg=48, sx=1.0, depth=0.92)
    torso.append(lib.from_bmesh("collar", collar, M["coal"], subdiv=1))
    torso.append(strip("zip", M["zip"], [(0, -0.28), (0, -0.7), (0, -1.12)], 0.026, off, lift=0.008))
    torso.append(strip("strap_a", M["trim"], [(-0.62, -0.42), (-0.1, -0.74), (0.55, -1.02)], 0.07, off, lift=0.02))
    torso.append(strip("strap_b", M["black"], [(0.62, -0.42), (0.2, -0.62), (-0.2, -0.86)], 0.055, off, lift=0.03))
    torso.append(ring("hem", M["black"], -1.12, off, 0.03))
    pocket = rounded_box_bm((0, 0, 0), (0.2, 0.22, 0.05), 0.03)
    pocket.transform(Matrix.Translation(on_top(-0.42, -0.62, off, 0.01)) @ Matrix.Rotation(-0.42, 4, "Y"))
    torso.append(lib.from_bmesh("pocket", pocket, M["coal"]))
    torso.append(print_on("tab", M["trim"], [(-0.05, -0.02), (0.05, -0.02), (0.05, 0.02), (-0.05, 0.02)], -0.3, -0.53, off, lift=0.04, thick=0.01))
    arms = {s: sleeve("sleeve", M["coal"], s, cuff=(M["trim"], 0.03), seed=1) for s in (-1, 1)}
    legs = pants("cargo", M["olive"], seed=1)
    for side in (-1, 1):
        bm = rounded_box_bm((side * 0.39, -1.2, 0.02), (0.06, 0.16, 0.2), 0.025)
        legs.append(lib.from_bmesh(f"cargo_pocket{side}", bm, M["olive"]))
    return {"Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


def tue(M):
    """Tuesday, hood up: a grey oversized hoodie and joggers."""
    off = 0.095
    torso = [top("hoodie", M["grey"], off, hem=-1.17, flare=0.05, folds=0.032, seed=2, gather=0.06)]
    torso.append(ring("hem", M["grey"], -1.14, off - 0.035, 0.04))
    torso.append(lib.from_bmesh("collar", lathe_bm([(-0.32, 0.0), (-0.31, 0.33), (-0.2, 0.33), (-0.1, 0.3), (-0.09, 0.0)], seg=48, sx=1.0, depth=0.92), M["grey"], subdiv=1))
    pocket_outline = [(-0.27, -0.12), (0.27, -0.12), (0.2, 0.11), (-0.2, 0.11)]
    torso.append(print_on("pocket", M["grey"], pocket_outline, 0, -0.93, off, lift=0.012, thick=0.03))
    for side in (-1, 1):
        bm = bmesh.new()
        lib.strand(bm, [on_top(side * 0.11, -0.3, off, 0.06), on_top(side * 0.13, -0.5, off, 0.035), on_top(side * 0.15 + side * 0.03, -0.74, off, 0.025)], 0.013, 0.013, lambda p: V(0, 0, 1), samples=14, ring=6, taper=12, flare=0)
        torso.append(lib.from_bmesh(f"string{side}", bm, M["white"]))
    head = hood("hood", M["grey"])
    arms = {s: sleeve("sleeve", M["grey"], s, r0=0.175, r1=0.16, folds=0.016, cuff=(M["grey"], 0.035), seed=2) for s in (-1, 1)}
    legs = pants("joggers", M["grey"], r0=0.205, r1=0.17, seed=2)
    return {"Head": head, "Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {"hides": "Head_phones"}


def wed(M):
    """Wednesday, dojo: a white taekwondo dobok with the black collar and the black belt."""
    off = 0.07
    torso = [top("dobok", M["white"], off, hem=-1.2, flare=0.05, folds=0.014, seed=3)]
    torso.append(strip("lapel_a", M["black"], [(-0.6, -0.26), (-0.25, -0.5), (0.2, -0.78), (0.55, -0.98)], 0.075, off, lift=0.012))
    torso.append(strip("lapel_b", M["black"], [(0.6, -0.26), (0.32, -0.45), (0.05, -0.64)], 0.075, off, lift=0.022))
    torso.append(ring("belt", M["black"], -0.96, off + 0.02, 0.045))
    knot = rounded_box_bm((0, 0, 0), (0.17, 0.12, 0.08), 0.035)
    knot.transform(Matrix.Translation(on_top(0.0, -0.96, off, 0.07)))
    torso.append(lib.from_bmesh("knot", knot, M["black"]))
    for side, lean in ((-1, 0.12), (1, -0.1)):
        bm = bmesh.new()
        a = on_top(side * 0.06, -0.98, off, 0.08)
        lib.strand(bm, [a, a + V(side * 0.05, -0.12, 0.03), a + V(side * 0.09 + lean * 0.3, -0.28, 0.02)], 0.05, 0.016, lambda p: V(0, 0, 1), samples=12, ring=6, taper=6, flare=0)
        torso.append(lib.from_bmesh(f"tail{side}", bm, M["black"]))
    arms = {s: sleeve("sleeve", M["white"], s, r0=0.185, r1=0.18, folds=0.016, seed=3) for s in (-1, 1)}
    legs = pants("trousers", M["white"], r0=0.21, r1=0.19, cuff=False, seed=3)
    return {"Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


def thu(M):
    """Thursday, cold morning: a cream puffer, an orange knit beanie, coal cargos."""
    off = 0.1
    torso = [top("puffer", M["cream"], off, hem=-1.12, folds=0.006, seed=4)]
    for k, y in enumerate((-1.08, -0.93, -0.78, -0.63, -0.49)):
        torso.append(ring(f"baffle{k}", M["cream"], y, off - 0.015, 0.064))
    torso.append(lib.from_bmesh("collar", lathe_bm([(-0.36, 0.0), (-0.35, 0.33), (-0.24, 0.34), (-0.13, 0.3), (-0.12, 0.0)], seg=48, sx=1.0, depth=0.92), M["cream"], subdiv=1))
    torso.append(strip("zip", M["zip"], [(0, -0.3), (0, -0.7), (0, -1.1)], 0.024, off, lift=0.07))
    head = crown("beanie", M["orange"], base_y=0.72, height=0.6, sx=0.8, sz=0.7, ribs=40, cuff=(M["orange"], 0.085))
    arms = {s: sleeve("sleeve", M["cream"], s, r0=0.18, r1=0.165, folds=0.006, puffs=3, cuff=(M["cream"], 0.03), seed=4) for s in (-1, 1)}
    legs = pants("cargo", M["coal"], seed=4)
    return {"Head": head, "Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


def fri(M):
    """Friday, hack night: a black tee with the slash, a hackathon lanyard, a cap on backwards."""
    off = 0.045
    torso = [top("tee", M["coal"], off, hem=-1.1, flare=0.03, folds=0.012, seed=5)]
    torso.append(ring("hem", M["coal"], -1.085, off + 0.01, 0.02, flare=0.03))
    torso.append(print_on("slash", M["trim"], slash_outline(0.24, 0.06), 0.14, -0.6, off))
    for side in (-1, 1):
        torso.append(strip(f"lanyard{side}", M["orange"], [(side * 0.5, -0.27), (side * 0.25, -0.5), (side * 0.04, -0.72)], 0.03, off, lift=0.012))
    badge = rounded_box_bm((0, 0, 0), (0.2, 0.26, 0.018), 0.025)
    badge.transform(Matrix.Translation(on_top(0.0, -0.86, off, 0.03)))
    torso.append(lib.from_bmesh("badge", badge, M["white"]))
    torso.append(print_on("badge_bar", M["trim"], [(-0.095, -0.03), (0.095, -0.03), (0.095, 0.03), (-0.095, 0.03)], 0, -0.77, off, lift=0.045, thick=0.006))
    head = crown("cap", M["cream"], base_y=0.76, height=0.42, sx=0.79, sz=0.68, peak=(M["orange"], True), tilt=12)
    head.append(blob("button", M["orange"], (0, 1.17, -0.1), (0.05, 0.03, 0.05)))
    arms = {s: sleeve("sleeve", M["coal"], s, length=0.17, r0=0.17, r1=0.165, folds=0.01, seed=5) for s in (-1, 1)}
    legs = pants("joggers", M["sand"], r0=0.2, r1=0.17, seed=5)
    return {"Head": head, "Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


def sat(M):
    """Saturday, game day: a basketball jersey, number 01, headband and wristbands."""
    off = 0.04
    torso = [top("jersey", M["white"], off, hem=-1.13, flare=0.04, folds=0.01, seed=6)]
    torso.append(ring("hem", M["coal"], -1.115, off + 0.01, 0.02, flare=0.04))
    torso.append(strip("trim_a", M["coal"], [(-0.55, -0.26), (-0.2, -0.42), (0, -0.48)], 0.05, off))
    torso.append(strip("trim_b", M["coal"], [(0.55, -0.26), (0.2, -0.42), (0, -0.48)], 0.05, off))
    for side in (-1, 1):
        torso.append(strip(f"side{side}", M["trim"], [(side * 1.45, -0.45), (side * 1.5, -0.8), (side * 1.52, -1.1)], 0.06, off))
    o, i = oval(0.075, 0.12), oval(0.035, 0.075)
    torso.append(print_ring("zero", M["trim"], o, i, -0.1, -0.72, off))
    torso.append(print_on("one", M["trim"], digit_one(), 0.08, -0.72, off))
    head = [band_round_head("headband", M["white"], 0.94, 0.07, grow=0.02), band_round_head("headband_stripe", M["trim"], 0.94, 0.028, grow=0.08)]
    arms = {}
    for s in (-1, 1):
        bm = bmesh.new()
        px = s * 0.45
        lib.loop_tube(bm, [V(px + math.sin(a) * 0.11, -0.36 - 0.31, math.cos(a) * 0.11) for a in (2 * math.pi * i / 32 for i in range(32))], 0.045)
        arms[s] = [lib.from_bmesh("wristband", bm, M["white"])]
    legs = pants("shorts", M["coal"], bottom=-1.26, r0=0.22, r1=0.21, shorts=True, seed=6)
    for side in (-1, 1):
        bm = rounded_box_bm((side * 0.43, -1.13, 0), (0.02, 0.24, 0.06), 0.008)
        legs.append(lib.from_bmesh(f"stripe{side}", bm, M["trim"]))
    return {"Head": head, "Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


def sun(M):
    """Sunday, off: a chunky knit turtleneck, a beanie with a pompom, soft joggers."""
    off = 0.09
    torso = [top("sweater", M["knit"], off, hem=-1.08, flare=0.02, folds=0.008, seed=7, ribs=56, gather=0.04)]
    # a band of rust stripes across the chest, like a winter knit
    for k, y in enumerate((-0.6, -0.72)):
        torso.append(ring(f"stripe{k}", M["rust"], y, off + 0.004, 0.03))
    torso.append(ring("stripe_mid", M["knit"], -0.66, off + 0.01, 0.022))
    neck = lathe_bm([(-0.36, 0.0), (-0.35, 0.3), (-0.3, 0.33), (-0.22, 0.32), (-0.14, 0.3), (-0.13, 0.0)], seg=48, sx=1.0, depth=0.92)
    knit(neck, 48, 0.012)
    torso.append(lib.from_bmesh("turtleneck", neck, M["knit"], subdiv=1))
    torso.append(ring("hem", M["knit"], -1.06, off - 0.02, 0.042))
    head = crown("beanie", M["rust"], base_y=0.72, height=0.6, sx=0.8, sz=0.7, ribs=36, cuff=(M["rust"], 0.08), pompom=(M["knit"], 0.15))
    arms = {s: sleeve("sleeve", M["knit"], s, r0=0.175, r1=0.165, folds=0.008, cuff=(M["knit"], 0.035), seed=7) for s in (-1, 1)}
    legs = pants("joggers", M["rust"], r0=0.2, r1=0.17, seed=7)
    return {"Head": head, "Torso": torso, "ArmL": arms[-1], "ArmR": arms[1], "Legs": legs}, {}


WEEK = {"mon": mon, "tue": tue, "wed": wed, "thu": thu, "fri": fri, "sat": sat, "sun": sun}


def build_day(day, M):
    root = lib.empty(f"Outfit_{day}")
    pieces, props = WEEK[day](M)
    for key, value in props.items():
        root[key] = value
    objects = [root]
    for part, objs in pieces.items():
        holder = lib.empty(f"{day}_{part}", PIVOT[part], root)
        objects.append(holder)
        for i, obj in enumerate(objs):
            lib.apply_modifiers(obj)
            obj.name = f"{day}_{part}_{i:02d}_{obj.name}"
            lib.set_parent(obj, holder)
            objects.append(obj)
    return root, objects


if __name__ == "__main__":
    import bake

    opts = lib.args()
    days = str(opts.get("only", ",".join(DAYS))).split(",")
    outdir = opts.get("out", OUT)
    for day in days:
        # the bot stands in it while it bakes, so his body shades the clothes
        # (under the head, inside the sleeves); he is not exported
        build_bot.build()
        if opts.get("preview"):
            build_bot.preview_decal(opts.get("face"), "face")
        root, objects = build_day(day, C())
        meshes = [o for o in objects if o.type == "MESH"]
        bake.bake_ao([meshes], f"ao_{day}", size=512, samples=24, distance=0.15)
        lib.export_glb(os.path.join(outdir, f"{day}.glb"), objects)
        if opts.get("preview"):
            for name in filter(None, str(root.get("hides", "")).split(",")):
                for o in bpy.data.objects:
                    if o.name.startswith(name):
                        o.hide_render = True
            views = [int(v) for v in str(opts.get("views", "0,35")).split(",")]
            lib.preview(opts["preview"], f"outfit-{day}", target=(0, -0.1, 0), distance=6.6, views=views)
