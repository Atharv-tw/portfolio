#!/usr/bin/env sh
# Rebuilds every model in public/models from the scripts in this folder, then
# welds, simplifies and compresses them (meshopt; three.js decodes it without
# fetching anything).
#
#   BLENDER=/path/to/blender npm run models
set -e
BLENDER="${BLENDER:-blender}"
GLTF="npx -y @gltf-transform/cli@4.1.0"
cd "$(dirname "$0")/../.."

# the bot is modelled and shaded in art/bot.blend (model_head.py, model_body.py,
# shading.py, decals.py); this bakes its detail and exports it
"$BLENDER" -b art/bot.blend --python-expr "import bpy, sys; sys.path.insert(0, 'scripts/blender'); [bpy.data.scenes.remove(s) for s in list(bpy.data.scenes) if s.name != 'Bot']; import export_bot; export_bot.run()"

for script in build_outfits build_sets; do
  "$BLENDER" -b --factory-startup -P "scripts/blender/$script.py"
done

for file in public/models/*.glb public/models/outfits/*.glb; do
  $GLTF weld "$file" "$file"
  # the bot keeps every polygon; the clothes and sets lose half where nobody can tell
  case "$file" in *bot.glb) ;; *) $GLTF simplify "$file" "$file" --ratio 0.5 --error 0.0004 ;; esac
  $GLTF webp "$file" "$file" --quality 80
  $GLTF meshopt "$file" "$file"
done
ls -la public/models public/models/outfits
