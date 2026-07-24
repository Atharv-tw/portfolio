import { Environment, Lightformer, PerspectiveCamera } from '@react-three/drei'
import Mascot from './Mascot/Mascot'

export default function MascotScene() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 0, 6]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} />
      <pointLight position={[-4, -2, 3]} intensity={9} color="#00e5ff" distance={14} />
      <pointLight position={[4, 3, 2]} intensity={7} color="#fff3e0" distance={12} />

      {/* procedural studio (rendered once) — gives the plastic real reflections
          and soft highlights without shipping any HDR file */}
      <Environment frames={1} resolution={256}>
        <Lightformer intensity={2.4} position={[0, 2.6, 3]} scale={[7, 3, 1]} color="#ffffff" />
        <Lightformer intensity={1.5} position={[-3.5, 1, 2]} scale={[3, 4, 1]} color="#8fdcff" />
        <Lightformer intensity={1.3} position={[3.5, -0.5, 2]} scale={[3, 4, 1]} color="#ffd9a8" />
        <Lightformer intensity={1.0} position={[0, -3, 1]} scale={[7, 2, 1]} color="#ffffff" />
      </Environment>

      <Mascot />
    </>
  )
}
