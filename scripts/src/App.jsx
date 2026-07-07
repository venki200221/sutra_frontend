/**
 * App — page shell + scroll systems bootstrap.
 * ------------------------------------------------------------------
 * Layering (bottom → top):
 *   • fixed backdrop: white→tint gradient + color auras + dot grid (z:-10)
 *   • fixed 3D canvas                                            (z: 0)
 *   • scrolling content                                          (z: 10)
 *   • header                                                     (z: 30)
 *   • loading overlay                                            (z: 50)
 *
 * Scroll systems wired here:
 *   • scrollState  — maps scrollY → continuous "stop" for the 3D layer
 *   • Lenis        — smooth scrolling (skipped for reduced motion)
 *   • ScrollTrigger refresh after fonts/assets settle layout
 * ------------------------------------------------------------------
 */
import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './scene/Experience.jsx'
import Header from './ui/Header.jsx'
import Hero from './ui/Hero.jsx'
import NodeSection from './ui/NodeSection.jsx'
import Recap from './ui/Recap.jsx'
import Cta from './ui/Cta.jsx'
import LoadingOverlay from './ui/LoadingOverlay.jsx'
import { NODES } from './content/nodes.js'
import { attachScrollState, measureStops } from './lib/scrollState.js'
import { initSmoothScroll, destroySmoothScroll } from './lib/smoothScroll.js'
import { useReducedMotion, useIsMobile } from './hooks/useMediaQuery.js'

export default function App() {
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  useEffect(() => {
    const detach = attachScrollState()
    initSmoothScroll(reducedMotion)

    // Layout can shift once the webfont swaps in — re-sync everything.
    const refresh = () => {
      measureStops()
      ScrollTrigger.refresh()
    }
    document.fonts?.ready?.then(refresh)
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      detach()
      destroySmoothScroll()
    }
  }, [reducedMotion])

  return (
    <div id="top" className="relative">
      {/* Backdrop: light tint + soft stage-color auras + faint dot grid
          (the "backend ledger" texture). All fixed, all cheap CSS. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-white via-white to-tint">
        <div className="aura aura-teal -left-40 -top-48 h-[34rem] w-[34rem]" />
        <div className="aura aura-violet -right-48 top-1/3 h-[38rem] w-[38rem]" />
        <div className="aura aura-amber -bottom-40 left-1/4 h-[30rem] w-[30rem]" />
        <div className="bg-dotgrid absolute inset-0" />
      </div>

      <Experience isMobile={isMobile} reducedMotion={reducedMotion} />
      <Header />

      <main className="relative z-10">
        <Hero reducedMotion={reducedMotion} />
        {NODES.map((node) => (
          <NodeSection key={node.id} node={node} reducedMotion={reducedMotion} />
        ))}
        <Recap reducedMotion={reducedMotion} />
        <Cta reducedMotion={reducedMotion} />
      </main>

      <LoadingOverlay />
    </div>
  )
}
