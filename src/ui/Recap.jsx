/**
 * Recap — stop 9. The camera pulls back to the full journey (every
 * segment now drawn) while a crisp color-coded 2D diagram shows the
 * whole system at once: the six-stage loop, the payment fork merging
 * into the invoice, the parallel people lane, and the backend
 * control room touching everything from above.
 *
 * Responsive: sticky layer uses svh; the diagram keeps a 640px
 * minimum width and scrolls horizontally inside the card on phones.
 */
import { useEffect, useRef } from 'react'
import { attachPanelReveal } from '../lib/panelReveal.js'

const label = { fill: '#1D1B26', fontSize: 12.5, fontWeight: 600, textAnchor: 'middle' }
const sub = { fill: '#6B6B76', fontSize: 9, textAnchor: 'middle' }

function StageBox({ x, y = 90, w = 88, title, note, color, dark, soft }) {
  return (
    <>
      <rect x={x} y={y} width={w} height="46" rx="10" fill={soft} stroke={color} strokeWidth="1.5" />
      <text x={x + w / 2} y={y + 20} {...label} fill={dark}>{title}</text>
      <text x={x + w / 2} y={y + 35} {...sub}>{note}</text>
    </>
  )
}

function FlowDiagram() {
  return (
    <svg
      viewBox="0 0 780 320"
      className="h-auto w-full min-w-[640px]"
      role="img"
      aria-label="Flow diagram: inventory and item selection, then quote and approval, then order, then payment which forks into paid in full, advance and credit, merging into the invoice with inventory update, then delivery. Resource management runs in parallel, and the backend control room can modify quotes, prices, items and stock at every point. Every stage sends notifications."
    >
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0.5 0.5 L7.5 4 L0.5 7.5 z" fill="#94A3B8" />
        </marker>
      </defs>

      {/* backend control room, floating above the flow */}
      <rect x="300" y="12" width="180" height="40" rx="10" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
      <text x="390" y="29" {...label} fill="#4338CA">Backend control room</text>
      <text x="390" y="43" {...sub}>price · items · stock · quotes</text>
      {/* dotted droplines: the backend touches the flow */}
      <path d="M330 52 L162 90" stroke="#6366F1" strokeWidth="1.2" strokeDasharray="3 5" fill="none" />
      <path d="M390 52 L370 90" stroke="#6366F1" strokeWidth="1.2" strokeDasharray="3 5" fill="none" />
      <path d="M450 52 L566 90" stroke="#6366F1" strokeWidth="1.2" strokeDasharray="3 5" fill="none" />

      {/* the six-stage loop */}
      <StageBox x="14" title="Inventory" note="select items" color="#14B8A6" dark="#0F766E" soft="#CCFBF1" />
      <StageBox x="118" title="Quote" note="customer approves" color="#F59E0B" dark="#B45309" soft="#FEF3C7" />
      <StageBox x="222" title="Order" note="auto-created" color="#8B5CF6" dark="#6D28D9" soft="#EDE9FE" />
      <StageBox x="326" title="Payment" note="full · advance · credit" color="#22C55E" dark="#15803D" soft="#DCFCE7" />
      <StageBox x="520" title="Invoice" note="status + stock update" color="#3B82F6" dark="#1D4ED8" soft="#DBEAFE" />
      <StageBox x="646" title="Delivery" note="tracked + confirmed" color="#F97316" dark="#C2410C" soft="#FFEDD5" />

      {/* main arrows */}
      <line x1="102" y1="113" x2="114" y2="113" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="206" y1="113" x2="218" y2="113" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="310" y1="113" x2="322" y2="113" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="608" y1="113" x2="642" y2="113" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arr)" />

      {/* the payment fork → merges into the invoice */}
      <path d="M414 106 C 450 82, 484 82, 520 106" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
      <path d="M414 113 C 450 113, 484 113, 520 113" stroke="#22C55E" strokeWidth="1.8" fill="none" />
      <path d="M414 122 C 450 148, 484 148, 520 122" stroke="#F43F5E" strokeWidth="1.8" fill="none" />
      <text x="467" y="78" {...sub} fill="#B45309">advance</text>
      <text x="467" y="108" {...sub} fill="#15803D">paid in full</text>
      <text x="467" y="158" {...sub} fill="#BE123C">credit</text>

      {/* parallel people lane */}
      <line x1="14" y1="272" x2="734" y2="272" stroke="#EC4899" strokeWidth="1.4" strokeDasharray="5 7" opacity="0.75" />
      <rect x="280" y="252" width="200" height="40" rx="10" fill="#FCE7F3" stroke="#EC4899" strokeWidth="1.5" />
      <text x="380" y="269" {...label} fill="#BE185D">Resource management</text>
      <text x="380" y="283" {...sub}>attendance · wages · total labor cost</text>
    </svg>
  )
}

const CHIPS = [
  { text: 'Every stage auto-notifies customer & team', color: '#6D28D9', soft: '#EDE9FE' },
  { text: 'Backend edits price, items & stock anytime', color: '#4338CA', soft: '#E0E7FF' },
  { text: 'Invoice states exactly how payment was made', color: '#1D4ED8', soft: '#DBEAFE' },
]

export default function Recap({ reducedMotion }) {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(
    () =>
      attachPanelReveal({
        section: sectionRef.current,
        panel: cardRef.current,
        reducedMotion,
        inAt: 0.2,
        outAt: 0.72,
      }),
    [reducedMotion]
  )

  return (
    <section ref={sectionRef} id="recap" data-stop="9" aria-labelledby="recap-title" className="relative h-[150vh]">
      <div className="h-viewport sticky top-0 flex items-center">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-5 md:px-8">
          <div ref={cardRef} className="reveal max-h-[86svh] overflow-y-auto rounded-3xl border border-line bg-white/90 p-5 shadow-card backdrop-blur-xl sm:p-7 md:max-h-none md:overflow-visible md:p-10">
            <span className="eyebrow text-indigo-700">The whole system, at once</span>
            <h2 id="recap-title" className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl md:text-4xl">
              One loop. Zero gaps.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-body sm:text-[15px]">
              Six stages, one fork that always lands in the invoice, a parallel people track — and
              your backend in control of all of it.
            </p>
            <div className="mt-6 overflow-x-auto pb-1 sm:mt-7">
              <FlowDiagram />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <span
                  key={c.text}
                  className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
                  style={{ background: c.soft, color: c.color }}
                >
                  {c.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
