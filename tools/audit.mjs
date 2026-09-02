/* frame-audit — deterministic QA harness for the ad animations.
   Serves the repo, loads player.html with a virtual rAF clock, steps the
   loop at `fps`, and at every sample runs in-page layout invariants:
     - odometer digits aligned + fully inside their windows (at rest)
     - rendered odometer value == spec value (at rest)
     - no unintended text-block overlaps (within chart / within wins card)
     - typewriter lines complete to their exact spec strings
     - nothing clipped off-stage during wide shots
   Screenshots at --beats. Writes .tmp/audit/report.json, prints a table.
   Exit 1 on any violation. */

import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { SPOTS } from '../assets/spots.js'

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }

/* ---- spec: the contract the spot module itself declares ---- */
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const flag = (k) => argv.includes('--' + k)
const spotName = arg('spot', 'cheaper')
const SPEC = {
  player: `/spot.html?spot=${spotName}&ratio=`,
  fps: 30,
  ...SPOTS[spotName].audit,
  dur: SPOTS[spotName].dur,
}
const ratios = flag('all-ratios') ? ['16:9', '1:1', '9:16'] : [arg('ratio', '16:9')]
const fps = Number(arg('fps', SPEC.fps))
const OUT = join(ROOT, arg('out', '.tmp/audit'))
const QUIET = flag('quiet')

/* ---- static server ---- */
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

/* ---- virtual clock, installed before any page script ---- */
const INIT = `
  (() => {
    let vnow = 0
    const q = []
    performance.now = () => vnow
    window.requestAnimationFrame = (cb) => (q.push(cb), q.length)
    window.__stepFrames = (n) => {
      for (let i = 0; i < n; i++) {
        vnow += 1000 / 60
        for (const cb of q.splice(0)) cb(vnow)
      }
    }
    window.__seek = (tSec) => {
      const target = tSec * 1000
      let guard = 0
      while (vnow < target - 1e-9 && guard++ < 200000) window.__stepFrames(1)
    }
  })()`

/* ---- in-page check battery. Runs at one sampled t. ---- */
const FRAME_AUDIT = (t) => {
  const spec = window.__spec
  const V = []
  const bad = (check, detail) => V.push({ t: +t.toFixed(3), check, detail })
  const r = (el) => el.getBoundingClientRect()
  const vis = (el) => {
    const s = getComputedStyle(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.01 && el.textContent.trim() !== ''
  }

  /* -- odometers: at rest, each window shows exactly one centred digit -- */
  const inSettle = (who) => spec.settles.some((s) => s.who === who && t >= s.from && t <= s.to)
  const shown = {}
  for (const od of document.querySelectorAll('.od')) {
    const who = od.getAttribute('data-od')
    if (!inSettle(who)) continue
    const wraps = [...od.querySelectorAll('.od-d')]
    const digits = wraps.map((w) => {
      const wr = r(w)
      const kids = [...w.querySelector('.od-strip').children]
      const hits = kids
        .map((k, i) => ({ i, kr: r(k) }))
        .filter(({ kr }) => Math.min(kr.bottom, wr.bottom) - Math.max(kr.top, wr.top) > 0.6 * wr.height)
      return { wr, hits, w }
    })
    // every window must show exactly one digit, centred
    for (const { wr, hits, w } of digits) {
      if (hits.length !== 1) { bad('od-digit-window', `${who} [data-d="${w.dataset.d}"] shows ${hits.length} digits at rest`); continue }
      const kr = hits[0].kr
      const off = Math.abs((kr.top + kr.bottom) / 2 - (wr.top + wr.bottom) / 2)
      if (off > 1.5) bad('od-digit-offcenter', `${who} digit ${hits[0].i % 10} off-centre by ${off.toFixed(1)}px`)
    }
    // windows must agree with each other
    const centers = digits.filter((d) => d.hits.length === 1).map((d) => (d.hits[0].kr.top + d.hits[0].kr.bottom) / 2)
    if (centers.length === digits.length && Math.max(...centers) - Math.min(...centers) > 1.5)
      bad('od-misaligned', `${who} digit baselines differ by ${(Math.max(...centers) - Math.min(...centers)).toFixed(1)}px`)
    // rendered value vs spec
    if (digits.every((d) => d.hits.length === 1)) {
      const s = spec.settles.find((w) => w.who === who && t >= w.from && t <= w.to)
      const val = digits.map((d) => d.hits[0].i % 10)
      const want = s.value.toFixed(2).replace('.', '')
      if (val.join('') !== want) bad('od-value', `${who} shows "$${val.join('')}" — spec says "$${want}"`)
      shown[who] = val.join('')
    }
  }

  /* -- text overlaps, within chart and within wins card separately -- */
  const groups = [
    ['.cap b', '.cap span', '.col.us .val', '.col.us .name', '.col.fable .val', '.col.fable .name', '.ad-punchline'],
    ['.wins-line.big', '.wins-line.sub', '.wins-mark'],
    // series spots: typed lines, payoffs and diagram tiles never collide
    ['.m-line', '.y-pay', '.y-tile', '.term-line', '.i-pay', '.m-cap', '.m-chip', '.m-one'],
  ]
  for (const sel of groups) {
    const els = [...new Set(sel.flatMap((s) => [...document.querySelectorAll(s)]))].filter((el) => el && vis(el))
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const [a, b] = [r(els[i]), r(els[j])]
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (ox <= 0 || oy <= 0) continue
      const area = ox * oy
      const smaller = Math.min(a.width * a.height, b.width * b.height)
      if (smaller > 0 && area / smaller > 0.03)
        bad('text-overlap', `${els[i].className || els[i].tagName} × ${els[j].className || els[j].tagName} overlap ${(100 * area / smaller).toFixed(0)}%`)
    }
  }

  /* -- typewriter lines complete to the exact spec string -- */
  for (const l of spec.lines) {
    const done = l.at + l.text.length / l.cps
    // perceptual rules, checked once against the spec: a card must hold its
    // full text ~1.5s+ before whatever covers it, and stay scannable
    if (t < 0.05) {
      if (l.coverAt && l.coverAt - done < 1.5)
        bad('dwell-short', `${l.sel} full text holds only ${(l.coverAt - done).toFixed(2)}s before cover`)
      if (!l.mono && l.text.length > 42) bad('text-dense', `${l.sel} card is ${l.text.length} chars (>42)`)
    }
    if (t < done + 0.25) continue
    const el = document.querySelector(l.sel)
    if (!el || el.textContent !== l.text)
      bad('type-incomplete', `${l.sel} at t=${t.toFixed(2)}: "${el ? el.textContent : null}" ≠ "${l.text}"`)
  }

  /* -- clean loop wrap: faded to black before the seam -- */
  if (t >= spec.dur - 0.15) {
    const cam = document.querySelector('.ad-cam')
    if (cam && Number(getComputedStyle(cam).opacity) > 0.55)
      bad('unclean-loop', `cam opacity ${getComputedStyle(cam).opacity} at t=${t.toFixed(2)} — not dimmed toward the seam`)
  }

  /* -- wide shots: every chart text block inside the stage -- */
  if (spec.wideWindows.some(([a, b]) => t >= a && t <= b)) {
    const st = r(document.querySelector('.ad-stage'))
    for (const s of ['.cap', '.col.us .val', '.col.fable .val', '.col.us .name', '.col.fable .name', '.ad-punchline']) {
      const el = document.querySelector(s)
      if (!el || !vis(el)) continue
      const er = r(el)
      if (er.left < st.left - 1 || er.right > st.right + 1 || er.top < st.top - 1 || er.bottom > st.bottom + 1)
        bad('offstage', `${s} outside stage during wide shot`)
    }
  }
  return { violations: V, shown }
}

/* ---- main ---- */
const { port, close } = await serve()
await mkdir(join(OUT, 'frames'), { recursive: true })
const browser = await chromium.launch()
const violations = []
let samples = 0

for (const ratio of ratios) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.addInitScript(INIT)
  await page.goto(`${`http://127.0.0.1:${port}`}${SPEC.player}${ratio}`)
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => { window.__spec = s }, SPEC)
  const n = Math.floor(SPEC.dur * fps) // last sample lands on the wrap seam, never past it
  for (let i = 0; i <= n; i++) {
    const t = i / fps
    await page.evaluate((t) => window.__seek(t), t)
    // settle CSS transitions (they run on real time, not the virtual clock):
    // snap every finished-or-running animation to its end state. Infinite
    // ones (caret blink) can't finish — skip those.
    await page.evaluate(() => {
      for (const a of document.getAnimations()) { try { if (a.effect.getTiming().iterations !== Infinity) a.finish() } catch {} }
    })
    const res = await page.evaluate(FRAME_AUDIT, t)
    samples++
    for (const v of res.violations) violations.push({ ratio, ...v })
    if (SPEC.beats.some((b) => Math.abs(b - t) < 0.5 / fps)) {
      const f = join(OUT, 'frames', `${ratio}-t${String(t).replace('.', '_')}.png`)
      await page.screenshot({ path: f }).catch(() => {})
    }
  }
  await page.close()
}
await browser.close()
close()

/* ---- report ---- */
const key = (v) => `${v.ratio}|${v.check}|${v.detail.replace(/t=[\d.]+/, 't=X').replace(/ by [\d.]+px/, ' px')}`
const grouped = new Map()
for (const v of violations) {
  const k = key(v)
  if (!grouped.has(k)) grouped.set(k, { ...v, count: 0, t0: v.t, t1: v.t })
  const g = grouped.get(k)
  g.count++; g.t1 = Math.max(g.t1, v.t)
}
const report = { samples, ratios, violations, groups: [...grouped.values()] }
await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2))

if (!QUIET) for (const g of grouped.values())
  console.log(`${g.ratio}  ${g.check.padEnd(18)} ×${String(g.count).padStart(3)}  t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}  ${g.detail}`)
console.log(`\n${violations.length} violations over ${samples} samples (${ratios.join(', ')} @ ${fps}fps) → ${join(OUT, 'report.json')}`)
process.exit(violations.length ? 1 : 0)
