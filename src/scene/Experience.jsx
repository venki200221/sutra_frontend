/**
 * Experience — the persistent 3D scene behind the whole page.
 * ------------------------------------------------------------------
 * One fixed, full-viewport <Canvas>. The page content scrolls over
 * it; the CameraRig flies through the eight stage "stations" (the
 * backend console floats above the flow — stop 8 looks down on it).
 *
 * Performance notes:
 *  • GLBs are tiny placeholder assets, lazy-loaded via Suspense and
 *    preloaded (useGLTF.preload) as soon as this module is parsed.
 *  • `flat` disables tone mapping so the stage colors stay true on
 *    the white background.
 *  • DPR is clamped ([1,1.5] on mobile) and shadow maps are off —
 *    grounding comes from cheap blob shadows instead.
 * ------------------------------------------------------------------
 */
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload, useGLTF } from '@react-three/drei'
import CameraRig from './CameraRig.jsx'
import Lights from './Lights.jsx'
import FlowPath from './FlowPath.jsx'
import NodeModel from './NodeModel.jsx'
import { NODES, buildPoses } from '../content/nodes.js'

// Kick off downloads immediately (in parallel with the app booting).
for (const n of NODES) useGLTF.preload(n.model)

export default function Experience({ isMobile, reducedMotion }) {
  const initialPose = buildPoses(isMobile)[0]

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        flat
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ fov: 42, near: 0.1, far: 140, position: initialPose.pos }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <FlowPath />
          {NODES.map((n) => (
            <NodeModel
              key={n.id}
              url={n.model}
              position={n.position}
              stop={n.stop}
              reducedMotion={reducedMotion}
            />
          ))}
          <Preload all />
        </Suspense>
        <CameraRig isMobile={isMobile} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
