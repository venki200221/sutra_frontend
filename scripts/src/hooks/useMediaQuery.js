import { useEffect, useState } from 'react'

/** Reactive media-query hook (SSR-safe enough for a static SPA). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mq.addEventListener('change', onChange)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Accessibility: user asked for less motion → static camera, CSS fades. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** Below md we simplify: lower DPR, bottom panels, no lateral camera offsets. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
