import type { Project } from '../content/resume'
import Motif from './motifs/Motif'

/**
 * The big media stage in a project's modal.
 *
 * Plays real demo footage when the project has some; until then it shows the
 * project's live visual and says plainly that it is an illustration.
 * To add a video: put the file in `public/videos/` and set
 * `media: { video: '/videos/<id>.mp4', poster: '/videos/<id>.jpg' }` in resume.ts.
 */
export default function ProjectMedia({ project }: { project: Project }) {
  const { video, poster } = project.media

  return (
    <figure className="case-media" data-motif={project.motif}>
      {video ? (
        <video
          className="case-video"
          src={video}
          poster={poster}
          controls
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={`${project.name} demo`}
        />
      ) : (
        <>
          <Motif project={project} />
          <figcaption className="case-media-note mono-label">
            Illustrative visual
            {import.meta.env.DEV && ` — add public/videos/${project.id}.mp4 and set media.video to show footage here`}
          </figcaption>
        </>
      )}
    </figure>
  )
}
