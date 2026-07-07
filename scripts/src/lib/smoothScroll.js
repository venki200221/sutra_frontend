/**
 * smoothScroll.js — Lenis smooth scrolling + GSAP ScrollTrigger glue.
 * ------------------------------------------------------------------
 * Lenis eases the native scroll position; ScrollTrigger listens to it.
 * Standard integration: Lenis is driven by GSAP's ticker so both
 * systems share one rAF loop.
 *
 * With prefers-reduced-motion we never instantiate Lenis — native,
 * instant scrolling is the accessible behavior.
 * ------------------------------------------------------------------
 */
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis = null
let tickerFn = null

export function initSmoothScroll(reducedMotion) {
  if (reducedMotion || lenis) return lenis
  lenis = new Lenis({
    smoothWheel: true,
    lerp: 0.11, // lower = floatier; keep tight so 3D stays glued to scroll
  })
  lenis.on('scroll', ScrollTrigger.update)
  tickerFn = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(tickerFn)
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function destroySmoothScroll() {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  lenis?.destroy()
  lenis = null
  tickerFn = null
}

/** Smooth-scroll to a selector (falls back to native for reduced motion). */
export function scrollToTarget(selector) {
  const el = document.querySelector(selector)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  } else {
    el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }
}
