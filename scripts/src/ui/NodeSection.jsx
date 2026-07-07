/**
 * NodeSection — one scroll "station" (stops 1–8).
 * ------------------------------------------------------------------
 * The section is 170vh tall: that extra height is the dwell time at
 * this stage. A sticky, full-viewport inner layer holds the detail
 * panel; attachPanelReveal() slides it in/out in sync with the camera
 * arriving/leaving, and pops the notification toast a beat later.
 *
 * Each stage carries its own color system via CSS variables set on
 * the section (--stage / --stage-dark / --stage-soft) — the panel top
 * bar, step chip, bullet markers and toast all read from them.
 *
 * Responsive: sticky layer uses svh (mobile URL-bar safe); panels
 * dock to the bottom on phones and scroll internally if a panel is
 * ever taller than ~3/4 of a short screen (e.g. Payment's 3 outcome
 * cards on an SE-sized phone).
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from 'react'
import { attachPanelReveal } from '../lib/panelReveal.js'
import { TONES } from '../content/nodes.js'

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M7 1.6c-2 0-3.4 1.5-3.4 3.4v2L2.4 9.2c-.2.4 0 .9.5.9h8.2c.5 0 .7-.5.5-.9L10.4 7v-2c0-1.9-1.4-3.4-3.4-3.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M5.8 12c.3.5.7.8 1.2.8s.9-.3 1.2-.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export default function NodeSection({ node, reducedMotion }) {
  const sectionRef = useRef(null)
  const panelRef = useRef(null)
  const toastRef = useRef(null)

  useEffect(
    () =>
      attachPanelReveal({
        section: sectionRef.current,
        panel: panelRef.current,
        toast: toastRef.current,
        reducedMotion,
      }),
    [reducedMotion]
  )

  const sideClass = node.panelSide === 'right' ? 'md:justify-end' : 'md:justify-start'
  const stageVars = {
    '--stage': node.color,
    '--stage-dark': node.colorDark,
    '--stage-soft': node.colorSoft,
  }

  return (
    <section
      ref={sectionRef}
      id={`node-${node.id}`}
      data-stop={node.stop}
      aria-labelledby={`${node.id}-title`}
      className="relative h-[170vh]"
      style={stageVars}
    >
      <div className="h-viewport sticky top-0 w-full">
        <div className={`mx-auto flex h-full w-full max-w-6xl items-end justify-center px-4 pb-8 sm:px-5 sm:pb-12 md:items-center md:px-10 md:pb-0 ${sideClass}`}>
          {/* max-h + internal scroll = safety net for short viewports */}
          <div ref={panelRef} className="panel-card reveal max-h-[78svh] overflow-y-auto md:max-h-none md:overflow-visible">
            {/* step chip + eyebrow */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                style={{ background: node.color }}
              >
                {String(node.stop).padStart(2, '0')}
              </span>
              <span className="eyebrow" style={{ color: node.colorDark }}>
                {node.eyebrow}
              </span>
            </div>

            <h2 id={`${node.id}-title`} className="mt-4 text-[1.45rem] font-semibold leading-[1.16] tracking-[-0.015em] text-ink sm:text-[1.7rem] sm:leading-[1.14] md:text-[1.9rem]">
              {node.title}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-body sm:text-[14.5px]">{node.lead}</p>

            {/* invoice: stamp-style payment-status chips */}
            {node.statusChips && (
              <div className="mt-4 flex flex-wrap gap-2">
                {node.statusChips.map((c) => {
                  const t = TONES[c.tone]
                  return (
                    <span
                      key={c.label}
                      className="rounded-md border-[1.5px] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.08em]"
                      style={{ borderColor: t.main, color: t.dark, background: t.soft }}
                    >
                      {c.label}
                    </span>
                  )
                })}
              </div>
            )}

            {node.bullets && (
              <ul className="mt-5 space-y-2.5">
                {node.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-[13.5px] leading-relaxed text-ink/80 sm:text-[14px]">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[2px]"
                      style={{ background: node.color }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* payment: the three outcomes, mirrored by the 3D fork */}
            {node.outcomes && (
              <div className="mt-5 grid gap-2.5">
                {node.outcomes.map((o) => {
                  const t = TONES[o.tone]
                  return (
                    <div key={o.title} className="rounded-xl p-3 sm:p-3.5" style={{ background: t.soft }}>
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.main }} />
                        <h3 className="text-[14px] font-semibold sm:text-[14.5px]" style={{ color: t.dark }}>
                          {o.title}
                        </h3>
                      </div>
                      <p className="mt-1 pl-[22px] text-[12.5px] leading-relaxed text-ink/70 sm:text-[13px]">{o.text}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* end-to-end notification chip — every stage has one */}
            <div ref={toastRef} className="stage-toast">
              <span className="ping" aria-hidden="true" />
              <BellIcon />
              <span>{node.toast}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
