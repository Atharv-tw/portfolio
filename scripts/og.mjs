/**
 * Builds public/og.jpg, the image link previews show: the real head of the
 * About section (the opening line and the photo), rendered in a headless
 * browser and tidied for a share card (no nav, nothing else of the page).
 *
 *   npm run og                  the live site (url in src/content/site.ts)
 *   npm run og -- <url>         any other address, e.g. http://localhost:4173
 *
 * Needs Brave, Chrome or Chromium installed. Nothing else: it talks to the
 * browser over the DevTools protocol with Node's own WebSocket.
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const siteUrl = /url:\s*'([^']+)'/.exec(readFileSync(join(root, 'src/content/site.ts'), 'utf8'))?.[1]
const url = process.argv[2] ?? siteUrl
const out = join(root, 'public/og.jpg')

// the card is 1200 × 630, drawn at 2× so the type stays sharp
const CARD = { w: 1200, h: 630 }
const VIEW = { w: 1200, h: 630, scale: 2 }
const PORT = 9333

/** what a share card should not carry: live-page controls, the bot's canvas, the rest of the section */
const TIDY = `
  .nav, .cursor-dot, .cursor-ring, .cursor-label, .scene-canvas, .mascot-layer { visibility: hidden !important; }
  .hero, .about-grid, .about-interests { visibility: hidden !important; }
`

const browser = ['brave-browser', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].find(
  (name) => spawnSync('which', [name]).status === 0,
)
if (!browser) throw new Error('No Brave, Chrome or Chromium found on this machine.')
if (!url) throw new Error('No url: pass one, or set it in src/content/site.ts.')

const profile = mkdtempSync(join(tmpdir(), 'og-'))
const proc = spawn(
  browser,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${VIEW.w},${VIEW.h}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    // the bot is WebGL; this draws him without a GPU
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let target
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250)
    try {
      target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page')
    } catch {
      // not listening yet
    }
  }
  if (!target) throw new Error(`${browser} did not start.`)

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })
  let id = 0
  const waiting = new Map()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    waiting.get(msg.id)?.(msg)
    waiting.delete(msg.id)
  }
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      waiting.set(++id, resolve)
      ws.send(JSON.stringify({ id, method, params }))
    })
  const js = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
  const until = async (expression, tries, every) => {
    for (let i = 0; i < tries; i++) {
      if (await js(expression)) return true
      await sleep(every)
    }
    return false
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.w,
    height: VIEW.h,
    deviceScaleFactor: VIEW.scale,
    mobile: false,
  })
  await send('Page.navigate', { url })

  // through the entry gate
  const entered = await until(
    `(() => { const b = document.querySelector('.preloader-enter'); if (!b) return false; b.click(); return true })()`,
    100,
    250,
  )
  if (!entered) throw new Error(`No entry button at ${url}: is the site up?`)

  // the head of About, centred in the card, once its line has risen and the photo has loaded
  await sleep(2500)
  await js(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(TIDY)}; document.head.appendChild(s) })()`)
  const centre = `(() => {
    const head = document.querySelector('.about-head'); if (!head) return false
    const r = head.getBoundingClientRect()
    window.scrollTo(0, Math.round(r.top + window.scrollY + r.height / 2 - window.innerHeight / 2)); return true
  })()`
  if (!(await js(centre))) throw new Error(`No About section at ${url}.`)
  await sleep(3500)
  await js(centre)
  const loaded = await until(
    `(() => { const i = document.querySelector('.about-photo'); return !!i && i.complete && i.naturalWidth > 0 })()`,
    60,
    250,
  )
  if (!loaded) throw new Error('The About photo did not load.')
  await sleep(2000)

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  if (!shot.result?.data) throw new Error('The browser returned no image.')

  // scale it down to the card in the browser itself, in two steps so it stays crisp
  const jpeg = await js(`(async () => {
    const img = new Image()
    img.src = 'data:image/png;base64,${shot.result.data}'
    await img.decode()
    const draw = (source, w, h) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const g = c.getContext('2d')
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = 'high'
      g.drawImage(source, 0, 0, w, h)
      return c
    }
    return draw(draw(img, ${CARD.w * 1.5}, ${CARD.h * 1.5}), ${CARD.w}, ${CARD.h}).toDataURL('image/jpeg', 0.9)
  })()`)
  if (!jpeg?.startsWith('data:image/jpeg')) throw new Error('Could not encode the image.')
  writeFileSync(out, Buffer.from(jpeg.split(',')[1], 'base64'))
  console.log(`og.jpg written from ${url} (${CARD.w} × ${CARD.h}) with ${browser}`)
  ws.close()
} finally {
  proc.kill('SIGTERM')
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
