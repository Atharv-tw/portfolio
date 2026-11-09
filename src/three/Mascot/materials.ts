import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export const ORANGE = '#ff6a17'
export const CREAM = '#f3eee4'
export const COAL = '#17171b'
export const VISOR = '#030304'

/** studio reflections for the clearcoat, baked once per renderer — no network */
const envCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>()
export function studioEnv(gl: THREE.WebGLRenderer) {
  let tex = envCache.get(gl)
  if (!tex) {
    const pmrem = new THREE.PMREMGenerator(gl)
    tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    envCache.set(gl, tex)
  }
  return tex
}

/** glossy vinyl, the bot's own plastic */
export function toy(gl: THREE.WebGLRenderer, color: THREE.ColorRepresentation, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    clearcoat: 0.7,
    clearcoatRoughness: 0.32,
    envMap: studioEnv(gl),
    envMapIntensity: 0.5,
    ...extra,
  })
}

/** soft matte fabric with a sheen at the edges, for his clothes */
export function fabric(gl: THREE.WebGLRenderer, color: THREE.Color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.88,
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: color.clone().lerp(new THREE.Color('#ffffff'), 0.45),
    envMap: studioEnv(gl),
    envMapIntensity: 0.32,
  })
}

/** the bot's own set of materials, shared by the procedural body and the GLB */
export function botMaterials(gl: THREE.WebGLRenderer) {
  return {
    shell: toy(gl, ORANGE),
    cream: toy(gl, CREAM, { roughness: 0.6, clearcoat: 0.45 }),
    coal: toy(gl, COAL, { roughness: 0.55, clearcoat: 0.35 }),
    pad: toy(gl, COAL, { roughness: 0.95, clearcoat: 0 }),
    visor: toy(gl, VISOR, { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.32 }),
    tip: toy(gl, ORANGE, { emissive: ORANGE, emissiveIntensity: 1.6, roughness: 0.3 }),
    emblem: toy(gl, CREAM, { emissive: '#000000', emissiveIntensity: 0, roughness: 0.5, clearcoat: 0.6 }),
  }
}

/**
 * Gives every mesh under `root` the site's own materials, by the material's
 * name in the GLB: `named` first, fabric for `cloth_*`, glowing for the scene
 * colour (`accent`, `screen`), and the file's own colour on vinyl otherwise.
 * The detail baked in Blender (normal map, ambient occlusion) comes along.
 * One material per name, so a colour set on it reaches every mesh that uses it.
 */
export function reskin(root: THREE.Object3D, gl: THREE.WebGLRenderer, named: Record<string, THREE.Material> = {}) {
  const made = new Map<string, THREE.Material>()
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const src = mesh.material as THREE.MeshStandardMaterial
    const name = src.name
    let mat = made.get(name)
    if (!mat) {
      const color = src.color?.clone() ?? new THREE.Color('#888888')
      const rough = src.roughness ?? 0.5
      let m: THREE.MeshPhysicalMaterial
      if (named[name]) m = (named[name] as THREE.MeshPhysicalMaterial).clone()
      else if (name.startsWith('cloth_')) m = fabric(gl, color)
      else if (name === 'accent' || name === 'screen')
        m = toy(gl, color, { emissive: color, emissiveIntensity: name === 'screen' ? 1.1 : 1.6, roughness: 0.35 })
      else
        m = toy(gl, color, {
          roughness: rough,
          clearcoat: rough > 0.65 ? 0 : 0.35,
          metalness: src.metalness ?? 0,
        })
      if (src.normalMap) {
        m.normalMap = src.normalMap
        m.normalScale = src.normalScale.clone()
      }
      if (src.aoMap) {
        m.aoMap = src.aoMap
        // cloth folds read better a touch lighter than the bake
        m.aoMapIntensity = name.startsWith('cloth_') ? 0.75 : 1
      }
      m.name = name
      mat = m
      made.set(name, mat)
    }
    mesh.material = mat
  })
  return made
}
