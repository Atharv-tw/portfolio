"""
Printed marks on the bot: text and shapes laid onto a surface, hair-thin, the
way pad printing sits on a vinyl toy.
"""

import math

import bpy
from mathutils import Matrix

import lib

FONT = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"


def printed(name, text, at, facing, onto, mat, size=0.1, font=FONT, spacing=1.0, lift=0.0015):
    """
    `text` printed on `onto` at the site-space point `at`, reading towards
    `facing` ('front' or 'back' or 'left' or 'right'). Returns the mesh.
    """
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = text
    curve.font = bpy.data.fonts.load(font, check_existing=True)
    curve.size = size
    curve.space_character = spacing
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.extrude = 0.0012
    obj = lib.link(bpy.data.objects.new(name, curve))
    turn = {
        "front": Matrix.Rotation(math.radians(90), 4, "X"),
        "back": Matrix.Rotation(math.radians(180), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X"),
        "left": Matrix.Rotation(math.radians(-90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X"),
        "right": Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X"),
    }[facing]
    obj.matrix_world = Matrix.Translation(lib.to_blender(at)) @ turn
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    # sit it on the surface, whatever its curve
    sw = obj.modifiers.new("onto", "SHRINKWRAP")
    sw.target = onto
    sw.wrap_method = "NEAREST_SURFACEPOINT"
    sw.wrap_mode = "OUTSIDE_SURFACE"
    sw.offset = lift
    lib.apply_modifiers(obj)
    return obj
