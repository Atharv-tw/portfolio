/**
 * The site is two pages from one build (see vite.config.ts): the home page and
 * the full project index at /projects. The shared chrome (nav, palette) asks
 * this which one it is on.
 */
export const onProjectsPage =
  typeof window !== 'undefined' && /^\/projects(\/(index\.html)?)?$/.test(window.location.pathname)
