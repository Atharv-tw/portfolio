import { useEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { featured, sections, type SceneId, type SectionId } from '../content/resume'
import { bindActivityListeners } from '../lib/scrollState'
import { useApp } from '../store'

/**
 * Watches sections to drive the nav highlight, and the featured project panels
 * to tell the bot which project is on stage.
 */
export default function SectionSpy() {
  useEffect(() => {
    bindActivityListeners()

    let section: SectionId = 'hero'
    let project: SceneId | null = null
    const publish = () => {
      const app = useApp.getState()
      if (app.section !== section) app.setSection(section)
      const scene = section === 'work' && project ? project : section
      if (app.scene !== scene) app.setScene(scene)
    }

    const range = { start: 'top 55%', end: 'bottom 55%' }

    const triggers = sections.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        ...range,
        onToggle: (self) => {
          if (!self.isActive) return
          section = id
          publish()
        },
      }),
    )

    const panels = featured.map((p) =>
      ScrollTrigger.create({
        trigger: `.project-panel[data-project="${p.id}"]`,
        ...range,
        onToggle: (self) => {
          if (self.isActive) project = p.id as SceneId
          else if (project === p.id) project = null
          publish()
        },
      }),
    )

    return () => {
      triggers.forEach((t) => t.kill())
      panels.forEach((t) => t.kill())
    }
  }, [])

  return null
}
