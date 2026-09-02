/* superbot.gg / ads — the "cheaper" spot.
   One looping, camera-driven ad rendered live in the page: wide shot of the
   cost figure (the benchmarks page's own .fig shape), a focus pull onto
   fable 5.1 as its bar fills to $9.90, back out, onto superbot as it fills
   to $0.92, punchline, then a hard cut to the SUPERBOT WINS end card.
   Runs on the shared rig in engine.js — this file is the spec, not the rig. */

import { SpotPlayer, easeStd, easeOutExpo, easeInOutCubic, Typer, Odometer } from './engine.js'

const FABLE_MAX = 9.9, US_MAX = 0.92
const CHEAPER = (FABLE_MAX / US_MAX).toFixed(1)

// camera shots: [t0, t1, focus, zoomFrom, zoomTo, ease]
// focus null = wide. zoom targets are resolved to element centres at mount.
const SHOTS = [
  { t0: 0.0,  t1: 1.9,  focus: null },
  { t0: 1.9,  t1: 2.8,  focus: 'fable', z0: 1, z1: 1.6, ease: easeStd },
  { t0: 2.8,  t1: 6.1,  focus: 'fable', hold: true },
  { t0: 6.1,  t1: 7.0,  focus: null, z0: 1.6, z1: 1, ease: easeStd },
  { t0: 7.0,  t1: 7.85, focus: 'us', z0: 1, z1: 1.6, ease: easeStd },
  { t0: 7.85, t1: 10.95, focus: 'us', hold: true },
  { t0: 10.95, t1: 11.55, focus: null, z0: 1.6, z1: 1, ease: easeOutExpo },
  { t0: 11.55, t1: 13.0, focus: null, hold: true }, // wide hold: punchline dwell
  { t0: 13.0, t1: 17.2, focus: null, hold: true }, // wins card lives here
]
// bar fills: [t0, t1, from, to, ease]  — odometer and bar share the tween
const FILLS = [
  { who: 'fable', t0: 2.8, t1: 5.3, v0: 0, v1: FABLE_MAX, ease: easeInOutCubic },
  { who: 'us', t0: 7.85, t1: 10.35, v0: 0, v1: US_MAX, ease: easeOutExpo },
]
const HITS = { fable: 5.3, us: 10.35 }
const CUT_T = 13.0

function easeSeg(shot, t) {
  const k = Math.min(1, Math.max(0, (t - shot.t0) / (shot.t1 - shot.t0)))
  return (shot.ease || easeStd)(k)
}

export const cheaperSpot = {
  dur: 17.2,
  // audit spec: the contract tools/audit.mjs verifies frame by frame
  audit: {
    settles: [
      { who: 'fable', from: 0.0, to: 2.75, value: 0.0 },
      { who: 'fable', from: 5.45, to: 17.1, value: 9.9 },
      { who: 'us', from: 0.0, to: 7.8, value: 0.0 },
      { who: 'us', from: 10.5, to: 17.1, value: 0.92 },
    ],
    // true zoom-1 rests only — 6.1–7.0 is a transition (clipped by design)
    wideWindows: [[0.0, 1.85], [11.6, 12.9]],
    cutT: 13.0,
    lines: [
      { at: 10.95, cps: 26, text: '10.8× cheaper.', sel: '[data-type="punch"]', coverAt: 13.0 },
      { at: 13.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 16.5 },
    ],
    beats: [0.5, 2.0, 3.2, 4.0, 5.4, 6.5, 8.0, 9.0, 10.45, 11.0, 11.7, 12.2, 13.2, 14.5, 16.8],
  },
  dom: () => `
    <figure class="ad-fig">
      <figcaption class="cap"><b>cost per task</b><span>dollars · lower is better</span></figcaption>
      <div class="chart">
        <div class="col us">
          <span class="val"><span class="cur">$</span><span class="od" data-od="us"></span></span>
          <span class="track"><span class="bar"></span><span class="hit-ring"></span></span>
          <span class="name">superbot</span>
        </div>
        <div class="col fable">
          <span class="val"><span class="cur">$</span><span class="od" data-od="fable"></span></span>
          <span class="track"><span class="bar"></span><span class="hit-ring"></span></span>
          <span class="name">fable 5.1</span>
        </div>
      </div>
      <p class="ad-punchline"><span class="type" data-type="punch"></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      cols: { us: p.cam.querySelector('.col.us'), fable: p.cam.querySelector('.col.fable') },
      odos: {
        fable: new Odometer(p.cam.querySelector('[data-od="fable"]')),
        us: new Odometer(p.cam.querySelector('[data-od="us"]')),
      },
      typer: {
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      wins: p.cam.querySelector('.ad-wins'),
      punch: 0,
    })

    // camera
    const shot = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]
    let z = shot.z0 ?? 1, px = p.W / 2, py = p.H / 2
    if (shot.focus) { const c = centre(P.cols[shot.focus], p.cam); px = c.x; py = c.y - 14 }
    if (!shot.hold && shot.z0 !== undefined) z = shot.z0 + (shot.z1 - shot.z0) * easeSeg(shot, t)
    else if (shot.focus && shot.z0 === undefined) z = 1.6
    // camera punch on hits: a short zoom impulse that springs back
    if (P.punch > 0.0005) z *= 1 + P.punch * 0.05
    p.camTo(z, px, py)
    p.cam.style.filter = P.punch > 0.001 ? `blur(${P.punch * 2.2}px)` : 'none'
    P.punch = Math.max(0, P.punch - P.punch * 0.09 - 0.0006)

    // depth of field on the unfocused column + caption
    p.cam.classList.toggle('focus-fable', shot.focus === 'fable')
    p.cam.classList.toggle('focus-us', shot.focus === 'us')
    p.cam.classList.toggle('wide', !shot.focus)

    // fills
    let fableV = 0, usV = 0
    for (const f of FILLS) {
      if (t >= f.t1) { if (f.who === 'fable') fableV = f.v1; else usV = f.v1 }
      else if (t > f.t0) {
        const k = f.ease((t - f.t0) / (f.t1 - f.t0))
        const v = f.v0 + (f.v1 - f.v0) * k
        if (f.who === 'fable') fableV = v; else usV = v
      }
    }
    P.odos.fable.set(fableV)
    P.odos.us.set(usV)
    setBar(P.cols.fable, fableV / FABLE_MAX)
    setBar(P.cols.us, usV / FABLE_MAX)
    p.cam.querySelector('.col.us .bar').style.setProperty('--glow', usV > 0 ? 1 : 0)

    // hits
    for (const [who, ht] of Object.entries(HITS)) {
      const col = P.cols[who]
      if (t >= ht && t < ht + 0.55 && !col.dataset.hitAt) {
        col.dataset.hitAt = String(performance.now())
        col.classList.add('hit')
        P.punch = 1
        shake(p)
      } else if (t < ht - 0.05) {
        delete col.dataset.hitAt
        col.classList.remove('hit')
      }
    }

    // punchline + wins card
    // punch rides the pull-back (10.95), finishes ~11.5s, holds ~1.5s
    // before the cut — started any later the wins card covers it unread
    P.typer.punch.run(t >= 10.95, `${CHEAPER}× cheaper.`, 26, t - 10.95)
    const winsOn = t >= CUT_T
    p.cam.classList.toggle('wins', winsOn)
    if (winsOn) {
      const w = t - CUT_T
      // end card is one line, held ~3.5s: readable even on a paused frame
      P.typer.wins.run(w >= 0.1, 'SUPERBOT WINS', 20, w - 0.1)
    }

    // cut flash + entrance draw
    p.cam.classList.toggle('drawn', t >= 0.55 && t < CUT_T)
    const inCut = Math.abs(t - CUT_T) < 0.05
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}

function centre(el, cam) {
  let x = 0, y = 0, n = el
  while (n && n !== cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 }
}

function setBar(col, frac) {
  const bar = col.querySelector('.bar')
  bar.style.setProperty('--h', (Math.max(0, Math.min(1, frac)) * 100).toFixed(2) + '%')
}

function shake(p) {
  p.stage.animate(
    [{ transform: p.stage.style.transform + ' translate(0,0)' },
     { transform: p.stage.style.transform + ' translate(4px,-3px)' },
     { transform: p.stage.style.transform + ' translate(-3px,2px)' },
     { transform: p.stage.style.transform + ' translate(0,0)' }],
    { duration: 240, easing: 'ease-out' })
}

/* page-facing player: same API the site sheet and capture page already use */
export class SuperbotAd extends SpotPlayer {
  constructor(root, opts = {}) {
    super(root, cheaperSpot, opts)
  }
  setClock(el) { this.clock = el }
}
