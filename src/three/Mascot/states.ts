import type { SceneId } from '../../content/resume'
import type { FaceMood } from './face'

export type Pose = 'stand' | 'sit' | 'float' | 'wave' | 'dribble'
export type Prop = 'none' | 'notes' | 'scan' | 'bubbles' | 'pulse' | 'heartbeat' | 'ball'

export interface SceneState {
  mood: FaceMood
  pose: Pose
  prop: Prop
  /** eye colour */
  eye: string
  /** antenna tip (and chest mark, when it beats) */
  tip: string
}

const WARM = '#fff4e4'
const ORANGE = '#ff6a17'

/**
 * Who the bot is in each scene. A scene that is not listed has no bot at all —
 * he is not meant to follow the visitor everywhere.
 *
 * WHERE he stands is not decided here: each of these scenes has an element
 * marked `data-bot-seat="<scene>"` in the page, and he fits himself into it.
 * Move or resize that box in CSS and he follows, at every breakpoint.
 */
export const SCENES: Partial<Record<SceneId, SceneState>> = {
  hero: { mood: 'confident', pose: 'stand', prop: 'none', eye: WARM, tip: ORANGE },
  about: { mood: 'listening', pose: 'sit', prop: 'notes', eye: WARM, tip: ORANGE },
  onyx: { mood: 'focus', pose: 'stand', prop: 'scan', eye: '#ff4a5e', tip: '#ff4a5e' },
  okeanos: { mood: 'idle', pose: 'float', prop: 'bubbles', eye: '#7fd3ea', tip: '#3fa7c4' },
  netwm: { mood: 'alert', pose: 'stand', prop: 'pulse', eye: '#ffc04d', tip: '#f5a524' },
  'health-companion': { mood: 'calm', pose: 'sit', prop: 'heartbeat', eye: '#9be0b4', tip: '#6cc392' },
  outside: { mood: 'happy', pose: 'dribble', prop: 'ball', eye: WARM, tip: ORANGE },
  contact: { mood: 'happy', pose: 'wave', prop: 'none', eye: WARM, tip: ORANGE },
}

/** bounding box of the character in his own units, antenna and headphones included */
export const BOT = {
  width: 2.3,
  height: 2.86,
  /** origin → soles */
  foot: 1.57,
  /** origin → seat, when he sits */
  seat: 1.2,
}
