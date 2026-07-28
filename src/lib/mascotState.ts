/**
 * Bridge between the 3D mascot and the DOM. The bot writes its projected
 * screen position here every frame; the speech-bubble component reads it to
 * park a quip above his head. Quips are triggered from either side via
 * `sayQuip` (bumping `quipId` so the DOM layer notices).
 */
export const mascotState = {
  screenX: 0,
  screenY: 0,
  /** rough on-screen size, drives bubble scale */
  size: 1,
  onScreen: false,
  /** he's mid-drag — the bubble hides so it doesn't chase the cursor */
  dragging: false,
  quipId: 0,
  quip: '',
}

/** short, bright, easy-going — the bot's voice */
export const QUIPS = [
  'yo 👋',
  'drag me, I dare you',
  'psst — press ⌘K',
  'built overnight, ships forever',
  'chai + code = 🚀',
  'scroll down, it gets better',
  'I do 3am deploys too',
  'wanna see something I built?',
  'beep boop, but make it prod',
  'hire the human — keep me around',
  'weekends? those are for hackathons',
  '120+ APIs and counting',
]

export function sayQuip(text?: string) {
  mascotState.quip = text ?? QUIPS[Math.floor(Math.random() * QUIPS.length)]
  mascotState.quipId++
}
