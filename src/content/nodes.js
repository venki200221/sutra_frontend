/**
 * nodes.js — single source of truth for the pitch flow.
 * ------------------------------------------------------------------
 * Everything about the flow stages lives here: panel copy, GLB asset
 * paths, 3D world positions, camera poses, flow-path geometry and the
 * per-stage color system. Edit copy here; swap models in /public/models.
 *
 * The scroll experience is measured in "stops":
 *   0 hero
 *   1 inventory   (teal)    — live stock, customer selects items
 *   2 quote       (amber)   — quotation + customer approval
 *   3 order       (violet)  — approved quote becomes the order
 *   4 payment     (green)   — full / advance / credit → 3-way fork
 *   5 invoice     (blue)    — the fork MERGES here; stock auto-updates
 *   6 delivery    (orange)  — fulfillment tracked + confirmed
 *   7 resource    (pink)    — parallel people track
 *   8 console     (indigo)  — backend control room, floats above it all
 *   9 recap · 10 CTA
 *
 * A continuous stop coordinate (e.g. 4.5 = halfway payment → invoice)
 * drives the camera, the path draw-on and model focus.
 * ------------------------------------------------------------------
 */

export const STOPS = 11 // hero + 8 stages + recap + cta

/** Scene-level colors (non-stage). */
export const SCENE = {
  ghost: '#E4E0EF', // undrawn path
  ink: '#3A3644',
}

/**
 * Payment-outcome tones — used by the 3 fork strands in 3D, the payment
 * outcome cards and the invoice status chips. `main` = graphics/large,
 * `dark` = AA-safe small text, `soft` = chip/card backgrounds.
 */
export const TONES = {
  green: { main: '#22C55E', dark: '#15803D', soft: '#DCFCE7' },
  amber: { main: '#F59E0B', dark: '#B45309', soft: '#FEF3C7' },
  rose: { main: '#F43F5E', dark: '#BE123C', soft: '#FFE4E6' },
}

const asset = (file) => `${import.meta.env.BASE_URL}models/${file}`

/**
 * The eight scroll-stop stages (stop 1..8).
 * color: vivid — 3D path/lights/decoration only
 * colorDark: darkened — AA-safe for small text on white
 * colorSoft: pale tint — chip & card backgrounds
 */
export const NODES = [
  {
    id: 'inventory',
    stop: 1,
    model: asset('inventory.glb'),
    position: [0, 0, 0],
    panelSide: 'right',
    color: '#14B8A6',
    colorDark: '#0F766E',
    colorSoft: '#CCFBF1',
    eyebrow: 'Stage 01 · Inventory & item selection',
    title: 'Start where your stock is',
    lead: 'Your live inventory becomes the storefront — the customer browses what is actually available and picks what they need.',
    bullets: [
      'Live stock list built on your catalog — any product, any custom fields (grade, batch, size…)',
      'Customer selects items and quantities in one view',
      'No stale price lists: availability is always current',
    ],
    toast: 'New selection → your sales team is notified',
  },
  {
    id: 'quote',
    stop: 2,
    model: asset('quote.glb'),
    position: [2.4, 0.05, -7],
    panelSide: 'left',
    color: '#F59E0B',
    colorDark: '#B45309',
    colorSoft: '#FEF3C7',
    eyebrow: 'Stage 02 · Quote & approval',
    title: 'A quote they can say yes to',
    lead: 'Selections roll into a quotation instantly — and your team can fine-tune it from the backend before it goes out.',
    bullets: [
      'Quotation auto-built from the selected items',
      'You can edit price, discounts and items before sending',
      'One-tap customer approval, recorded with a timestamp',
    ],
    toast: 'Quote sent → customer notified · approval → you are notified',
  },
  {
    id: 'order',
    stop: 3,
    model: asset('order.glb'),
    position: [-2.4, 0, -14],
    panelSide: 'right',
    color: '#8B5CF6',
    colorDark: '#6D28D9',
    colorSoft: '#EDE9FE',
    eyebrow: 'Stage 03 · Place order',
    title: 'Approval becomes an order — instantly',
    lead: 'The approved quote converts into a confirmed order. Nothing re-typed, so nothing can mismatch.',
    bullets: [
      'Order mirrors the approved quotation exactly',
      'Confirmed quantities are reserved against stock',
      'Full trail: who selected, who approved, and when',
    ],
    toast: 'Order confirmed → customer + warehouse notified',
  },
  {
    id: 'payment',
    stop: 4,
    model: asset('payment.glb'),
    position: [0, 0.05, -21],
    panelSide: 'right',
    wide: true, // pull back so the 3-way fork is visible
    color: '#22C55E',
    colorDark: '#15803D',
    colorSoft: '#DCFCE7',
    eyebrow: 'Stage 04 · Payment',
    title: 'Money first — every way it can arrive',
    lead: 'Record how the customer pays. Whichever way it goes, the flow adapts — and the invoice will say so.',
    outcomes: [
      { tone: 'green', title: 'Paid in full', text: 'Amount received and reconciled — the transaction is complete.' },
      { tone: 'amber', title: 'Advance paid', text: 'Part now, rest later — the pending balance is tracked with its due date.' },
      { tone: 'rose', title: 'Full credit', text: 'The whole amount moves to receivables: aging, due dates, partial payments.' },
    ],
    toast: 'Receipt → customer · balance & due-date alerts → both sides',
  },
  {
    id: 'invoice',
    stop: 5,
    model: asset('invoice.glb'),
    position: [-2.4, -0.05, -28],
    panelSide: 'left',
    color: '#3B82F6',
    colorDark: '#1D4ED8',
    colorSoft: '#DBEAFE',
    eyebrow: 'Stage 05 · Invoice & inventory update',
    title: 'The invoice that knows everything',
    lead: 'Generated the moment payment is recorded — with the payment status printed on it. And stock adjusts itself.',
    statusChips: [
      { tone: 'green', label: 'PAID IN FULL' },
      { tone: 'amber', label: 'ADVANCE · BALANCE DUE' },
      { tone: 'rose', label: 'ON CREDIT' },
    ],
    bullets: [
      'Line items, taxes and discounts from the approved quote',
      'Payment status shown clearly on the document',
      'Inventory decremented automatically — no manual sync',
    ],
    toast: 'Invoice → customer · stock change → backend',
  },
  {
    id: 'delivery',
    stop: 6,
    model: asset('delivery.glb'),
    position: [2.0, -0.05, -35],
    panelSide: 'right',
    color: '#F97316',
    colorDark: '#C2410C',
    colorSoft: '#FFEDD5',
    eyebrow: 'Stage 06 · Delivery',
    title: 'Fulfillment you can actually see',
    lead: 'Invoiced orders move to delivery with live status — and a confirmation recorded the moment goods land.',
    bullets: [
      'Every delivery status in one place, per order',
      'Delivery confirmation attached to the record',
      'No more calling the warehouse to ask what went out',
    ],
    toast: 'Dispatch + delivery confirmation → everyone who needs it',
  },
  {
    id: 'resource',
    stop: 7,
    model: asset('resource.glb'),
    position: [7.2, 0, -24],
    panelSide: 'left',
    color: '#EC4899',
    colorDark: '#BE185D',
    colorSoft: '#FCE7F3',
    eyebrow: 'Parallel track · Resource management',
    title: 'Your team, on the same ledger',
    lead: 'While orders flow, Sutra tracks the people moving them — from daily attendance to total labor cost.',
    bullets: [
      'Attendance and headcount, day by day',
      'Salaries and wages without spreadsheet math',
      'One always-current number for total labor cost',
    ],
    toast: 'Attendance anomalies → managers, automatically',
  },
  {
    id: 'console',
    stop: 8,
    model: asset('console.glb'),
    position: [2.8, 4.2, -17.5],
    panelSide: 'right',
    color: '#6366F1',
    colorDark: '#4338CA',
    colorSoft: '#E0E7FF',
    eyebrow: 'Always on · Backend control room',
    title: 'Everything they see, you control',
    lead: 'The backend sits above the whole flow — change it in real time, and the change is live everywhere.',
    bullets: [
      'Edit quotes, prices and discounts before approval',
      'Add items, custom fields and stock corrections anytime',
      'Role-based access with a full audit trail',
    ],
    toast: 'Every backend change is logged → owners notified',
    // The console floats above the scene; its camera pose is custom.
    poseOverride: {
      pos: [5.4, 6.6, -10.4],
      look: [1.9, 3.8, -18.2],
      mobilePos: [4.6, 7.6, -8.0],
      mobileLook: [2.6, 4.1, -17.8],
    },
  },
]

/* ------------------------------------------------------------------
   Flow path geometry — per-segment, per-color, each with its own
   draw-on window (in stop coordinates). Seams between segments are
   hidden by the stage-colored anchor dots.
   Lines sit slightly below the models so tubes never pierce them.
------------------------------------------------------------------- */
const Y = -0.85

export const PATH = {
  segments: [
    // main track: each segment wears the color of the stage it leaves
    { id: 'inv-quote', points: [[0, Y, 1.6], [0, Y, 0], [2.4, Y + 0.08, -7]], color: '#14B8A6', radius: 0.035, window: [0.55, 2] },
    { id: 'quote-order', points: [[2.4, Y + 0.08, -7], [-2.4, Y, -14]], color: '#F59E0B', radius: 0.035, window: [2, 3] },
    { id: 'order-payment', points: [[-2.4, Y, -14], [0, Y + 0.05, -21]], color: '#8B5CF6', radius: 0.035, window: [3, 4] },

    // THE FORK: three payment outcomes leave the coin… (staggered draw)
    { id: 'strand-full', points: [[0, Y + 0.05, -21], [-1.0, Y + 0.13, -24.5], [-2.4, Y, -28]], color: '#22C55E', radius: 0.03, window: [4.25, 5.0] },
    { id: 'strand-advance', points: [[0, Y + 0.05, -21], [1.7, Y + 0.17, -24.6], [-2.4, Y + 0.08, -28]], color: '#F59E0B', radius: 0.03, window: [4.32, 5.05] },
    { id: 'strand-credit', points: [[0, Y + 0.05, -21], [-3.8, Y + 0.1, -24.3], [-2.4, Y - 0.08, -28]], color: '#F43F5E', radius: 0.03, window: [4.39, 5.1] },
    // …and MERGE into the invoice, which records the outcome.

    { id: 'invoice-delivery', points: [[-2.4, Y, -28], [2.0, Y, -35]], color: '#3B82F6', radius: 0.035, window: [5.5, 6] },

    // parallel people lane
    { id: 'resource-lane', points: [[7.2, Y, -6], [7.2, Y, -24], [7.2, Y, -31]], color: '#EC4899', radius: 0.026, ghostOpacity: 0.18, window: [6.35, 7.0] },

    // control-room droplines: the backend "touches" the flow
    { id: 'drop-quote', points: [[2.8, 3.7, -17.5], [2.4, Y + 0.1, -7]], color: '#6366F1', radius: 0.016, ghostOpacity: 0.1, window: [7.6, 8.2] },
    { id: 'drop-payment', points: [[2.8, 3.7, -17.5], [0, Y + 0.1, -21]], color: '#6366F1', radius: 0.016, ghostOpacity: 0.1, window: [7.7, 8.3] },
    { id: 'drop-resource', points: [[2.8, 3.7, -17.5], [7.2, Y + 0.1, -24]], color: '#6366F1', radius: 0.016, ghostOpacity: 0.1, window: [7.8, 8.4] },
  ],
  /** Stage-colored anchor markers (also hide segment seams). */
  anchors: [
    { position: [0, Y, 0], color: '#14B8A6' },
    { position: [2.4, Y + 0.08, -7], color: '#F59E0B' },
    { position: [-2.4, Y, -14], color: '#8B5CF6' },
    { position: [0, Y + 0.05, -21], color: '#22C55E' },
    { position: [-2.4, Y, -28], color: '#3B82F6' },
    { position: [2.0, Y, -35], color: '#F97316' },
    { position: [7.2, Y, -24], color: '#EC4899' },
  ],
}

/* ------------------------------------------------------------------
   Camera poses — one per stop. Node poses offset the look target
   sideways so the model sits opposite its text panel; `wide` pulls
   back (used at Payment so the whole fork is on screen). On mobile
   the panel docks to the bottom → no lateral offset, camera further.
------------------------------------------------------------------- */
function nodePose(node) {
  if (node.poseOverride) return node.poseOverride
  const [x, y, z] = node.position
  const lateral = node.panelSide === 'right' ? 0.95 : -0.95
  if (node.wide) {
    return {
      pos: [x, y + 2.1, z + 7.2],
      look: [x + 1.1, y - 0.25, z - 4.5],
      mobilePos: [x, y + 2.6, z + 9.6],
      mobileLook: [x, y + 0.1, z - 4.5],
    }
  }
  return {
    pos: [x + lateral * 0.4, y + 0.8, z + 4.6],
    look: [x + lateral, y + 0.25, z],
    mobilePos: [x, y + 0.9, z + 6.1],
    mobileLook: [x, y + 0.45, z],
  }
}

export function buildPoses(isMobile) {
  const poses = [
    // 0 — hero: elevated overview down the whole line (the “aha” shot);
    // the console floats top-left of frame, the lane runs at right.
    {
      pos: [9.0, 6.4, 9.8],
      look: [0.6, -0.2, -15],
      mobilePos: [10.6, 8.0, 12.8],
      mobileLook: [1.0, 0, -15],
    },
    ...NODES.map(nodePose),
    // 9 — recap: pull back out, reverse angle, everything drawn
    {
      pos: [-10.2, 7.6, -37.5],
      look: [0.4, 0, -16],
      mobilePos: [-12, 9.2, -40.5],
      mobileLook: [0.8, 0.3, -16],
    },
    // 10 — CTA: keep drifting gently away
    {
      pos: [-11.6, 6.3, -41],
      look: [0.4, -0.3, -16],
      mobilePos: [-13.4, 7.8, -44],
      mobileLook: [0.8, 0, -16],
    },
  ]
  return poses.map((p) => ({
    pos: isMobile && p.mobilePos ? p.mobilePos : p.pos,
    look: isMobile && p.mobileLook ? p.mobileLook : p.look,
  }))
}
