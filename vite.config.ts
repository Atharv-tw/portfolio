import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { headTags, llmsTxt, pages, projectsStaticHtml, robotsTxt, sitemapXml, staticHtml, type Page } from './src/content/seo'

/**
 * Fills each page's HTML with what crawlers need (title, meta, structured data
 * and a plain-HTML copy of the page) and emits robots.txt, sitemap.xml and
 * llms.txt. All of it is generated from src/content — see src/content/seo.ts.
 */
function seo(): Plugin {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html, ctx) {
      // '/projects/index.html' when building, the requested URL in dev
      const page: Page = ctx.path.startsWith('/projects') ? 'projects' : 'home'
      const body = page === 'projects' ? projectsStaticHtml() : staticHtml()
      return {
        html: html
          .replace(/<title>.*?<\/title>/, `<title>${pages[page].title}</title>`)
          .replace('<div id="root"></div>', `<div id="root">\n${body}\n</div>`),
        tags: headTags(today, page).map((t) => ({ ...t, injectTo: 'head' as const })),
      }
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(today) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() })
    },
  }
}

/**
 * Serves /projects from projects/index.html, as Vercel does. Vite's own
 * fallback only finds it at /projects/ and sends /projects to the home page.
 */
function projectsRoute(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    // the repo has no Node types, so `url` is not on the request's type
    const r = req as unknown as { url?: string }
    if (r.url) r.url = r.url.replace(/^\/projects(?=\?|$)/, '/projects/')
    next()
  }
  return {
    name: 'portfolio-projects-route',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

export default defineConfig({
  plugins: [react(), projectsRoute(), seo()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: { main: 'index.html', projects: 'projects/index.html' },
      output: {
        // Vendor code by package. React gets its own chunk: grouped by dependency
        // it lands in `three` (fiber and drei import it), and /projects, which
        // has no 3D, would download three.js just to get React.
        manualChunks(id) {
          const pkg = id.match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1]
          // stylesheets (the fonts) stay with the page that imports them
          if (!pkg || /\.css($|\?)/.test(id)) return
          if (['react', 'react-dom', 'scheduler', 'zustand', 'use-sync-external-store'].includes(pkg)) return 'react'
          if (['gsap', 'framer-motion', 'motion-dom', 'motion-utils', 'lenis'].includes(pkg)) return 'motion'
          // three, @react-three/* and everything they bring with them
          return 'three'
        },
      },
    },
  },
})
