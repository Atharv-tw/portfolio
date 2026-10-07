import { useEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { measureEnvironment, updateEnvironment } from '../lib/environment'

/** Drives the paper → void background from scroll. Renders nothing. */
export default function Environment() {
  useEffect(() => {
    measureEnvironment()

    // Lenis scrolls the real window, so the native event covers both modes
    window.addEventListener('scroll', updateEnvironment, { passive: true })
    ScrollTrigger.addEventListener('refresh', measureEnvironment)

    // sections settle after fonts, the preloader gate and lazy chunks land
    const ro = new ResizeObserver(measureEnvironment)
    ro.observe(document.body)

    return () => {
      window.removeEventListener('scroll', updateEnvironment)
      ScrollTrigger.removeEventListener('refresh', measureEnvironment)
      ro.disconnect()
    }
  }, [])

  return null
}
