import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
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

const DIM = new THREE.Color('#232c3d')

function runLayout() {
  const nodes: SimNode[] = skillNodes.map((n) => ({ ...n }))
  const links: Array<SimulationLinkDatum<SimNode>> = skillEdges.map(([source, target]) => ({ source, target }))
  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-130))
    .force(
      'link',
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
        .id((d) => d.id)
        .distance(56)
        .strength(0.55),
    )
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<SimNode>().radius((d) => 13 + d.weight * 3.2))
    .stop()
  for (let i = 0; i < 340; i++) sim.tick()

  const SCALE = 27
  const homes = nodes.map(
    (n, i) => new THREE.Vector3((n.x ?? 0) / SCALE, -(n.y ?? 0) / SCALE, Math.sin(i * 2.7) * 0.35),
  )
  const index = new Map(nodes.map((n, i) => [n.id, i]))
  const edges = skillEdges.map(([a, b]) => [index.get(a)!, index.get(b)!] as [number, number])
  return { nodes, homes, edges }
}

export default function Constellation() {
  const { nodes, homes, edges } = useMemo(runLayout, [])
  const group = useRef<THREE.Group>(null!)
  const meshes = useRef<Array<THREE.Mesh | null>>([])
  const [hovered, setHovered] = useState(-1)
  const dragRef = useRef<{ i: number } | null>(null)

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

  // release drag anywhere
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

  useFrame((_, dt) => {
    if (!dragRef.current) group.current.rotation.y += dt * 0.055

    const pos = lineGeo.attributes.position as THREE.BufferAttribute
    edges.forEach(([a, b], k) => {
      const ma = meshes.current[a]
      const mb = meshes.current[b]
      if (!ma || !mb) return
      pos.setXYZ(k * 2, ma.position.x, ma.position.y, ma.position.z)
      pos.setXYZ(k * 2 + 1, mb.position.x, mb.position.y, mb.position.z)
    })
    pos.needsUpdate = true

    // hover glow
    meshes.current.forEach((m, i) => {
      if (!m) return
      const mat = m.material as THREE.MeshStandardMaterial
      const target = i === hovered ? 1.9 : 0.75
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
      <ambientLight intensity={1.1} />
      <pointLight position={[4, 4, 6]} intensity={40} />

      <group ref={group}>
        {/* drag surface */}
        <mesh position={[0, 0, -0.6]} onPointerMove={onPlaneMove}>
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial vertexColors transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>

        {nodes.map((n, i) => {
          const color = GROUP_COLORS[n.group]
          const r = n.group === 'project' ? 0.3 : 0.13 + n.weight * 0.035
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
                color={n.group === 'project' ? '#10101a' : color}
                emissive={color}
                emissiveIntensity={0.75}
                roughness={0.35}
                metalness={0.2}
              />
              {(n.group === 'project' || i === hovered) && (
                <Billboard position={[0, r + 0.28, 0]}>
                  <Text
                    fontSize={n.group === 'project' ? 0.24 : 0.2}
                    color={i === hovered ? '#ffffff' : '#c8d0e0'}
                    outlineWidth={0.012}
                    outlineColor="#07070b"
                    anchorX="center"
                    anchorY="bottom"
                  >
                    {n.label}
                  </Text>
                </Billboard>
              )}
            </mesh>
          )
        })}
      </group>
    </>
  )
}
