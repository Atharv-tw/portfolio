import type { ReactNode } from 'react'
import type { Project } from '../../content/resume'
import Arcade from './Arcade'
import Depth from './Depth'
import Forecast from './Forecast'
import Orbit from './Orbit'
import Radar from './Radar'
import SwipeDeck from './SwipeDeck'
import Vault from './Vault'

/** The live visual that stands for a project, in its tile and in its modal. */
export default function Motif({ project }: { project: Project }): ReactNode {
  switch (project.motif) {
    case 'radar':
      return <Radar accent={project.accent} />
    case 'depth':
      return <Depth accent={project.accent} />
    case 'forecast':
      return <Forecast accent={project.accent} />
    case 'orbit':
      return <Orbit accent={project.accent} />
    case 'arcade':
      return <Arcade accent={project.accent} />
    case 'deck':
      return <SwipeDeck accent={project.accent} />
    case 'vault':
      return <Vault accent={project.accent} />
  }
}
