/**
 * Mutable shared state read by the 3D layer every frame — deliberately not
 * React state (no re-renders at 60fps).
 */
export const scrollState = {
  /** lenis velocity (px/frame-ish), signed */
  velocity: 0,
  /** performance.now() of the last user input */
  lastActivity: typeof performance !== 'undefined' ? performance.now() : 0,
  /** performance.now() of the last press that landed on the bot */
  botHitAt: -1e9,
  /** last pointer position in client px; -1 until the pointer has moved */
  pointerX: -1,
  pointerY: -1,
}

/**
 * The bot lives in a canvas above the page, so a press on him also reaches
 * whatever DOM is underneath. Click handlers under his seats ask this first.
 */
export function botTookClick() {
  return performance.now() - scrollState.botHitAt < 450
}

export function markActivity() {
  scrollState.lastActivity = performance.now()
}

let bound = false
export function bindActivityListeners() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener(
    'pointermove',
    (e) => {
      scrollState.pointerX = e.clientX
      scrollState.pointerY = e.clientY
      markActivity()
    },
    { passive: true },
  )
  window.addEventListener('pointerdown', markActivity, { passive: true })
  window.addEventListener('wheel', markActivity, { passive: true })
  window.addEventListener('touchstart', markActivity, { passive: true })
  window.addEventListener('keydown', markActivity)
}
