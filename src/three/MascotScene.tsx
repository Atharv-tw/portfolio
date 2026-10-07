import { PerspectiveCamera } from '@react-three/drei'
import MascotRig from './Mascot/MascotRig'

/** Neutral studio rig: no coloured lights, so his orange stays his orange on paper and on void. */
export default function MascotScene() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 0, 6]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 6]} intensity={1.7} />
      <directionalLight position={[-4, 1, 3]} intensity={0.55} color="#fff1e0" />
      {/* rim from behind: keeps his outline readable against the dark end of the page */}
      <directionalLight position={[-2.5, 3, -5]} intensity={1.6} />
      <MascotRig />
    </>
  )
}
