import { useImperativeHandle, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { BOT } from './states'
import type { MascotBodyProps, MascotParts } from './parts'

const ORANGE = '#ff6a17'
const CREAM = '#f3eee4'
const COAL = '#17171b'
const VISOR = '#030304'

/** studio reflections for the clearcoat, baked once per renderer — no network */
const envCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>()
function studioEnv(gl: THREE.WebGLRenderer) {
  let tex = envCache.get(gl)
  if (!tex) {
    const pmrem = new THREE.PMREMGenerator(gl)
    tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    envCache.set(gl, tex)
  }
  return tex
}

function pillShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/**
 * The procedural body: a two-heads-tall vinyl-toy bot built from primitives.
 * Big soft-cornered head, glossy visor, over-ear headphones, a slash for an
 * antenna, stubby limbs, chunky shoes. See parts.ts for the handles it exposes.
 */
export default function MascotBody({ faceMap, ref }: MascotBodyProps) {
  const gl = useThree((s) => s.gl)

  const squash = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const torso = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const legs = useRef<THREE.Group>(null!)
  const face = useRef<THREE.Mesh>(null!)
  const antennaTip = useRef<THREE.Mesh>(null!)
  const emblem = useRef<THREE.Mesh>(null!)

  useImperativeHandle(
    ref,
    (): MascotParts => ({
      squash: squash.current,
      head: head.current,
      torso: torso.current,
      armL: armL.current,
      armR: armR.current,
      legs: legs.current,
      face: face.current,
      antennaTip: antennaTip.current,
      emblem: emblem.current,
    }),
    [],
  )

  const mat = useMemo(() => {
    const envMap = studioEnv(gl)
    const toy = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.5,
        clearcoat: 0.7,
        clearcoatRoughness: 0.32,
        envMap,
        envMapIntensity: 0.5,
        ...extra,
      })
    return {
      shell: toy(ORANGE),
      cream: toy(CREAM, { roughness: 0.6, clearcoat: 0.45 }),
      coal: toy(COAL, { roughness: 0.55, clearcoat: 0.35 }),
      pad: toy(COAL, { roughness: 0.95, clearcoat: 0 }),
      visor: toy(VISOR, { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.32 }),
      tip: toy(ORANGE, { emissive: ORANGE, emissiveIntensity: 1.6, roughness: 0.3 }),
      emblem: toy(CREAM, { emissive: '#000000', emissiveIntensity: 0, roughness: 0.5, clearcoat: 0.6 }),
    }
  }, [gl])

  const visorGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(pillShape(1.18, 0.74, 0.31), {
      depth: 0.05,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 5,
      curveSegments: 20,
    })
    return g
  }, [])

  return (
    <group ref={squash} position-y={-BOT.foot}>
      <group position-y={BOT.foot}>
        {/* ---------- head (pivot at the neck) ---------- */}
        <group ref={head} position={[0, -0.14, 0]}>
          <RoundedBox args={[1.5, 1.2, 1.2]} radius={0.46} smoothness={8} position={[0, 0.56, 0]} material={mat.shell} />
          <mesh geometry={visorGeo} material={mat.visor} position={[0, 0.55, 0.565]} />
          <mesh ref={face} position={[0, 0.55, 0.662]}>
            <planeGeometry args={[1.08, 0.6075]} />
            <meshBasicMaterial map={faceMap} transparent toneMapped={false} depthWrite={false} />
          </mesh>

          {/* headphones: band pushed back so it clears the top of the head */}
          <mesh position={[0, 0.52, 0]} rotation-x={-0.3} material={mat.coal}>
            <torusGeometry args={[0.845, 0.052, 14, 56, Math.PI]} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.78, 0.52, 0]}>
              <mesh rotation-z={Math.PI / 2} material={mat.pad}>
                <cylinderGeometry args={[0.3, 0.3, 0.13, 36]} />
              </mesh>
              <mesh position-x={side * 0.07} scale={[0.5, 1, 1]} material={mat.cream}>
                <sphereGeometry args={[0.34, 36, 28]} />
              </mesh>
              <mesh position-x={side * 0.225} rotation-y={Math.PI / 2} material={mat.shell}>
                <torusGeometry args={[0.15, 0.022, 10, 36]} />
              </mesh>
            </group>
          ))}

          {/* the slash: his antenna is the "/" from the AT/ mark */}
          <group position={[0.9, 0.84, 0]} rotation-z={-0.42}>
            <RoundedBox args={[0.09, 0.46, 0.09]} radius={0.04} smoothness={4} position={[0, 0.23, 0]} material={mat.shell} />
            <mesh ref={antennaTip} position={[0, 0.52, 0]} material={mat.tip}>
              <sphereGeometry args={[0.085, 24, 20]} />
            </mesh>
          </group>
        </group>

        {/* ---------- torso ---------- */}
        <group ref={torso} position={[0, -0.68, 0]}>
          <mesh scale={[1.08, 1, 0.92]} material={mat.shell}>
            <capsuleGeometry args={[0.4, 0.3, 10, 28]} />
          </mesh>
          {/* sits proud of the belly so its whole rim shows, not a bean-shaped slice of it */}
          <mesh ref={emblem} position={[0, 0.06, 0.372]} scale={[1, 1, 0.3]} material={mat.emblem}>
            <sphereGeometry args={[0.135, 28, 20]} />
          </mesh>
          <RoundedBox
            args={[0.032, 0.13, 0.02]}
            radius={0.009}
            smoothness={2}
            position={[0, 0.06, 0.414]}
            rotation-z={-0.42}
            material={mat.coal}
          />
        </group>

        {/* ---------- arms (pivot at the shoulder, hanging -Y) ---------- */}
        <group ref={armL} position={[-0.45, -0.36, 0]}>
          <mesh position={[0, -0.2, 0]} material={mat.shell}>
            <capsuleGeometry args={[0.105, 0.26, 8, 18]} />
          </mesh>
          <mesh position={[0, -0.47, 0]} material={mat.cream}>
            <sphereGeometry args={[0.16, 24, 20]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.45, -0.36, 0]}>
          <mesh position={[0, -0.2, 0]} material={mat.shell}>
            <capsuleGeometry args={[0.105, 0.26, 8, 18]} />
          </mesh>
          <mesh position={[0, -0.47, 0]} material={mat.cream}>
            <sphereGeometry args={[0.16, 24, 20]} />
          </mesh>
        </group>

        {/* ---------- legs (pivot at the hips) ---------- */}
        <group ref={legs} position={[0, -1.1, 0]}>
          {[-1, 1].map((side) => (
            <group key={side} position-x={side * 0.21}>
              <mesh position={[0, -0.13, 0]} material={mat.shell}>
                <capsuleGeometry args={[0.13, 0.1, 8, 18]} />
              </mesh>
              <RoundedBox args={[0.33, 0.2, 0.48]} radius={0.095} smoothness={5} position={[0, -0.335, 0.07]} material={mat.cream} />
              <RoundedBox args={[0.35, 0.07, 0.5]} radius={0.032} smoothness={3} position={[0, -0.435, 0.07]} material={mat.coal} />
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
