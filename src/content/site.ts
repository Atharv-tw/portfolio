/**
 * How the site describes itself to search engines, link previews and AI
 * crawlers. Everything in <head>, the structured data, robots.txt, sitemap.xml
 * and llms.txt is generated from this file and resume.ts at build time
 * (see src/content/seo.ts and vite.config.ts).
 */
export const site = {
  /**
   * Where the site lives, without a trailing slash.
   * TODO(Atharv): change this one line when the custom domain is connected.
   */
  url: 'https://atharvportfolio-wheat.vercel.app',
  /** browser tab and search result title — keep it near 60 characters */
  title: 'Atharv Tiwari — AI/ML Engineer and Product Builder',
  /** search result snippet — keep it near 155 characters */
  description:
    'Atharv Tiwari is an AI/ML engineer and product builder in New Delhi. Founding CTO at Nexera, building agentic AI and ML systems that ship.',
  /** what he is, in the words people search for */
  jobTitles: ['AI/ML Engineer', 'Product Builder'],
  /** topics he should be associated with */
  knowsAbout: [
    'Artificial intelligence',
    'Machine learning',
    'Agentic AI systems',
    'Large language models',
    'Retrieval-augmented generation',
    'LLM evaluation',
    'Full-stack development',
    'Backend engineering',
    'Cybersecurity',
  ],
  /** share image, relative to the site root */
  image: '/og.jpg',
  locale: 'en_IN',
} as const
