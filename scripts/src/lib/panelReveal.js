/**
 * panelReveal.js — scroll-linked show/hide for the detail panels.
 * ------------------------------------------------------------------
 * Normal mode: a GSAP timeline scrubbed across the section's full
 * scroll range (0 = section top touches viewport bottom, 1 = section
 * bottom leaves viewport top). Position constants below are fractions
 * of that range, so panels fade/slide IN as their section arrives,
 * hold while the camera dwells, and fade OUT as it leaves — only one
 * panel is ever meaningfully visible.
 *
 * Reduced motion: no scrubbing at all. An IntersectionObserver
 * toggles a class and CSS does a plain opacity fade (see index.css).
 * ------------------------------------------------------------------
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Reduced-motion fallback: class toggle + CSS transition. */
function observeReveal(el) {
  const io = new IntersectionObserver(
    ([entry]) => el.classList.toggle('is-shown', entry.isIntersecting),
    { threshold: 0.3 }
  )
  io.observe(el)
  return () => io.disconnect()
}

/**
 * @param section  trigger element (the tall scroll section)
 * @param panel    the card to animate
 * @param toast    optional notification chip inside the panel — pops in
 *                 a beat after the card (the "you've been notified" moment)
 * @param inAt     fraction of section progress where fade-in starts
 * @param outAt    fraction where fade-out starts (skipped if fadeOut=false)
 */
export function attachPanelReveal({
  section,
  panel,
  toast = null,
  reducedMotion = false,
  fadeOut = true,
  inAt = 0.16,
  outAt = 0.64,
}) {
  if (!section || !panel) return () => {}
  if (reducedMotion) return observeReveal(panel) // toast just shows with the card

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true, // ← scroll-LINKED: reverse scroll reverses the animation
      },
    })
    tl.fromTo(
      panel,
      { autoAlpha: 0, y: 64 },
      { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power1.out' },
      inAt
    )
    if (toast) {
      tl.fromTo(
        toast,
        { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.09, ease: 'power1.out' },
        inAt + 0.15
      )
    }
    if (fadeOut) tl.to(panel, { autoAlpha: 0, y: -48, duration: 0.18, ease: 'power1.in' }, outAt)
    tl.set({}, {}, 1) // pad timeline to length 1 → positions = progress fractions
  }, section)

  return () => ctx.revert()
}
