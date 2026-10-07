/**
 * Marks a spot whose content has not been written yet (see src/content/).
 * Only exists in `npm run dev` — a production build renders nothing here,
 * so a visitor never sees a placeholder.
 */
export default function Awaiting({ what }: { what: string }) {
  if (!import.meta.env.DEV) return null
  return (
    <p className="awaiting mono-label" data-awaiting>
      {what} — awaiting copy
    </p>
  )
}
