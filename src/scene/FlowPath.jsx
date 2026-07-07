/**
 * FlowPath — the colored line system that ties the story together.
 * ------------------------------------------------------------------
 * Fully data-driven from PATH in content/nodes.js. Three ideas:
 *
 * 1. GHOST vs DRAWN. Every segment exists twice: a faint "ghost" tube
 *    (always visible, so the hero overview reads as a journey) and a
 *    solid stage-colored tube that draws itself in on scroll.
 *
 * 2. DRAW-ON VIA drawRange. TubeGeometry indices are ordered along the
 *    tube's length, so animating geometry.drawRange 0 → full sweeps
 *    the tube on. Quantized to whole quads (6 indices) to avoid torn
 *    triangles. Each segment has its own [from, to] window in stop
 *    coordinates — see nodes.js for the choreography (the 3-way
 *    payment fork strands draw staggered, then merge at the invoice;
 *    the indigo control-room droplines land last).
 *
 * 3. SEAMS ARE HIDDEN by the stage-colored anchor dots at each node.
 * ------------------------------------------------------------------
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PATH, SCENE } from '../content/nodes.js'
import { scrollState, clamp01, windowProgress } from '../lib/scrollState.js'

function makeTubeGeometry(points, radius, segments = 90) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    'catmullrom',
    0.5
  )
  return new THREE.TubeGeometry(curve, segments, radius, 7, false)
}

/** One path segment = ghost tube + scroll-drawn colored tube. */
function AnimatedTube({ segment }) {
  const { points, radius = 0.035, color, ghostOpacity = 0.26, window: win } = segment
  const drawRef = useRef()

  const { ghostGeo, drawGeo, indexCount } = useMemo(() => {
    const ghostGeo = makeTubeGeometry(points, radius)
    const drawGeo = ghostGeo.clone()
    return { ghostGeo, drawGeo, indexCount: drawGeo.index.count }
  }, [points, radius])

  useFrame(() => {
    const f = clamp01(windowProgress(scrollState.stop, win[0], win[1]))
    const count = Math.floor((indexCount * f) / 6) * 6 // whole quads only
    drawGeo.setDrawRange(0, count)
    if (drawRef.current) drawRef.current.visible = count > 0
  })

  return (
    <group>
      <mesh geometry={ghostGeo}>
        <meshBasicMaterial color={SCENE.ghost} transparent opacity={ghostOpacity} />
      </mesh>
      <mesh ref={drawRef} geometry={drawGeo}>
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

/** Faceted, stage-colored anchor marker at a node's base. */
function AnchorDot({ position, color, size = 0.11 }) {
  return (
    <mesh position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export default function FlowPath() {
  return (
    <group>
      {PATH.segments.map((segment) => (
        <AnimatedTube key={segment.id} segment={segment} />
      ))}
      {PATH.anchors.map((a, i) => (
        <AnchorDot key={i} position={a.position} color={a.color} />
      ))}
    </group>
  )
}
