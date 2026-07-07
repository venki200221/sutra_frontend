/**
 * Hero — stop 0. The camera holds an elevated overview of the whole
 * 3D flow (the 10-second "aha" shot) while the value prop sits on a
 * glassmorphism pane — the scene, color auras and dot grid blur
 * through it. A color-coded pipeline legend (≥sm screens) teaches the
 * stage colors before the ride begins. The copy fades upward as you
 * scroll into Stage 01.
 *
 * Responsive: svh-based section height (mobile URL-bar safe), type
 * scales down at each breakpoint, buttons stack full-width on phones,
 * the legend collapses on very small screens.
 */
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SITE } from '../config/site.js'
import { NODES } from '../content/nodes.js'
import { scrollToTarget } from '../lib/smoothScroll.js'

gsap.registerPlugin(ScrollTrigger)

// Display labels for the pipeline legend (presentation-only).
const SHORT = {
  inventory: 'Inventory',
  quote: 'Quote',
  order: 'Order',
  payment: 'Payment',
  invoice: 'Invoice',
  delivery: 'Delivery',
  resource: 'Team · parallel',
  console: 'Backend control',
}

export default function Hero({ reducedMotion, onOpenDemo }) {
  const sectionRef = useRef(null)
  const innerRef = useRef(null)

  // Scroll-linked exit: hero copy lifts + fades as the ride begins.
  // (The hero is the first section, so its trigger progress starts at
  // 0.5 and reaches 1 as it leaves — hence the 0.55 position.)
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
        .to(innerRef.current, { autoAlpha: 0, y: -64, duration: 0.32, ease: 'power1.in' }, 0.55)
        .set({}, {}, 1)
    }, sectionRef)
    return () => ctx.revert()
  }, [reducedMotion])

  const mainStages = NODES.filter((n) => n.stop <= 6)
  const extraStages = NODES.filter((n) => n.stop > 6)

  return (
    <section ref={sectionRef} data-stop="0" className="h-viewport relative" aria-label="Introduction">
      <div ref={innerRef} className="absolute inset-0 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-5 md:px-10">
          {/* Glass pane: the 3D overview blurs through it. */}
          <div className="glass-card max-w-[46rem] p-5 sm:p-7 md:p-10">
            <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700 sm:px-3.5 sm:text-[11px] sm:tracking-[0.16em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#14B8A6]" aria-hidden="true" />
              {SITE.audience}
            </span>

            <h1 className="mt-5 text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.02em] text-ink sm:mt-6 sm:text-[2.45rem] sm:leading-[1.05] sm:tracking-[-0.03em] md:text-[3.6rem]">
              From shelf to settlement — <span className="text-gradient">and everything in between.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-body sm:mt-6 sm:text-[16px]">
              {SITE.sub}
            </p>

            {/* color-coded pipeline legend — the "aha in 10 seconds" strip.
                Hidden on very small screens: the stages introduce
                themselves (with these colors) as you scroll anyway. */}
            <div className="mt-6 hidden max-w-2xl flex-wrap items-center gap-y-2 sm:flex">
              {mainStages.map((n, i) => (
                <span key={n.id} className="flex items-center">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[12px] font-medium text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: n.color }} aria-hidden="true" />
                    {SHORT[n.id]}
                  </span>
                  {i < mainStages.length - 1 && <span className="px-1 text-[12px] text-body/50" aria-hidden="true">→</span>}
                </span>
              ))}
              <span className="px-1.5 text-[12px] text-body/50" aria-hidden="true">+</span>
              {extraStages.map((n) => (
                <span key={n.id} className="mr-1.5 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[12px] font-medium text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ background: n.color }} aria-hidden="true" />
                  {SHORT[n.id]}
                </span>
              ))}
            </div>

            {/* Buttons: full-width stack on phones, row from sm up. */}
            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <button type="button" onClick={onOpenDemo} className="btn-primary w-full sm:w-auto">
                Book a demo
              </button>
              <button
                type="button"
                className="btn-ghost w-full sm:w-auto"
                onClick={() => scrollToTarget('#node-inventory')}
              >
                See the flow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue (pure CSS; freezes under reduced motion). */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 sm:bottom-8">
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-body/70">Scroll</span>
        <div className="scroll-cue-track">
          <div className="scroll-cue-dot" />
        </div>
      </div>
    </section>
  )
}
