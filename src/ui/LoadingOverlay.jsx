/**
 * LoadingOverlay — white cover with the wordmark and a gradient
 * progress bar while the GLB assets stream in. drei's useProgress
 * works outside the Canvas (shared store), so this stays plain DOM.
 */
import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { SITE } from '../config/site.js'
import { LogoMark } from './Header.jsx'

export default function LoadingOverlay() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const done = !active && progress >= 100

  useEffect(() => {
    if (done) {
      const id = setTimeout(() => setGone(true), 700) // let the fade finish
      return () => clearTimeout(id)
    }
  }, [done])

  if (gone) return null

  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-white transition-opacity duration-500 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink">
        <LogoMark size={22} />
        {SITE.name}
      </div>
      <div className="h-[3px] w-44 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundImage: 'linear-gradient(90deg, #14B8A6, #8B5CF6, #F59E0B)',
          }}
        />
      </div>
    </div>
  )
}
