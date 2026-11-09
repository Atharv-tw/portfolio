import { useState } from 'react'
import type { Project } from '../content/resume'
import Motif from './motifs/Motif'
import { useApp } from '../store'
import './ProjectTiles.css'

/**
 * What a tile shows: the project's first screenshot, else a still from its
 * demo video, else its live visual (the same one as in its modal).
 */
function cover(p: Project): { src: string; alt: string; youtube?: string } | null {
  const shot = p.media.shots?.[0]
  if (shot) return shot
  if (p.media.poster) return { src: p.media.poster, alt: `A still from the ${p.name} demo` }
  // YouTube's own still of the video: the HD one when the video has it, the small one when not
  if (p.media.youtube)
    return {
      src: `https://i.ytimg.com/vi/${p.media.youtube}/maxresdefault.jpg`,
      alt: `A still from the ${p.name} demo`,
      youtube: p.media.youtube,
    }
  return null
}

/**
 * Every project as a tile: a picture of it, its name and what it is. A tile
 * opens the project's modal.
 */
export default function ProjectTiles({ projects, large = false }: { projects: Project[]; large?: boolean }) {
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)
  if (projects.length === 0) return null

  return (
    <ul className={`ptiles${large ? ' ptiles--large' : ''}`}>
      {projects.map((p, i) => (
        <li key={p.id} style={{ ['--i' as string]: i }}>
          <button
            className="ptile"
            style={{ ['--project-accent' as string]: p.accent, ['--project-stage' as string]: p.stage }}
            onClick={() => setCaseOpenId(p.id)}
            data-cursor="open"
          >
            <TileCover project={p} />
            <span className="ptile-text">
              <span className="mono-label ptile-kind">
                {p.kind}
                {p.year && ` — ${p.year}`}
              </span>
              <span className="ptile-name">{p.name}</span>
              <span className="ptile-about">{p.summary}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function TileCover({ project }: { project: Project }) {
  const still = cover(project)
  const [src, setSrc] = useState(still?.src)
  const [boxed, setBoxed] = useState(false)
  const demo = Boolean(project.media.youtube || project.media.video)

  return (
    <span className="ptile-frame env-dark" data-motif={project.motif}>
      {still && src ? (
        <img
          className={`ptile-img${boxed ? ' is-boxed' : ''}`}
          src={src}
          alt={still.alt}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            // a video without an HD still gets YouTube's 120px placeholder: take the 4:3 one,
            // whose black bars the frame then crops away (.is-boxed)
            if (still.youtube && e.currentTarget.naturalWidth <= 120) {
              setSrc(`https://i.ytimg.com/vi/${still.youtube}/hqdefault.jpg`)
              setBoxed(true)
            }
          }}
        />
      ) : (
        <span className="ptile-motif" aria-hidden="true">
          <Motif project={project} />
        </span>
      )}
      {demo && (
        <span className="mono-label ptile-chip">
          <span aria-hidden="true">▶</span> Demo
        </span>
      )}
      <span className="mono-label ptile-open" aria-hidden="true">
        Open ↗
      </span>
    </span>
  )
}
