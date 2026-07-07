/**
 * CameraRig — flies the camera between per-stop poses, driven by scroll.
 * ------------------------------------------------------------------
 * Every frame we read the continuous stop coordinate (see
 * scrollState.js) and blend between the pose of the current stop and
 * the next one:
 *
 *   stop 2.00 …… rest at invoice        (dwell plateau)
 *   stop 2.30 …… still resting          (dwell() eases 0 → 0)
 *   stop 2.50 …… gliding to delivery    (dwell() ≈ 0.5)
 *   stop 2.70+ … arriving at delivery   (dwell() eases → 1)
 *
 * Position and look-target are then critically damped (frame-rate
 * independent) so the ride feels silky while staying glued to scroll.
 * With reduced motion we snap straight to the nearest stop's pose.
 * ------------------------------------------------------------------
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildPoses } from '../content/nodes.js'
import { scrollState, dwell } from '../lib/scrollState.js'

const DAMP = 9 // higher = tighter link to scroll, lower = floatier

export default function CameraRig({ isMobile, reducedMotion }) {
  const poses = useMemo(() => {
    const raw = buildPoses(isMobile)
    return raw.map((p) => ({ pos: new THREE.Vector3(...p.pos), look: new THREE.Vector3(...p.look) }))
  }, [isMobile])

  // Damped current values + scratch vectors (allocated once).
  const cur = useRef({
    pos: poses[0].pos.clone(),
    look: poses[0].look.clone(),
    targetPos: new THREE.Vector3(),
    targetLook: new THREE.Vector3(),
  })

  useFrame(({ camera }, dt) => {
    const s = Math.min(Math.max(scrollState.stop, 0), poses.length - 1)
    const i = Math.min(Math.floor(s), poses.length - 2)
    const t = reducedMotion ? Math.round(s) - i : dwell(s - i) // snap vs. glide
    const c = cur.current

    c.targetPos.lerpVectors(poses[i].pos, poses[i + 1].pos, t)
    c.targetLook.lerpVectors(poses[i].look, poses[i + 1].look, t)

    if (reducedMotion) {
      c.pos.copy(c.targetPos)
      c.look.copy(c.targetLook)
    } else {
      // Frame-rate-independent critical damping.
      const k = 1 - Math.exp(-DAMP * dt)
      c.pos.lerp(c.targetPos, k)
      c.look.lerp(c.targetLook, k)
    }

    camera.position.copy(c.pos)
    camera.lookAt(c.look)
  })

  return null
}
