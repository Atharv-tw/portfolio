import type { Project } from '../content/resume'
import { usePrefersReducedMotion } from '../lib/hooks'
import Motif from './motifs/Motif'

/** The screenshot that takes the big stage: the first one, when the project has no video. */
export function stageShot(project: Project) {
  const { youtube, video, shots } = project.media
  return youtube || video ? undefined : shots?.[0]
}

/** youtube-nocookie: no tracking cookie until the visitor presses play themselves */
function youtubeEmbed(id: string, autoplay: boolean) {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '1',
    // YouTube only loops a single video when it is also its own playlist
    loop: '1',
    playlist: id,
    playsinline: '1',
    rel: '0',
  })
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

/**
 * The big media stage in a project's modal.
 *
 * Plays the project's demo, silent and on a loop, when it has one. Without a
 * video the first screenshot stands here; with neither, the project's live
 * visual does, and says plainly that it is an illustration. In resume.ts:
 *   media: { youtube: '<video id>' }                    a YouTube video
 *   media: { video: '/videos/<id>.mp4', poster: '…' }   a file in public/videos/
 *   media: { shots: [{ src: '/shots/<id>/…', alt }] }   screenshots
 */
export default function ProjectMedia({ project }: { project: Project }) {
  const { youtube, video, poster } = project.media
  const reduced = usePrefersReducedMotion()
  const footage = Boolean(youtube || video)
  const still = footage ? undefined : stageShot(project)

  return (
    <figure className="case-media">
      <div
        className={`case-media-frame${footage ? ' has-footage' : ''}${still ? ' has-still' : ''}`}
        data-motif={project.motif}
      >
        {youtube ? (
          <iframe
            className="case-video"
            src={youtubeEmbed(youtube, !reduced)}
            title={`${project.name} demo`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : video ? (
          <video
            className="case-video"
            src={video}
            poster={poster}
            controls
            muted
            loop
            playsInline
            autoPlay={!reduced}
            preload="metadata"
            aria-label={`${project.name} demo`}
          />
        ) : still ? (
          <img className="case-still" src={still.src} alt={still.alt} decoding="async" />
        ) : (
          <Motif project={project} />
        )}
      </div>
      {/* under the frame, not over it: on a narrow screen it would sit on the visual's own labels */}
      {youtube ? (
        <figcaption className="case-media-note mono-label">
          Playing muted, on a loop —{' '}
          <a href={`https://youtu.be/${youtube}`} target="_blank" rel="noreferrer">
            watch with sound on YouTube ↗
          </a>
        </figcaption>
      ) : (
        !video &&
        !still && (
          <figcaption className="case-media-note mono-label">
            Illustrative visual
            {import.meta.env.DEV && ` — set media.youtube (or media.video) for ${project.id} in resume.ts to show footage here`}
          </figcaption>
        )
      )}
    </figure>
  )
}
