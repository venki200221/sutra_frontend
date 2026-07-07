/**
 * scrollState.js — maps page scroll to a continuous "stop" coordinate.
 * ------------------------------------------------------------------
 * Each section in the page declares `data-stop="n"` (0 = hero …
 * 7 = CTA). We measure where each section's center sits in the
 * document, then convert the live scroll position into a float:
 *
 *     stop = 2.00  → invoice section centered in the viewport
 *     stop = 2.50  → halfway between invoice and delivery
 *
 * The 3D layer (camera rig, flow path, model focus) reads
 * `scrollState.stop` every frame — this is what makes the scene
 * scroll-LINKED rather than merely scroll-triggered.
 * ------------------------------------------------------------------
 */

export const scrollState = {
  stop: 0, // continuous stop coordinate, updated on every scroll
  maxStop: 7,
}

let anchors = [] // [{ stop, y }] — scrollY at which each section is centered

/** Measure section centers. Call on mount, resize and after fonts load. */
export function measureStops() {
  const sections = [...document.querySelectorAll('[data-stop]')].sort(
    (a, b) => Number(a.dataset.stop) - Number(b.dataset.stop)
  )
  if (!sections.length) return
  const viewportCenter = window.innerHeight / 2
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  anchors = sections.map((el) => {
    const rect = el.getBoundingClientRect()
    const centerY = rect.top + window.scrollY + rect.height / 2
    return {
      stop: Number(el.dataset.stop),
      y: Math.min(Math.max(centerY - viewportCenter, 0), maxScroll),
    }
  })
  scrollState.maxStop = anchors[anchors.length - 1].stop
  updateStop()
}

/** Piecewise-linear interpolation of scrollY between section anchors. */
export function updateStop() {
  if (!anchors.length) return
  const y = window.scrollY
  if (y <= anchors[0].y) {
    scrollState.stop = anchors[0].stop
    return
  }
  const last = anchors[anchors.length - 1]
  if (y >= last.y) {
    scrollState.stop = last.stop
    return
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (y >= a.y && y <= b.y) {
      const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y)
      scrollState.stop = a.stop + t * (b.stop - a.stop)
      return
    }
  }
}

/** Wire up listeners; returns a cleanup function. */
export function attachScrollState() {
  const onScroll = () => updateStop()
  const onResize = () => measureStops()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  measureStops()
  // Re-measure once the webfont has swapped in (layout heights shift).
  if (document.fonts?.ready) document.fonts.ready.then(measureStops)
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  }
}

/* ------------------------------------------------------------------
   Easing helpers shared by the 3D layer.
------------------------------------------------------------------- */
export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smoothstep = (v) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

/**
 * Dwell easing: within each stop→stop segment the camera rests for
 * the first/last 30% and glides through the middle 40%. This is what
 * makes each node feel like a "station" while staying scroll-linked.
 */
export function dwell(u) {
  return smoothstep((u - 0.3) / 0.4)
}

/** 0→1 progress of `stop` across a [from, to] window (eased). */
export function windowProgress(stop, from, to) {
  return smoothstep((stop - from) / (to - from))
}
