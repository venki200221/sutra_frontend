/**
 * NodeModel — one low-poly GLB in the scene.
 * ------------------------------------------------------------------
 * Behaviors (all scroll- or clock-driven, all cheap):
 *
 *  • IDLE: gentle float + sway so the scene feels alive when static.
 *    Disabled under prefers-reduced-motion.
 *  • FOCUS: when the scroll stop approaches this node's stop, the
 *    model eases up to ~1.15× scale (the "you are here" emphasis).
 *  • APPEAR (branch models only): scale in from small as the forked
 *    path reaches them during the settlement dwell.
 *  • BLOB SHADOW: a soft radial-gradient disc under the model that
 *    shrinks/fades as the model floats up — grounding without the
 *    cost of real shadow maps.
 * ------------------------------------------------------------------
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, clamp01, smoothstep, windowProgress } from '../lib/scrollState.js'

/** Soft round shadow texture, generated once (no asset needed). */
function makeBlobTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(58, 54, 68, 0.5)')
  grad.addColorStop(0.55, 'rgba(58, 54, 68, 0.16)')
  grad.addColorStop(1, 'rgba(58, 54, 68, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
let blobTexture = null
const getBlobTexture = () => (blobTexture ??= makeBlobTexture())

export default function NodeModel({
  url,
  position,
  stop = null, // which scroll stop focuses this model
  scale = 1,
  appearWindow = null, // [fromStop, toStop] → grow in with the forked path
  reducedMotion = false,
}) {
  const { scene } = useGLTF(url)
  const inner = useRef() // float/sway happens here
  const outer = useRef() // focus/appear scaling happens here
  const shadowMat = useRef()
  const shadow = useRef()

  // De-sync each model's float using its position as a phase seed.
  const phase = useMemo(() => (position[0] * 3.1 + position[2] * 1.7) % (Math.PI * 2), [position])
  const currentScale = useRef(0.001)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const s = scrollState.stop

    // --- idle float + sway -------------------------------------------------
    const dy = reducedMotion ? 0 : Math.sin(t * 0.85 + phase) * 0.07
    if (inner.current) {
      inner.current.position.y = dy
      inner.current.rotation.y = reducedMotion ? 0 : Math.sin(t * 0.24 + phase) * 0.16
    }

    // --- focus emphasis ----------------------------------------------------
    const focus = stop == null ? 0 : smoothstep(1 - clamp01(Math.abs(s - stop) / 0.8))
    let target = scale * (1 + 0.15 * focus)

    // --- appear (settlement branch endpoints) ------------------------------
    if (appearWindow) {
      const grow = windowProgress(s, appearWindow[0], appearWindow[1])
      target *= 0.18 + 0.82 * grow
    }

    if (outer.current) {
      const k = reducedMotion ? 1 : 1 - Math.exp(-8 * dt) // damp toward target
      currentScale.current += (target - currentScale.current) * k
      outer.current.scale.setScalar(currentScale.current)
    }

    // --- blob shadow follows the float -------------------------------------
    if (shadowMat.current && shadow.current) {
      shadowMat.current.opacity = clamp01((0.34 + 0.18 * focus) * (1 - dy * 2.4))
      const sh = 1 - dy * 0.9
      shadow.current.scale.set(sh, sh, sh)
    }
  })

  return (
    <group position={position}>
      <group ref={outer}>
        <group ref={inner}>
          <primitive object={scene} />
        </group>
      </group>
      {/* Shadow lives outside the scaled group → stable grounding. */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.82 - position[1], 0]}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial ref={shadowMat} map={getBlobTexture()} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
