/**
 * Mutable shared music signal — read every frame by the 3D mascot and the
 * DOM visualizer. Kept out of React state so it can update at 60fps for free.
 */
export const musicState = {
  /** engine is running */
  playing: false,
  /** smoothed overall loudness, 0 → 1 */
  level: 0,
  /** performance.now() of the last kick — drives the mascot's bounce */
  beatAt: -1e9,
  /** hue that drifts over the loop, 0 → 1, for reactive coloring */
  hue: 0.55,
}
