"""
Turns the modelled bot into public/models/bot.glb for the site.

Works on copies, so the model stays editable: joins the pieces of each body
part that share a material, parents them under the pivots the site animates
(parts.ts), unwraps everything into one atlas, bakes ambient occlusion and the
procedural surface detail (normal map) into it, gives each piece a plain
material that carries those two maps, and exports.
"""

import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FOOT = 1.57
PIVOT = {"Head": (0, -0.14, 0), "Torso": (0, -0.68, 0), "ArmL": (-0.45, -0.36, 0), "ArmR": (0.45, -0.36, 0), "Legs": (0, -1.1, 0)}
GROUP_OF = (
    ("head_", "Head"), ("phones_", "Head"), ("antenna_", "Head"), ("print_back", "Head"), ("print_side", "Head"),
    ("AntennaTip", "Head"), ("Face", "Head"),
    ("torso_", "Torso"), ("Emblem", "Torso"), ("print_unit", "Torso"),
    ("armL_", "ArmL"), ("armR_", "ArmR"), ("legs_", "Legs"),
)
# kept as their own meshes: the site drives them by name
SINGLE = {"Face", "AntennaTip", "Emblem"}
# what each material looks like on the web, beside the baked maps
FLAT = {
    "shell": ("#ff6a17", 0.42), "cream": ("#f3eee4", 0.5), "cream2": ("#e6ddcc", 0.55), "rubber": ("#1b1b20", 0.72),
    "leather": ("#efe7d8", 0.5), "metal": ("#c4c7cf", 0.3), "visor": ("#050507", 0.06), "tip": ("#ff6a17", 0.3),
    "emblem": ("#f3eee4", 0.45), "print": ("#17171b", 0.6), "face": ("#000000", 0.5),
}
SIZE = 1024


def base_name(mat):
    return mat.name.split(".")[0] if mat else ""


def copies(scene):
    """duplicate the model into an export collection, grouped by body part and material"""
    col = bpy.data.collections.get("Bot Export")
    if col:
        for o in list(col.objects):
            bpy.data.objects.remove(o, do_unlink=True)
    else:
        col = bpy.data.collections.new("Bot Export")
        scene.collection.children.link(col)
    buckets = {}
    for o in scene.objects:
        if o.type != "MESH" or o.users_collection[0] is col:
            continue
        group = next((g for p, g in GROUP_OF if o.name.startswith(p)), None)
        if not group:
            continue
        dup = o.copy()
        dup.data = o.data.copy()
        col.objects.link(dup)
        mat = base_name(o.material_slots[0].material) if o.material_slots else ""
        # headphones stay apart from the head, so an outfit can hide them (a hood)
        family = f"{group}_phones" if o.name.startswith("phones_") else group
        key = (family, o.name if o.name in SINGLE else mat)
        buckets.setdefault(key, []).append(dup)
    # the originals of the pieces the site finds by name step aside for their copies
    for name in SINGLE:
        src = bpy.data.objects.get(name)
        if src and src.users_collection[0] is not col:
            src.name = "src_" + name
    joined = {}
    for (family, key), objs in buckets.items():
        group = family.split("_")[0]
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        obj.name = key if key in SINGLE else f"{family}_{key}"
        obj.data.name = obj.name
        joined[obj.name] = (group, obj)
    return col, joined


def unwrap(objs):
    """one atlas for everything: smart-project each piece, pack all islands together"""
    for o in objs:
        uvs = o.data.uv_layers
        while len(uvs):
            uvs.remove(uvs[0])
        uvs.new(name="bake")
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=0.003, rotate=True)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(objs, kind, image, samples=64):
    """bakes one pass of every piece into `image`, through each material's active image node"""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.render.bake.margin = 6
    tmp = []
    for o in objs:
        for slot in o.material_slots:
            nt = slot.material.node_tree
            node = nt.nodes.new("ShaderNodeTexImage")
            node.image = image
            nt.nodes.active = node
            tmp.append((nt, node))
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if kind == "AO":
        scene.world.light_settings.distance = 0.25
        bpy.ops.object.bake(type="AO")
    else:
        bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT")
    for nt, node in tmp:
        nt.nodes.remove(node)
    image.pack()


def web_material(name, ao, normal):
    """a plain material that carries the baked maps; the site re-skins by name"""
    mat = bpy.data.materials.get(f"web_{name}") or bpy.data.materials.new(f"web_{name}")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    colour, rough = FLAT.get(name, ("#888888", 0.5))
    bsdf.inputs["Base Color"].default_value = lib.srgb(colour)
    bsdf.inputs["Roughness"].default_value = rough
    if name == "metal":
        bsdf.inputs["Metallic"].default_value = 1.0
    if name not in ("face",):
        nimg = nt.nodes.new("ShaderNodeTexImage")
        nimg.image = normal
        nimg.image.colorspace_settings.name = "Non-Color"
        nmap = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(nimg.outputs["Color"], nmap.inputs["Color"])
        nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
        # the exporter reads occlusion from a group called "glTF Material Output"
        group = bpy.data.node_groups.get("glTF Material Output")
        if not group:
            group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
            group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
        gnode = nt.nodes.new("ShaderNodeGroup")
        gnode.node_tree = group
        aimg = nt.nodes.new("ShaderNodeTexImage")
        aimg.image = ao
        aimg.image.colorspace_settings.name = "Non-Color"
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(aimg.outputs["Color"], sep.inputs["Color"])
        nt.links.new(sep.outputs["Red"], gnode.inputs["Occlusion"])
    mat.name = f"web_{name}"
    return mat


def run(out=os.path.join(ROOT, "public", "models", "bot.glb"), samples=64):
    scene = bpy.context.scene
    hidden = []
    for o in scene.objects:
        if o.name.startswith("studio_") and not o.hide_render:
            o.hide_render = True
            hidden.append(o)
    col, joined = copies(scene)
    pieces = [o for name, (g, o) in joined.items() if name != "Face"]
    unwrap(pieces)
    ao = bpy.data.images.get("bot_ao") or bpy.data.images.new("bot_ao", SIZE, SIZE)
    normal = bpy.data.images.get("bot_normal") or bpy.data.images.new("bot_normal", SIZE, SIZE)
    for img in (ao, normal):
        img.scale(SIZE, SIZE)
        img.file_format = "PNG"
    bake(pieces, "AO", ao, samples)
    bake(pieces, "NORMAL", normal, 16)

    # plain materials with the maps, named as the site expects ("shell", not "web_shell")
    for name, (group, o) in joined.items():
        mat = base_name(o.material_slots[0].material)
        web = web_material(mat, ao, normal)
        o.material_slots[0].material = web
        while len(o.material_slots) > 1:
            o.data.materials.pop()
    # the procedural originals step aside while the plain ones take their names
    renamed = []
    webs = {o.material_slots[0].material for _, o in joined.values()}
    for mat in webs:
        src = bpy.data.materials.get(mat.name[4:])
        if src:
            renamed.append((src, src.name))
            src.name = "src_" + src.name
    for mat in webs:
        renamed.append((mat, mat.name))
        mat.name = mat.name[4:]

    # the pivots the site animates
    squash = bpy.data.objects.new("Squash", None)
    col.objects.link(squash)
    squash.location = lib.to_blender((0, -FOOT, 0))
    groups = {}
    for g, at in PIVOT.items():
        e = bpy.data.objects.new(g, None)
        col.objects.link(e)
        e.location = lib.to_blender(at)
        lib.set_parent(e, squash)
        groups[g] = e
    for name, (group, o) in joined.items():
        lib.set_parent(o, groups[group])

    lib.export_glb(out, [squash] + list(groups.values()) + [o for _, o in joined.values()])
    for mat, name in reversed(renamed):
        mat.name = name
    for name in SINGLE:
        src = bpy.data.objects.get("src_" + name)
        if src:
            joined[name][1].name = name + "_web"
            src.name = name
    for o in hidden:
        o.hide_render = False
    col.hide_viewport = True
    return out
