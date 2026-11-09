"""
The bot's head, hard-surface: a soft rounded shell with a seam that splits
the face plate from the back, a deep recess the visor glass sits in behind a
rubber gasket, vents on top, screws at the jaw. Run inside Blender (live or
-b); it only touches the scene it is run in.
"""

import importlib
import math
import sys

import bpy

sys.path.insert(0, "/home/atharv/Desktop/Work/portfolio/scripts/blender")
import hard  # noqa: E402
import lib  # noqa: E402

importlib.reload(lib)
importlib.reload(hard)
from lib import V  # noqa: E402

HC = (0, 0.42, 0)  # head centre, site space
W, H, D, R = 1.5, 1.2, 1.2, 0.46


def clear(prefix):
    for o in list(bpy.context.scene.objects):
        if o.name.startswith(prefix):
            bpy.data.objects.remove(o, do_unlink=True)


def head(M):
    clear("head_")
    shell = lib.rounded_box("head_shell", HC, (W, H, D), R, M["shell"], segments=14)

    seam_z = 0.13
    outer = hard.outline_pill(W + 0.06, H + 0.06, R + 0.03, 16)
    inner = hard.outline_pill(W - 0.024, H - 0.024, R - 0.012, 16)
    seam = hard.ring_prism("head_seam_cut", outer, inner, seam_z - 0.009, seam_z + 0.009, at=HC)

    # the recess the visor sits in, and a lip round it
    recess = hard.prism("head_recess_cut", hard.outline_pill(1.3, 0.86, 0.37, 16), 0.48, 0.9, at=(0, 0.41, 0))

    vents = [hard.prism(f"head_vent_cut{i}", hard.outline_pill(0.3, 0.05, 0.025, 6), -0.04, 0.04, at=(0, 1.02, -0.1 + i * 0.09), axis="Y") for i in range(3)]
    hard.cut(shell, [seam, recess] + vents)
    hard.finish(shell, width=0.01, segments=3, angle=30)

    # rubber gasket inside the recess, then the glass, slightly domed
    gasket_o = hard.outline_pill(1.3, 0.86, 0.37, 16)
    gasket_i = hard.outline_pill(1.2, 0.76, 0.32, 16)
    gasket = hard.ring_prism("head_gasket", gasket_o, gasket_i, 0.48, 0.545, at=(0, 0.41, 0))
    gasket.data.materials.clear()
    gasket.data.materials.append(M["rubber"])
    hard.finish(gasket, width=0.012, segments=3, angle=30)

    glass = hard.pill_dome("head_glass", M["visor"], 1.22, 0.78, 0.33, 0.48, 0.545, 0.04, at=(0, 0.41, 0))
    return [shell, gasket, glass]


def materials():
    return {
        "shell": lib.material("shell", "#ff6a17", 0.45, 0.2),
        "rubber": lib.material("rubber", "#1b1b20", 0.75),
        "visor": lib.material("visor", "#050507", 0.08, 1.0),
        "metal": lib.material("metal", "#b9bcc4", 0.35),
        "leather": lib.material("leather", "#efe7d8", 0.6),
        "cream": lib.material("cream", "#f3eee4", 0.5, 0.3),
        "tip": lib.material("tip", "#ff6a17", 0.3, 0.3, "#ff6a17", 3),
        "face": lib.material("face", "#000000", 0.5),
    }




def glass_front(x, y):
    """z of the visor glass's front at (x, y), site space"""
    s = max(abs(x) / 0.61, abs(y - 0.41) / 0.39)
    return 0.545 + 0.04 * (1 - min(1.0, s) ** 2)


def face_screen(M):
    """the plane the canvas face is drawn on, laid over the glass"""
    import bmesh

    clear("Face")
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    cols, rows, fw, fh = 24, 14, 1.06, 0.596
    grid = []
    for j in range(rows + 1):
        y = 0.41 - fh / 2 + fh * j / rows
        grid.append([bm.verts.new(V(x, y, glass_front(x, y) + 0.004)) for x in (-fw / 2 + fw * i / cols for i in range(cols + 1))])
    for j in range(rows):
        for i in range(cols):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for loop, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                loop[uv].uv = (u / cols, v / rows)
    return lib.from_bmesh("Face", bm, M["face"], keep_uv=True)


def headphones(M):
    """over-ear cans: a padded band, sliders, rubber cups with a shell cap, leather cushions, a light ring"""
    import bmesh
    from mathutils import Matrix

    clear("phones_")
    out = []
    tilt = Matrix.Translation(V(0, 0.38, 0)) @ Matrix.Rotation(-0.3, 4, "X")

    def arc(name, mat, radius, tube_w, tube_d, a0=0.18, a1=math.pi - 0.18):
        bm = bmesh.new()
        steps, ring = 48, 12
        rows = []
        for k in range(steps + 1):
            a = a0 + (a1 - a0) * k / steps
            c = V(math.cos(a) * radius, math.sin(a) * radius, 0)
            o = V(math.cos(a), math.sin(a), 0)
            rows.append([bm.verts.new(c + o * (math.cos(b) * tube_w) + V(0, 0, math.sin(b) * tube_d)) for b in (2 * math.pi * j / ring for j in range(ring))])
        for r0, r1 in zip(rows, rows[1:]):
            for j in range(ring):
                bm.faces.new((r0[j], r1[j], r1[(j + 1) % ring], r0[(j + 1) % ring]))
        bm.faces.new(rows[0][::-1])
        bm.faces.new(rows[-1])
        bm.transform(tilt)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        return lib.from_bmesh(name, bm, mat)

    out.append(arc("phones_band", M["rubber"], 0.86, 0.045, 0.07))
    out.append(arc("phones_pad", M["leather"], 0.8, 0.03, 0.055, 0.7, math.pi - 0.7))
    for side in (-1, 1):
        out.append(lib.rounded_box(f"phones_slider{side}", (side * 0.83, 0.62, -0.02), (0.06, 0.32, 0.1), 0.025, M["metal"], segments=3))
        cup = lib.cylinder(f"phones_cup{side}", (side * 0.8, 0.38, 0), 0.31, 0.16, M["rubber"], axis="X", seg=64, bevel=0.035)
        cap = lib.cylinder(f"phones_cap{side}", (side * 0.895, 0.38, 0), 0.25, 0.06, M["shell"], axis="X", seg=64, bevel=0.022)
        cushion = lib.torus(f"phones_cushion{side}", (side * 0.7, 0.38, 0), 0.215, 0.085, M["leather"], seg=64, ring=20, turn=Matrix.Rotation(math.radians(90), 4, "Z"))
        ring_ = lib.torus(f"phones_ring{side}", (side * 0.93, 0.38, 0), 0.165, 0.016, M["tip"], seg=64, ring=10, turn=Matrix.Rotation(math.radians(90), 4, "Z"))
        out += [cup, cap, cushion, ring_]
    return out


def antenna(M):
    """the "/" of AT/: a joint, a coiled spring, a rod, a glowing bulb"""
    import bmesh
    from mathutils import Matrix

    clear("antenna_")
    clear("AntennaTip")
    tilt = Matrix.Translation(V(0.9, 0.7, 0)) @ Matrix.Rotation(-0.42, 4, "Z")
    parts = [lib.ellipsoid("antenna_joint", (0, 0.0, 0), (0.09, 0.07, 0.09), M["cream"], seg=32, rings=16)]
    bm = bmesh.new()
    pts = [V(math.cos(t) * 0.045, 0.05 + t * 0.011, math.sin(t) * 0.045) for t in (k * 0.25 for k in range(60))]
    lib.strand(bm, pts, 0.014, 0.014, lambda p: V(p.x, 0, p.z).normalized() if (abs(p.x) + abs(p.z)) > 1e-6 else V(1, 0, 0), samples=120, ring=6, taper=30, flare=0)
    parts.append(lib.from_bmesh("antenna_spring", bm, M["rubber"]))
    parts.append(lib.capsule("antenna_rod", (0, 0.2, 0), (0, 0.5, 0), 0.034, M["shell"], seg=24, rings=12))
    parts.append(lib.ellipsoid("AntennaTip", (0, 0.56, 0), (0.08, 0.08, 0.08), M["tip"], seg=40, rings=24))
    for o in parts:
        o.matrix_world = lib.TO_BLENDER @ tilt @ lib.TO_BLENDER.inverted() @ o.matrix_world
    return parts
