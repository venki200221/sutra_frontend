/**
 * Cta — stop 10. Closing ask on a glassmorphism pane: the drifting
 * 3D scene and color auras blur through the glass behind the text.
 * Fade-in only (it's the last stop).
 *
 * Responsive: min-h viewport (svh) so the section can grow on short
 * screens instead of clipping; type + padding scale per breakpoint;
 * buttons stack full-width on phones.
 */
import { useEffect, useRef } from 'react'
import { attachPanelReveal } from '../lib/panelReveal.js'
import { SITE } from '../config/site.js'

const PROOF = [
  { text: 'Live inventory → invoice in one flow', color: '#0F766E', soft: '#CCFBF1' },
  { text: 'Notifications at every stage', color: '#6D28D9', soft: '#EDE9FE' },
  { text: 'You stay in control of price & stock', color: '#4338CA', soft: '#E0E7FF' },
]

export default function Cta({ reducedMotion }) {
  const sectionRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(
    () =>
      attachPanelReveal({
        section: sectionRef.current,
        panel: innerRef.current,
        reducedMotion,
        fadeOut: false, // last section: its trigger only reaches 50% progress
        inAt: 0.18,
      }),
    [reducedMotion]
  )

  return (
    <section
      ref={sectionRef}
      id="cta"
      data-stop="10"
      aria-labelledby="cta-title"
      className="min-h-viewport relative flex items-center py-24"
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {/* Glass pane: same treatment as the hero. */}
        <div ref={innerRef} className="reveal glass-card px-5 py-9 text-center sm:px-8 sm:py-12 md:px-12 md:py-14">
          <span className="eyebrow text-indigo-700">Next step</span>
          <h2 id="cta-title" className="mt-4 text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.02em] text-ink sm:text-4xl sm:leading-[1.06] md:text-[3.3rem]">
            See {SITE.name} run <span className="text-gradient">your</span> shelf.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-relaxed text-body sm:text-[16px]">
            A 30-minute walkthrough with your catalog, your customers and your flow. No setup, no
            commitment.
          </p>
          <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
            {PROOF.map((c) => (
              <span key={c.text} className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold" style={{ background: c.soft, color: c.color }}>
                {c.text}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row">
            <a href={SITE.demoHref} className="btn-primary w-full sm:w-auto">
              Book a demo
            </a>
            <a href={`mailto:${SITE.email}`} className="btn-ghost w-full sm:w-auto">
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
      <footer className="absolute inset-x-0 bottom-4 px-4 text-center text-[11px] text-body/60 sm:bottom-6 sm:text-xs">
        © 2026 {SITE.name} · pitch prototype — branding and 3D models are placeholders
      </footer>
    </section>
  )
}
