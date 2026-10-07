import type { Ref } from 'react'
import type * as THREE from 'three'

/**
 * The contract between the bot's body and his behaviour.
 *
 * `MascotRig` animates these handles and nothing else, so the body can be
 * swapped without touching states, expressions, animation or positioning.
 *
 * To replace the procedural body with a GLB later, write a `MascotBodyGLB`
 * that takes the same props as `MascotBody`, loads the file with `useGLTF`,
 * and exposes these handles from nodes named:
 *
 *   Squash      whole character, origin at the soles (squash-and-stretch pivot)
 *   Head        origin at the neck — turns to look, nods, tilts
 *   Torso       origin at the chest — breathes
 *   ArmL, ArmR  origin at the shoulder, arm hanging down -Y — rotate on Z to raise
 *   Legs        origin at the hips — rotate on X to sit
 *   Face        flat mesh on the visor — receives the canvas face texture
 *   AntennaTip  mesh with an emissive material — takes the scene colour
 *   Emblem      chest mark with an emissive material — the heartbeat
 *
 * Model him ~2.86 units tall with the waist at the origin and the soles at
 * y = -1.57 (see BOT in states.ts), facing +Z.
 */
export interface MascotParts {
  squash: THREE.Group
  head: THREE.Group
  torso: THREE.Group
  armL: THREE.Group
  armR: THREE.Group
  legs: THREE.Group
  face: THREE.Mesh
  antennaTip: THREE.Mesh
  emblem: THREE.Mesh
}

export interface MascotBodyProps {
  /** the canvas face texture, drawn by face.ts */
  faceMap: THREE.Texture
  ref: Ref<MascotParts>
}
