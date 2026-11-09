"""
Ambient occlusion baked into a texture, for anything the site shows: the
soft darkening where one surface tucks under another (a sleeve at the
shoulder, a mug on the plinth), which a browser cannot afford to work out.
The exporter writes it as the material's occlusion map; the site reads it.
"""

import bpy

import lib


def unwrap(objs):
    """one atlas for all of them: each smart-projected, all islands packed together"""
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
    bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
    bpy.ops.object.mode_set(mode="OBJECT")


def occlusion_output(mat, image):
    """hooks `image` up as the occlusion the glTF exporter writes"""
    mat.use_nodes = True
    nt = mat.node_tree
    group = bpy.data.node_groups.get("glTF Material Output")
    if not group:
        group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    if any(n.type == "GROUP" and n.node_tree is group for n in nt.nodes):
        return
    gnode = nt.nodes.new("ShaderNodeGroup")
    gnode.node_tree = group
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = image
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(img.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Red"], gnode.inputs["Occlusion"])


def bake_ao(groups, name, size=1024, samples=32, distance=0.2):
    """
    Bakes occlusion for `groups` (lists of mesh objects) into one image. Each
    group is baked with the others hidden, so things that are never on screen
    together (one scene's set and the next) do not shade each other.
    """
    objs = [o for g in groups for o in g]
    unwrap(objs)
    image = bpy.data.images.get(name) or bpy.data.images.new(name, size, size)
    image.scale(size, size)
    image.colorspace_settings.name = "Non-Color"
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.render.bake.margin = 4
    if not scene.world:
        scene.world = bpy.data.worlds.new("bake")
    scene.world.light_settings.distance = distance
    tmp = []
    for o in objs:
        for slot in o.material_slots:
            nt = slot.material.node_tree if slot.material.use_nodes else None
            if nt is None:
                slot.material.use_nodes = True
                nt = slot.material.node_tree
            node = nt.nodes.new("ShaderNodeTexImage")
            node.image = image
            nt.nodes.active = node
            tmp.append((nt, node))
    for k, group in enumerate(groups):
        others = [o for g in groups if g is not group for o in g]
        for o in others:
            o.hide_render = True
        bpy.ops.object.select_all(action="DESELECT")
        for o in group:
            o.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        scene.render.bake.use_clear = k == 0
        bpy.ops.object.bake(type="AO")
        for o in others:
            o.hide_render = False
    for nt, node in tmp:
        nt.nodes.remove(node)
    image.pack()
    for mat in {s.material for o in objs for s in o.material_slots}:
        occlusion_output(mat, image)
    return image
