import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { headTags, llmsTxt, robotsTxt, sitemapXml, staticHtml } from './src/content/seo'
import { site } from './src/content/site'

/**
 * Fills index.html with what crawlers need (title, meta, structured data and a
 * plain-HTML copy of the page) and emits robots.txt, sitemap.xml and llms.txt.
 * All of it is generated from src/content — see src/content/seo.ts.
 */
function seo(): Plugin {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      return {
        html: html
          .replace(/<title>.*?<\/title>/, `<title>${site.title}</title>`)
          .replace('<div id="root"></div>', `<div id="root">\n${staticHtml()}\n</div>`),
        tags: headTags(today).map((t) => ({ ...t, injectTo: 'head' as const })),
      }
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(today) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() })
    },
  }
}

export default defineConfig({
  plugins: [react(), seo()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['gsap', 'framer-motion', 'lenis'],
        },
      },
    },
  },
})
