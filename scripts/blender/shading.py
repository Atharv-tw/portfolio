"""
Procedural surfaces for the bot, the way a toy is finished: vinyl with a fine
grain and a little colour drift, rubber with a matte tooth, stitched leather
for the cushions, brushed metal, glossy glass. They are baked into textures
for the web (bake.py); here they are live node trees.
"""

import bpy

import lib


def _tree(name):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (300, 0)
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return mat, nt, bsdf


def _noise(nt, scale, detail=3.0, rough=0.55, coords="Object", loc=(-700, 0)):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    tc.location = (loc[0] - 250, loc[1])
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.location = loc
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    nt.links.new(tc.outputs[coords], n.inputs["Vector"])
    return n


def _range(nt, src, lo, hi, loc):
    m = nt.nodes.new("ShaderNodeMapRange")
    m.location = loc
    m.inputs["To Min"].default_value = lo
    m.inputs["To Max"].default_value = hi
    nt.links.new(src, m.inputs["Value"])
    return m.outputs["Result"]


def _bump(nt, height, strength, distance=0.01, loc=(100, -300)):
    b = nt.nodes.new("ShaderNodeBump")
    b.location = loc
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height, b.inputs["Height"])
    return b.outputs["Normal"]


def vinyl(name, colour, rough=0.42, grain=0.03, drift=0.03, coat=0.25):
    """soft-touch vinyl: a fine grain you feel more than see, colour that drifts a hair"""
    mat, nt, bsdf = _tree(name)
    base = lib.srgb(colour)
    big = _noise(nt, 2.5, 2, 0.5, loc=(-700, 200))
    hue = nt.nodes.new("ShaderNodeMix")
    hue.data_type = "RGBA"
    hue.location = (-200, 250)
    hue.inputs["A"].default_value = tuple(c * (1 - drift) for c in base[:3]) + (1,)
    hue.inputs["B"].default_value = tuple(min(1, c * (1 + drift)) for c in base[:3]) + (1,)
    nt.links.new(big.outputs["Fac"], hue.inputs["Factor"])
    nt.links.new(hue.outputs["Result"], bsdf.inputs["Base Color"])
    mid = _noise(nt, 40, 3, 0.6, loc=(-700, -100))
    nt.links.new(_range(nt, mid.outputs["Fac"], rough - 0.06, rough + 0.06, (-200, -50)), bsdf.inputs["Roughness"])
    fine = _noise(nt, 900, 2, 0.5, loc=(-700, -400))
    nt.links.new(_bump(nt, fine.outputs["Fac"], grain, 0.002), bsdf.inputs["Normal"])
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.35
    return mat


def rubber(name, colour="#1b1b20"):
    mat, nt, bsdf = _tree(name)
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    tooth = _noise(nt, 1400, 4, 0.7, loc=(-700, -300))
    nt.links.new(_range(nt, tooth.outputs["Fac"], 0.62, 0.8, (-200, -50)), bsdf.inputs["Roughness"])
    nt.links.new(_bump(nt, tooth.outputs["Fac"], 0.12, 0.003), bsdf.inputs["Normal"])
    return mat


def leather(name, colour="#efe7d8"):
    """quilted leather: a pebble grain from cells, softly shiny"""
    mat, nt, bsdf = _tree(name)
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    tc.location = (-950, -200)
    cells = nt.nodes.new("ShaderNodeTexVoronoi")
    cells.location = (-700, -200)
    cells.inputs["Scale"].default_value = 220
    cells.feature = "DISTANCE_TO_EDGE"
    nt.links.new(tc.outputs["Object"], cells.inputs["Vector"])
    nt.links.new(_bump(nt, cells.outputs["Distance"], 0.25, 0.004), bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Coat Weight"].default_value = 0.2
    return mat


def metal(name, colour="#c4c7cf"):
    mat, nt, bsdf = _tree(name)
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    bsdf.inputs["Metallic"].default_value = 1.0
    streak = _noise(nt, 6, 2, 0.5, loc=(-700, -200))
    streak.inputs["Scale"].default_value = 3
    nt.links.new(_range(nt, streak.outputs["Fac"], 0.22, 0.38, (-200, -50)), bsdf.inputs["Roughness"])
    return mat


def glass(name, colour="#050507"):
    mat, nt, bsdf = _tree(name)
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    bsdf.inputs["Roughness"].default_value = 0.06
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.02
    bsdf.inputs["Specular IOR Level"].default_value = 0.7
    return mat


def glow(name, colour, strength=4.0):
    mat, nt, bsdf = _tree(name)
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    bsdf.inputs["Emission Color"].default_value = lib.srgb(colour)
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Roughness"].default_value = 0.3
    return mat


def image_emit(name, path, strength=2.0):
    """the face screen in a preview: its picture, glowing, see-through where empty"""
    mat, nt, bsdf = _tree(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.location = (-300, 0)
    tex.image = bpy.data.images.load(path, check_existing=True)
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Emission Strength"].default_value = strength
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    return mat


def bot_materials(face_png=None):
    """every material on the bot, by the names the site reads"""
    return {
        "shell": vinyl("shell", "#ff6a17"),
        "cream": vinyl("cream", "#f3eee4", rough=0.5, drift=0.02),
        "cream2": vinyl("cream2", "#e6ddcc", rough=0.55, drift=0.02, coat=0.1),
        "rubber": rubber("rubber"),
        "leather": leather("leather"),
        "metal": metal("metal"),
        "visor": glass("visor"),
        "tip": glow("tip", "#ff6a17"),
        "emblem": vinyl("emblem", "#f3eee4", rough=0.45),
        "face": image_emit("face", face_png) if face_png else lib.material("face", "#000000", 0.5),
        "print": vinyl("print", "#17171b", rough=0.6, grain=0.0, coat=0.0),
    }
