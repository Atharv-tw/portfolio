import type { RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import { NeutralToneMapping } from 'three'

/**
 * Single WebGL context for the whole site. Every 3D region on the page is a
 * drei <View> whose contents render into this one fixed canvas.
 */
export default function SceneRoot({ eventSource }: { eventSource: RefObject<HTMLElement | null> }) {
  return (
    <Canvas
      className="scene-canvas"
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      dpr={[1, 1.75]}
      // neutral tone mapping keeps the bot's orange saturated; the filmic default greys it out
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: NeutralToneMapping }}
      frameloop="always"
    >
      <View.Port />
    </Canvas>
  )
}
