/**
 * The bot dresses for the day of the week — the visitor's day, not Delhi's —
 * from the outfits in public/models/outfits (built by scripts/blender).
 */
export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export type Day = (typeof DAYS)[number]

export const OUTFITS: Record<Day, { day: string; name: string }> = {
  mon: { day: 'Monday', name: 'ship mode' },
  tue: { day: 'Tuesday', name: 'hood up' },
  wed: { day: 'Wednesday', name: 'dojo' },
  thu: { day: 'Thursday', name: 'cold morning' },
  fri: { day: 'Friday', name: 'hack night' },
  sat: { day: 'Saturday', name: 'game day' },
  sun: { day: 'Sunday', name: 'day off' },
}

export function today(): Day {
  return DAYS[new Date().getDay()]
}

export const outfitUrl = (day: Day) => `/models/outfits/${day}.glb`
