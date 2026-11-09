"""
Hard-surface helpers: the way a toy designer models in Blender, scripted.
Booleans cut seams, vents and recesses into dense smooth shapes; a bevel
modifier softens every cut edge and a weighted-normal modifier keeps the big
surfaces smooth beside them.
"""

import math

import bmesh
import bpy

import lib
from lib import V


def outline_pill(w, h, r, n=12):
    """a rounded rectangle, (x, y) points counter-clockwise"""
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, -h / 2 + r, -90), (w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def prism(name, outline, z0, z1, mat=None, at=(0, 0, 0), axis="Z"):
    """
    A straight extrusion of a 2D outline between two depths, in site space.
    axis Z: outline in x/y, extruded along z (towards the viewer).
    axis Y: outline in x/z, extruded along y (up).
    axis X: outline in z/y, extruded along x.
    """
    bm = bmesh.new()

    def p(u, v, w):
        if axis == "Z":
            return V(at[0] + u, at[1] + v, at[2] + w)
        if axis == "Y":
            return V(at[0] + u, at[1] + w, at[2] + v)
        return V(at[0] + w, at[1] + v, at[2] + u)

    a = [bm.verts.new(p(u, v, z0)) for u, v in outline]
    b = [bm.verts.new(p(u, v, z1)) for u, v in outline]
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    n = len(outline)
    for i in range(n):
        bm.faces.new((a[i], b[i], b[(i + 1) % n], a[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat or cutter_mat(), smooth=False)


def ring_prism(name, outer, inner, z0, z1, at=(0, 0, 0), axis="Z"):
    """a band: the space between two outlines with the same number of points"""
    bm = bmesh.new()

    def p(u, v, w):
        if axis == "Z":
            return V(at[0] + u, at[1] + v, at[2] + w)
        if axis == "Y":
            return V(at[0] + u, at[1] + w, at[2] + v)
        return V(at[0] + w, at[1] + v, at[2] + u)

    loops = [[bm.verts.new(p(u, v, z)) for u, v in pts] for pts, z in ((outer, z0), (outer, z1), (inner, z1), (inner, z0))]
    n = len(outer)
    for k in range(4):
        l0, l1 = loops[k], loops[(k + 1) % 4]
        for i in range(n):
            bm.faces.new((l0[i], l0[(i + 1) % n], l1[(i + 1) % n], l1[i]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, cutter_mat(), smooth=False)


def cutter_mat():
    return lib.material("cutter", "#ff00ff", 0.5)


def cut(target, cutters, keep=False):
    """boolean difference of every cutter from target, applied"""
    for c in cutters:
        mod = target.modifiers.new("cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.object = c
        c.hide_viewport = True
        c.hide_render = True
        lib.apply_modifiers(target)
        if not keep:
            bpy.data.objects.remove(c, do_unlink=True)
    # the cut faces arrive with the cutter's material: give them the target's
    first = target.data.materials[0]
    while len(target.data.materials) > 1:
        target.data.materials.pop()
    target.data.materials[0] = first
    for poly in target.data.polygons:
        poly.material_index = 0
    return target


def union(target, others):
    for o in others:
        mod = target.modifiers.new("union", "BOOLEAN")
        mod.operation = "UNION"
        mod.solver = "EXACT"
        mod.object = o
        lib.apply_modifiers(target)
        bpy.data.objects.remove(o, do_unlink=True)
    return target


def finish(obj, width=0.008, segments=3, angle=35, apply=True):
    """soften every hard edge a little, keep big surfaces smooth"""
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bev = obj.modifiers.new("bevel", "BEVEL")
    bev.width = width
    bev.segments = segments
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(angle)
    bev.harden_normals = True
    bev.miter_outer = "MITER_ARC"
    wn = obj.modifiers.new("normals", "WEIGHTED_NORMAL")
    wn.keep_sharp = True
    wn.weight = 100
    if apply:
        lib.apply_modifiers(obj)
    return obj


def pill_dome(name, mat, w, h, r, z0, z1, bulge, at=(0, 0, 0), rings=10, n=16):
    """
    A lens: a rounded-rectangle outline, flat at the back (z0), its front (z1)
    swelling forward by `bulge` in the middle. Built in concentric rings so it
    shades without the pinches an n-gon would give.
    """
    out = outline_pill(w, h, r, n)
    bm = bmesh.new()
    back = [bm.verts.new(V(at[0] + x, at[1] + y, at[2] + z0)) for x, y in out]
    rows = [[bm.verts.new(V(at[0] + x, at[1] + y, at[2] + z1)) for x, y in out]]
    for k in range(1, rings):
        s = 1 - k / rings
        lift = bulge * (1 - s**2)
        rows.append([bm.verts.new(V(at[0] + x * s, at[1] + y * s, at[2] + z1 + lift)) for x, y in out])
    centre = bm.verts.new(V(at[0], at[1], at[2] + z1 + bulge))
    m = len(out)
    for i in range(m):
        j = (i + 1) % m
        bm.faces.new((back[j], back[i], rows[0][i], rows[0][j]))
    for r0, r1 in zip(rows, rows[1:]):
        for i in range(m):
            j = (i + 1) % m
            bm.faces.new((r0[i], r1[i], r1[j], r0[j]))
    for i in range(m):
        bm.faces.new((rows[-1][i], centre, rows[-1][(i + 1) % m]))
    bm.faces.new(list(reversed(back)))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return lib.from_bmesh(name, bm, mat)
