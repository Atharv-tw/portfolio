import { Component, Suspense, useImperativeHandle, useLayoutEffect, useMemo, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useApp } from '../../store'
import { outfitUrl, today, type Day } from '../../lib/week'
import MascotBody from './MascotBody'
import { botMaterials, reskin } from './materials'
import type { MascotBodyProps, MascotParts } from './parts'

const BOT_URL = '/models/bot.glb'
const PARTS = ['Head', 'Torso', 'ArmL', 'ArmR', 'Legs'] as const
type Part = (typeof PARTS)[number]

// both start downloading with the page, not when he first appears
useGLTF.preload(BOT_URL, false, true)
if (typeof window !== 'undefined') useGLTF.preload(outfitUrl(today()), false, true)

/**
 * The bot as built in Blender (scripts/blender/build_bot.py), wearing the
 * outfit of the day. Exposes the same handles as the procedural body, which
 * stands in if the file cannot load.
 */
export default function BotBody(props: MascotBodyProps) {
  return (
    <Fallback body={<MascotBody {...props} />}>
      <Suspense fallback={null}>
        <BotGLB {...props} />
      </Suspense>
    </Fallback>
  )
}

class Fallback extends Component<{ body: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.body : this.props.children
  }
}

function BotGLB({ faceMap, ref }: MascotBodyProps) {
  const { scene } = useGLTF(BOT_URL, false, true)
  const gl = useThree((s) => s.gl)
  const outfit = useApp((s) => s.outfit)

  const nodes = useMemo(() => {
    const mat = botMaterials(gl)
    reskin(scene, gl, mat)
    const get = <T extends THREE.Object3D>(name: string) => scene.getObjectByName(name) as T

    // the canvas face: unlit, over the glass. glTF counts v from the top, the
    // canvas from the bottom, so the plane's v is turned over once here.
    const face = get<THREE.Mesh>('Face')
    if (!face.userData.flipped) {
      const uv = face.geometry.attributes.uv as THREE.BufferAttribute
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i))
      uv.needsUpdate = true
      face.userData.flipped = true
    }
    face.material = new THREE.MeshBasicMaterial({ map: faceMap, transparent: true, toneMapped: false, depthWrite: false })
    face.renderOrder = 1

    const parts: Record<Part, THREE.Object3D> = {
      Head: get('Head'),
      Torso: get('Torso'),
      ArmL: get('ArmL'),
      ArmR: get('ArmR'),
      Legs: get('Legs'),
    }
    return {
      parts,
      handles: {
        squash: get<THREE.Group>('Squash'),
        head: parts.Head as THREE.Group,
        torso: parts.Torso as THREE.Group,
        armL: parts.ArmL as THREE.Group,
        armR: parts.ArmR as THREE.Group,
        legs: parts.Legs as THREE.Group,
        face,
        antennaTip: get<THREE.Mesh>('AntennaTip'),
        emblem: get<THREE.Mesh>('Emblem'),
      } satisfies MascotParts,
    }
  }, [scene, gl, faceMap])

  useImperativeHandle(ref, () => nodes.handles, [nodes])

  return (
    <>
      <primitive object={scene} />
      {/* a new outfit downloads while he keeps wearing the old one */}
      <Suspense fallback={null}>
        <Wardrobe day={outfit} root={scene} parts={nodes.parts} />
      </Suspense>
    </>
  )
}

/**
 * Dresses him: each piece of the day's outfit moves onto the body part it was
 * built round (a sleeve onto its arm, a hood onto the head), so it follows
 * that part's every move. An outfit can hide parts of him (`hides`).
 */
function Wardrobe({ day, root, parts }: { day: Day; root: THREE.Object3D; parts: Record<Part, THREE.Object3D> }) {
  const { scene } = useGLTF(outfitUrl(day), false, true)
  const gl = useThree((s) => s.gl)

  useLayoutEffect(() => {
    const outfit = scene.clone(true)
    reskin(outfit, gl)
    const worn: THREE.Object3D[] = []
    for (const part of PARTS) {
      const holder = outfit.getObjectByName(`${day}_${part}`)
      if (!holder) continue
      for (const piece of [...holder.children]) {
        parts[part].add(piece)
        worn.push(piece)
      }
    }
    // `hides` lists name prefixes: "Head_phones" is every piece of the headphones
    const hides = String(outfit.getObjectByName(`Outfit_${day}`)?.userData.hides ?? '')
      .split(',')
      .filter(Boolean)
    const hidden: THREE.Object3D[] = []
    root.traverse((o) => {
      if (hides.some((h) => o.name.startsWith(h)) && !hidden.includes(o.parent!)) hidden.push(o)
    })
    hidden.forEach((o) => (o.visible = false))
    return () => {
      worn.forEach((piece) => piece.removeFromParent())
      hidden.forEach((o) => (o.visible = true))
    }
  }, [scene, day, gl, root, parts])

  return null
}
