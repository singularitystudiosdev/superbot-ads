/* spot-render — export a registry spot as an mp4 via deterministic frame
   stepping. Companion to tools/render.mjs, which predates the spot registry
   and drives player.html only; this one drives spot.html?spot=NAME so any
   spot in assets/spots.js renders, with duration read from the spot spec.
     node tools/render-spot.mjs --spot board             → 16:9
     node tools/render-spot.mjs --spot board --ratio 9:16
     node tools/render-spot.mjs --spot board --t0 10 --t1 13.5 --out clip */

import { createServer } from 'node:http'
import { readFile, mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { SPOTS } from '../assets/spots.js'

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const SIZES = { '16:9': [1280, 720], '1:1': [1000, 1000], '9:16': [720, 1280] }

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const spotName = arg('spot')
if (!spotName || !SPOTS[spotName]) {
  console.error(`unknown spot "${spotName}" — registered: ${Object.keys(SPOTS).join(', ')}`)
  process.exit(1)
}
const dur = SPOTS[spotName].dur
const ratio = arg('ratio', '16:9')
const fps = Number(arg('fps', 30))
const t0 = Number(arg('t0', 0)), t1 = Number(arg('t1', dur))
const full = t0 <= 0 && t1 >= dur
const name = arg('out', `${spotName}-${ratio.replace(':', 'x')}`)
const [W, H] = SIZES[ratio]

async function serve() {
  const srv = createServer(async (req, res) => {
    try {
      const path = req.url.split('?')[0]
      const body = await readFile(join(ROOT, path === '/' ? 'index.html' : path))
      res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' })
      res.end(body)
    } catch { res.writeHead(404); res.end('nope') }
  })
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  return { port: srv.address().port, close: () => srv.close() }
}

const INIT = `
  (() => {
    let vnow = 0
    const q = []
    performance.now = () => vnow
    window.requestAnimationFrame = (cb) => (q.push(cb), q.length)
    window.__seek = (tSec) => {
      const target = tSec * 1000
      let guard = 0
      while (vnow < target - 1e-9 && guard++ < 200000) {
        vnow += 1000 / 60
        for (const cb of q.splice(0)) cb(vnow)
      }
    }
  })()`

const { port, close } = await serve()
const dir = join(ROOT, '.tmp/render', name)
await rm(dir, { recursive: true, force: true })
await mkdir(dir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.addInitScript(INIT)
await page.goto(`http://127.0.0.1:${port}/spot.html?spot=${spotName}&ratio=${ratio}`)
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => { document.querySelector('.hint').style.display = 'none' })

const frames = Math.round((t1 - t0) * fps)
const t0ms = Date.now()
for (let i = 0; i < frames; i++) {
  const t = t0 + i / fps
  await page.evaluate((t) => window.__seek(t), t)
  await page.screenshot({ path: join(dir, `f${String(i).padStart(5, '0')}.png`) })
}
await browser.close()
close()

const out = join(ROOT, '.tmp/render', `${name}.mp4`)
await new Promise((resolve, reject) => {
  const ff = spawn('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(dir, 'f%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'ignore' })
  ff.on('error', reject)
  ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)))
})
console.log(`${name}.mp4 — ${frames} frames @ ${fps}fps (${ratio}${full ? '' : `, ${t0}–${t1}s`}) in ${((Date.now() - t0ms) / 1000).toFixed(0)}s → ${out}`)
