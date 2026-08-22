interface Props {
  text: string
  /** how many copies per track — enough to cover a wide viewport */
  repeat?: number
  direction?: 'left' | 'right'
}

/**
 * Two identical tracks side by side, each translating a full width.
 * Pure CSS, so it costs nothing on the main thread.
 */
export default function Marquee({ text, repeat = 4, direction = 'left' }: Props) {
  const items = Array.from({ length: repeat }, (_, i) => (
    <span className="marquee__item" key={i}>
      {text}
    </span>
  ))

  return (
    <div className={`marquee ${direction === 'right' ? 'marquee--right' : ''}`} aria-hidden="true">
      <div className="marquee__track">{items}</div>
      <div className="marquee__track">{items}</div>
    </div>
  )
}
