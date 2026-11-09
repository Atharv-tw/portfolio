import { useImperativeHandle, useMemo, type Ref } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { SceneId } from '../../content/resume'
import { reskin } from './materials'

const SETS_URL = '/models/sets.glb'
useGLTF.preload(SETS_URL, false, true)

export interface Frame {
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface SetsHandle {
  /** shows the set of this scene and hides the rest (null: none) */
  show: (scene: SceneId | null) => void
  /** the set's extent in the bot's own units, or null when the scene has none */
  frame: (scene: SceneId) => Frame | null
  /** per frame: things that float bob, and the scene colour reaches the set */
  tick: (t: number, tip: THREE.Color) => void
}

interface SetData {
  group: THREE.Object3D
  frame: Frame
  floats: { obj: THREE.Object3D; base: THREE.Vector3; phase: number }[]
}

/**
 * The little worlds he stands in, one per scene (scripts/blender/build_sets.py).
 * They live beside him rather than inside him, so they scale and come and go
 * with him but do not lean, sway or flip when he does.
 */
export default function Sets({ ref }: { ref: Ref<SetsHandle> }) {
  const { scene } = useGLTF(SETS_URL, false, true)
  const gl = useThree((s) => s.gl)

  const data = useMemo(() => {
    const made = reskin(scene, gl)
    const glow = ['accent', 'screen'].map((n) => made.get(n)).filter(Boolean) as THREE.MeshPhysicalMaterial[]
    scene.updateMatrixWorld(true)
    const sets = new Map<string, SetData>()
    for (const group of scene.children) {
      if (!group.name.startsWith('Set_')) continue
      const box = new THREE.Box3().setFromObject(group)
      const floats: SetData['floats'] = []
      group.traverse((o) => {
        if (o === group || !o.name.startsWith('float') || o.parent?.name.startsWith('float')) return
        // pieces of one thing (a card and its heading) share a name stem, so they bob together
        const stem = o.name.split('_').slice(0, 2).join('_')
        const phase = [...stem].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) / 97
        floats.push({ obj: o, base: o.position.clone(), phase })
      })
      group.visible = false
      sets.set(group.name.slice(4), { group, floats, frame: { x0: box.min.x, x1: box.max.x, y0: box.min.y, y1: box.max.y } })
    }
    return { sets, glow }
  }, [scene, gl])

  useImperativeHandle(
    ref,
    (): SetsHandle => {
      let shown: SetData | undefined
      return {
        show(id) {
          if (shown) shown.group.visible = false
          shown = id ? data.sets.get(id) : undefined
          if (shown) shown.group.visible = true
        },
        frame: (id) => data.sets.get(id)?.frame ?? null,
        tick(t, tip) {
          for (const m of data.glow) {
            m.color.copy(tip)
            m.emissive.copy(tip)
          }
          if (!shown) return
          for (const f of shown.floats) f.obj.position.y = f.base.y + Math.sin(t * 1.3 + f.phase) * 0.05
        },
      }
    },
    [data],
  )

  return <primitive object={scene} />
}
