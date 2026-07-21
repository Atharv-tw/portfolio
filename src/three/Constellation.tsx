import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Billboard, PerspectiveCamera, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import { skillEdges, skillNodes } from '../content/resume'
import { gsap } from '../lib/gsap'
import { sfx } from '../audio/synth'

interface SimNode extends SimulationNodeDatum {
  id: string
  label: string
  weight: number
  group: string
}

const GROUP_COLORS: Record<string, string> = {
  lang: '#00e5ff',
  frontend: '#ff4d9d',
  backend: '#ffb114',
  data: '#2ee6a8',
  ai: '#b7a6ff',
  ops: '#93a0b4',
  project: '#f4f4f6',
}

const DIM = new THREE.Color('#263044')

/**
 * Force layout, normalised to a [-1,1] box so it can be fitted to whatever
 * size the panel happens to be (a fixed scale left most of the panel empty
 * and clipped nodes off the top and bottom).
 */
function runLayout() {
  const nodes: SimNode[] = skillNodes.map((n) => ({ ...n }))
  const links: Array<SimulationLinkDatum<SimNode>> = skillEdges.map(([source, target]) => ({ source, target }))
  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-150))
    .force(
      'link',
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
        .id((d) => d.id)
        .distance(54)
        .strength(0.5),
    )
    .force('center', forceCenter(0, 0))
    // generous collision radius — labels need room or they collide
    .force('collide', forceCollide<SimNode>().radius((d) => 30 + d.weight * 5))
    .stop()
  for (let i = 0; i < 400; i++) sim.tick()

  // fit by bounding box (not max-abs) so an off-centre cloud still fills evenly
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x ?? 0)
    maxX = Math.max(maxX, n.x ?? 0)
    minY = Math.min(minY, n.y ?? 0)
    maxY = Math.max(maxY, n.y ?? 0)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const ex = (maxX - minX) / 2 || 1
  const ey = (maxY - minY) / 2 || 1

  // unit-box positions; z gives the cloud real depth so it reads as 3D
  const unit = nodes.map(
    (n, i) => new THREE.Vector3(((n.x ?? 0) - cx) / ex, -((n.y ?? 0) - cy) / ey, Math.sin(i * 1.9) * 0.55),
  )

  const index = new Map(nodes.map((n, i) => [n.id, i]))
  const edges = skillEdges.map(([a, b]) => [index.get(a)!, index.get(b)!] as [number, number])
  return { nodes, unit, edges }
}

export default function Constellation() {
  const { nodes, unit, edges } = useMemo(runLayout, [])
  const viewport = useThree((s) => s.viewport)
  const group = useRef<THREE.Group>(null!)
  const meshes = useRef<Array<THREE.Mesh | null>>([])
  const [hovered, setHovered] = useState(-1)
  const dragRef = useRef<{ i: number } | null>(null)

  // fit the normalised layout to the panel, and size nodes/labels to match
  const { homes, rScale } = useMemo(() => {
    const hx = (viewport.width * 0.5) * 0.86
    const hy = (viewport.height * 0.5) * 0.82
    const hz = Math.min(hx, hy) * 0.45
    return {
      homes: unit.map((u) => new THREE.Vector3(u.x * hx, u.y * hy, u.z * hz)),
      rScale: THREE.MathUtils.clamp(Math.min(hx, hy) / 2.7, 0.7, 1.25),
    }
  }, [unit, viewport.width, viewport.height])

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3))
    return g
  }, [edges])

  // recolor edges when hover changes
  useEffect(() => {
    const colors = lineGeo.attributes.color as THREE.BufferAttribute
    edges.forEach(([a, b], k) => {
      const hot = hovered !== -1 && (a === hovered || b === hovered)
      const c = hot ? new THREE.Color(GROUP_COLORS[nodes[hovered].group]) : DIM
      colors.setXYZ(k * 2, c.r, c.g, c.b)
      colors.setXYZ(k * 2 + 1, c.r, c.g, c.b)
    })
    colors.needsUpdate = true
  }, [hovered, edges, lineGeo, nodes])

  // snap a dragged node home wherever the pointer is released
  useEffect(() => {
    const up = () => {
      const d = dragRef.current
      if (!d) return
      dragRef.current = null
      const mesh = meshes.current[d.i]
      if (mesh) {
        sfx.pop()
        gsap.to(mesh.position, {
          x: homes[d.i].x,
          y: homes[d.i].y,
          z: homes[d.i].z,
          duration: 1.1,
          ease: 'elastic.out(1, 0.32)',
        })
      }
    }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [homes])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    // gentle sway + pointer parallax — a full spin would turn the cloud edge-on
    if (!dragRef.current) {
      const swayY = Math.sin(t * 0.25) * 0.26 + state.pointer.x * 0.3
      const swayX = -state.pointer.y * 0.16
      group.current.rotation.y += (swayY - group.current.rotation.y) * Math.min(1, dt * 2.2)
      group.current.rotation.x += (swayX - group.current.rotation.x) * Math.min(1, dt * 2.2)
    }

    const pos = lineGeo.attributes.position as THREE.BufferAttribute
    edges.forEach(([a, b], k) => {
      const ma = meshes.current[a]
      const mb = meshes.current[b]
      if (!ma || !mb) return
      pos.setXYZ(k * 2, ma.position.x, ma.position.y, ma.position.z)
      pos.setXYZ(k * 2 + 1, mb.position.x, mb.position.y, mb.position.z)
    })
    pos.needsUpdate = true

    meshes.current.forEach((m, i) => {
      if (!m) return
      const mat = m.material as THREE.MeshStandardMaterial
      const target = i === hovered ? 2.1 : 0.8
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * Math.min(1, dt * 10)
    })
  })

  const onPlaneMove = (e: ThreeEvent<PointerEvent>) => {
    const d = dragRef.current
    if (!d) return
    const mesh = meshes.current[d.i]
    if (!mesh) return
    const local = group.current.worldToLocal(e.point.clone())
    mesh.position.set(local.x, local.y, homes[d.i].z)
  }

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} position={[0, 0, 8.6]} />
      <ambientLight intensity={1.2} />
      <pointLight position={[4, 4, 6]} intensity={40} />

      <group ref={group}>
        {/* drag surface */}
        <mesh position={[0, 0, -0.6]} onPointerMove={onPlaneMove}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {nodes.map((n, i) => {
          const color = GROUP_COLORS[n.group]
          const isProject = n.group === 'project'
          const r = (isProject ? 0.19 : 0.05 + n.weight * 0.015) * rScale
          const isHot = i === hovered
          return (
            <mesh
              key={n.id}
              ref={(m) => {
                meshes.current[i] = m
              }}
              position={homes[i]}
              onPointerOver={(e) => {
                e.stopPropagation()
                if (hovered !== i) {
                  setHovered(i)
                  sfx.hover()
                }
              }}
              onPointerOut={() => setHovered((h) => (h === i ? -1 : h))}
              onPointerDown={(e) => {
                e.stopPropagation()
                dragRef.current = { i }
                sfx.click()
              }}
            >
              <sphereGeometry args={[r, 24, 24]} />
              <meshStandardMaterial
                color={isProject ? '#12121c' : color}
                emissive={color}
                emissiveIntensity={0.8}
                roughness={0.35}
                metalness={0.2}
              />
              <Billboard position={[0, r + 0.09 * rScale, 0]}>
                <Text
                  fontSize={(isProject ? 0.185 : 0.115) * rScale}
                  color={isHot ? '#ffffff' : isProject ? '#f4f4f6' : '#93a2bb'}
                  outlineWidth={0.012 * rScale}
                  outlineColor="#07070b"
                  anchorX="center"
                  anchorY="bottom"
                >
                  {n.label}
                </Text>
              </Billboard>
            </mesh>
          )
        })}
      </group>
    </>
  )
}
