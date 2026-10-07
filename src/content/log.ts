/**
 * LOG — field notes / build log.
 *
 * An engineering notebook: things built, researched, fixed, tried or learned,
 * newest first. The LOG link only appears in the nav once this list has at
 * least one entry.
 *
 * Add an entry:
 *   {
 *     date: '2026-10-07',
 *     kind: 'fixed',
 *     title: 'Short, specific headline',
 *     body: 'Optional. A few sentences on what happened and what you took from it.',
 *     link: { label: 'PR', href: 'https://…' },   // optional
 *   },
 */

export type LogKind = 'built' | 'researched' | 'fixed' | 'experimented' | 'learned'

export interface LogEntry {
  /** ISO date, YYYY-MM-DD */
  date: string
  kind: LogKind
  title: string
  body?: string
  link?: { label: string; href: string }
}

export const log: LogEntry[] = []
