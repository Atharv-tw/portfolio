"""
The bot from the neck down, hard-surface: a torso with a chest plate, a belly
seam and a vented back panel; jointed arms with chunky three-finger mitts;
short legs in sneakers with a stitched toe cap, laces, a ribbed sole and a
heel tab. Same proportions as ever (see build_bot.py and parts.ts).
"""

import math
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, "/home/atharv/Desktop/Work/portfolio/scripts/blender")
import hard  # noqa: E402
import lib  # noqa: E402
from lib import V  # noqa: E402

TORSO_C = -0.68
SX, SZ = 1.08, 0.92


def clear(prefix):
    for o in list(bpy.context.scene.objects):
        if o.name.startswith(prefix):
            bpy.data.objects.remove(o, do_unlink=True)


def torso(M):
    clear("torso_")
    clear("Emblem")
    body = lib.capsule("torso_shell", (0, TORSO_C - 0.15, 0), (0, TORSO_C + 0.15, 0), 0.4, M["shell"], seg=64, rings=40)
    body.scale = (SX, SZ, 1)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # seams: round the belly, and an outline of the chest plate on the front
    def oval(rx, rz, n=64):
        return [(math.cos(2 * math.pi * i / n) * rx, math.sin(2 * math.pi * i / n) * rz) for i in range(n)]

    belly = hard.ring_prism("torso_belly_cut", oval(0.47, 0.41), oval(0.398, 0.338), -0.966, -0.95, axis="Y")
    plate = hard.ring_prism("torso_plate_cut", hard.outline_pill(0.5, 0.4, 0.14, 10), hard.outline_pill(0.476, 0.376, 0.128, 10), 0.34, 0.5, at=(0, -0.58, 0))
    hard.cut(body, [belly, plate])
    hard.finish(body, width=0.006, angle=30)

    # a vented panel wrapped round the back, screwed on at the corners
    import build_bot

    panel = build_bot.wrapped("torso_panel", M["cream"], math.pi - 0.55, math.pi + 0.55, -0.82, -0.54, 0.014, cols=28, rows=10, thick=0.03)
    vents = [hard.prism(f"torso_vent{k}", hard.outline_pill(0.28, 0.03, 0.015, 4), -0.6, -0.2, at=(0, -0.74 + k * 0.06, 0)) for k in range(3)]
    hard.cut(panel, vents)
    hard.finish(panel, width=0.004, angle=40)
    screws = []
    for k, (a, y) in enumerate(((math.pi - 0.44, -0.58), (math.pi + 0.44, -0.58), (math.pi - 0.44, -0.78), (math.pi + 0.44, -0.78))):
        r = 0.4 + 0.016
        p = V(math.sin(a) * r * SX, y, math.cos(a) * r * SZ)
        sc = lib.ellipsoid(f"torso_screw{k}", tuple(p), (0.02, 0.02, 0.02), M["metal"], seg=16, rings=8)
        screws.append(sc)

    emblem = lib.cylinder("Emblem", (0, -0.6, 0.39), 0.13, 0.03, M["emblem"], axis="Z", seg=48, bevel=0.012)
    slash = lib.rounded_box("torso_slash", (0, 0, 0), (0.03, 0.13, 0.012), 0.008, M["rubber"], segments=2)
    slash.matrix_world = lib.TO_BLENDER @ Matrix.Translation(V(0, -0.6, 0.41)) @ Matrix.Rotation(-0.42, 4, "Z") @ lib.TO_BLENDER.inverted() @ slash.matrix_world
    collar = lib.torus("torso_collar", (0, -0.3, 0), 0.24, 0.05, M["rubber"], seg=48, ring=12, scale=(1, 1, 0.92))
    return [body, panel, emblem, slash, collar] + screws


def arm(M, side):
    """shoulder ball, upper arm, elbow ring, forearm, cuff, a mitt with three fingers and a thumb"""
    tag = "L" if side < 0 else "R"
    clear(f"arm{tag}_")
    px, py = side * 0.45, -0.36
    out = [lib.ellipsoid(f"arm{tag}_shoulder", (px, py - 0.02, 0), (0.125, 0.125, 0.125), M["cream"], seg=32, rings=20)]
    out.append(lib.capsule(f"arm{tag}_upper", (px, py - 0.06, 0), (px, py - 0.18, 0), 0.1, M["shell"], seg=32, rings=16))
    out.append(lib.torus(f"arm{tag}_elbow", (px, py - 0.2, 0), 0.098, 0.022, M["rubber"], seg=32, ring=10))
    out.append(lib.capsule(f"arm{tag}_fore", (px, py - 0.21, 0), (px, py - 0.32, 0), 0.1, M["shell"], seg=32, rings=16, r_end=0.094))
    out.append(lib.torus(f"arm{tag}_cuff", (px, py - 0.335, 0), 0.096, 0.028, M["rubber"], seg=32, ring=10))

    # the mitt: a soft block with two grooves that make three fingers
    hand = lib.rounded_box(f"arm{tag}_hand", (px, py - 0.475, 0.005), (0.24, 0.2, 0.2), 0.085, M["cream"], segments=6)
    grooves = [hard.prism(f"arm{tag}_g{k}", hard.outline_pill(0.012, 0.16, 0.006, 3), -0.12, 0.12, at=(px + g, py - 0.53, 0.0)) for k, g in enumerate((-0.04, 0.04))]
    hard.cut(hand, grooves)
    hard.finish(hand, width=0.006, angle=35)
    thumb = lib.capsule(f"arm{tag}_thumb", (px - side * 0.09, py - 0.42, 0.06), (px - side * 0.13, py - 0.47, 0.1), 0.045, M["cream"], seg=20, rings=12)
    out += [hand, thumb]
    return out


def legs(M):
    clear("legs_")
    out = []
    for side in (-1, 1):
        x = side * 0.21
        out.append(lib.capsule(f"legs_leg{side}", (x, -1.15, 0), (x, -1.27, 0), 0.125, M["shell"], seg=32, rings=16))
        out.append(lib.torus(f"legs_knee{side}", (x, -1.22, 0), 0.124, 0.02, M["rubber"], seg=32, ring=8))
        out += sneaker(M, side, x)
    return out


def sneaker(M, side, x):
    """a chunky sneaker: upper, toe cap, collar, laces, midsole, ribbed outsole, heel tab"""
    tag = f"legs_shoe{side}"
    upper = lib.rounded_box(f"{tag}_upper", (x, -1.43, 0.06), (0.32, 0.2, 0.46), 0.1, M["cream"], segments=8)
    toe = lib.ellipsoid(f"{tag}_toe", (x, -1.47, 0.22), (0.15, 0.09, 0.11), M["cream"], seg=32, rings=16)
    collar = lib.torus(f"{tag}_collar", (x, -1.34, -0.04), 0.12, 0.03, M["rubber"], seg=32, ring=10, scale=(1, 1, 1.15))
    mid = lib.rounded_box(f"{tag}_mid", (x, -1.515, 0.07), (0.35, 0.06, 0.52), 0.03, M["cream2"], segments=4)
    sole = lib.rounded_box(f"{tag}_sole", (x, -1.553, 0.07), (0.355, 0.035, 0.525), 0.015, M["rubber"], segments=3)
    treads = [hard.prism(f"{tag}_t{k}", hard.outline_pill(0.5, 0.012, 0.005, 2), -0.02, 0.02, at=(x, -1.566, -0.16 + k * 0.06), axis="Y") for k in range(8)]
    for t in treads:
        t.rotation_euler = (0, 0, math.radians(90))
    hard.cut(sole, treads)
    hard.finish(sole, width=0.004, angle=40)
    laces = [lib.capsule(f"{tag}_lace{k}", (x - 0.09, -1.335 - k * 0.018, 0.08 + k * 0.06), (x + 0.09, -1.335 - k * 0.018, 0.08 + k * 0.06), 0.016, M["rubber"], seg=12, rings=6) for k in range(3)]
    tab = lib.rounded_box(f"{tag}_tab", (x, -1.4, -0.18), (0.1, 0.12, 0.04), 0.02, M["shell"], segments=3)
    # the "/" on the side of each shoe
    stripes = []
    for s_ in (-1, 1):
        st = lib.rounded_box(f"{tag}_mark{s_}", (0, 0, 0), (0.012, 0.1, 0.026), 0.006, M["shell"], segments=2)
        st.matrix_world = lib.TO_BLENDER @ Matrix.Translation(V(x + s_ * 0.162, -1.44, 0.04)) @ Matrix.Rotation(math.radians(-25 * s_), 4, "X") @ lib.TO_BLENDER.inverted() @ st.matrix_world
        stripes.append(st)
    return [upper, toe, collar, mid, sole, tab] + laces + stripes
