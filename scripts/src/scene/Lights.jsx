/**
 * Lights — bright, even "studio on white" setup + an accent rim light
 * that travels to whichever stage is in focus AND takes on that
 * stage's color (teal at inventory, green at payment, indigo at the
 * control room…), giving the active model its signature glow.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { NODES } from '../content/nodes.js'
import { scrollState, clamp01, smoothstep } from '../lib/scrollState.js'

export default function Lights() {
  const rim = useRef()

  useFrame(() => {
    if (!rim.current) return
    const s = scrollState.stop
    // Nearest stage (stops 1..8) and how "focused" it is (0..1).
    const idx = Math.min(Math.max(Math.round(s), 1), NODES.length) - 1
    const node = NODES[idx]
    const focus = smoothstep(1 - clamp01(Math.abs(s - node.stop) / 0.8))
    const [x, y, z] = node.position
    // Behind-above the model (camera approaches from +z) → rim highlight.
    rim.current.position.set(x + 2.4, y + 3, z - 3.6)
    rim.current.intensity = 1.5 * focus
    rim.current.color.set(node.color)
  })

  return (
    <>
      {/* Soft ambient dome: white sky, faint cool bounce from "below". */}
      <hemisphereLight args={['#FFFFFF', '#ECEAF6', 0.95]} />
      {/* Key light — high and to the right, like a big softbox. */}
      <directionalLight position={[7, 10, 5]} intensity={1.55} color="#FFFFFF" />
      {/* Fill from the opposite side so facets never go muddy. */}
      <directionalLight position={[-6, 4, -3]} intensity={0.45} color="#F4F2FB" />
      {/* Stage-colored accent rim light, repositioned onto the active node. */}
      <pointLight ref={rim} color="#14B8A6" intensity={0} decay={0} distance={0} />
    </>
  )
}
