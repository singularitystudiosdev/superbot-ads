/* superbot.gg / ads — the "benchmark" spot.
   The developer-native ad: a cost-per-task scatter chart, the kind that
   fills every model launch post, animating in series by series — then
   superbot's green dots drop in top-right, alone above the pack, and the
   frontier moves. Everything draws on an SVG so the whole chart scales
   with the placement ratio. Punchline, hard cut, SUPERBOT WINS end card.
   Text rules of the series: ≤42 chars per card, ≥1.5s dwell. All timed
   state is set from tick() inline (dashoffset, opacity, transform) — no
   CSS transitions — so the virtual-clock render stays deterministic. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

/* ---- data: [name, color, pts [cost $, success %], label anchor] ---- */
const SERIES = [
  { name: 'fable 5.1', color: '#b3a24a', pts: [[9.7, 73], [6.3, 72.4], [4.3, 69], [2.6, 67.4]], lab: [85, 46, 'start'] },
  { name: 'opus 5', color: '#6f9cb8', pts: [[7.2, 69.9], [6.0, 69], [3.5, 66.3], [2.3, 64]], lab: [262, 70, 'start'] },
  { name: 'gpt-5.6 sol', color: '#c96f5f', pts: [[5.3, 67], [2.9, 63.6], [2.2, 63.1]], lab: [397, 97, 'start'] },
  { name: 'grok 4.6', color: '#aab2ba', pts: [[1.9, 70.5], [1.4, 69.3], [0.7, 66.7], [0.35, 60.6]], lab: [586, 84, 'end'] },
  { name: 'sonnet 5', color: '#9a8fd6', pts: [[3.4, 61], [1.9, 58.2], [1.2, 56.3], [0.7, 47.1]], lab: [530, 196, 'end'] },
  { name: 'gemini 3.7 flash', color: '#7f8fd0', pts: [[1.0, 61.1], [0.75, 58.7], [0.5, 53.6]], lab: [796, 190, 'end'] },
  { name: 'composer 2.5', color: '#b58a5f', pts: [[0.75, 64.3], [0.4, 58.9], [0.15, 55.5]], lab: [726, 152, 'end'] },
]
const US = { name: 'superbot', color: 'var(--accent)', pts: [[0.75, 72.1], [0.55, 70.6], [0.3, 67.8]], lab: [760, 36, 'end'], stat: [760, 54, 'end'] }

/* plot space: viewBox 800×450 — cost $10→$0 maps to x 70→780, 75→45% to y 36→380 */
const PX = (c) => 70 + (10 - c) * 71
const PY = (p) => 36 + (75 - p) * 344 / 30

const AXES_AT = 0.7
const RIV_AT = (i) => 1.5 + i * 0.6                 // series i starts drawing
const RIV_DUR = 0.7
const DROP_AT = (i) => 7.1 + i * 0.6               // our dots land
const LABEL_AT = 7.35
const STAT_AT = 8.5
const DIM_AT = 9.0                                  // the pack recedes
const PUNCH_AT = 9.3
const CUT_T = 11.6

const RIVALS = SERIES.length

export const benchmarkSpot = {
  dur: 14.6,
  audit: {
    settles: [],
    wideWindows: [[0.0, 6.9], [10.0, 11.45]],
    cutT: CUT_T,
    lines: [
      { at: STAT_AT, cps: 22, text: '72.1% · $0.30 a task', sel: '[data-type="stat"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'the frontier moved.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.2 },
    ],
    beats: [1.0, 2.4, 4.2, 6.4, 7.5, 8.7, 9.9, 11.0, 12.6, 13.8],
  },
  dom: () => `
    <style>
      .ad-player[data-ratio='16:9'] .bm-fig { left: 170px; top: 74px; width: 940px; padding: 26px 48px 24px; }
      .ad-player[data-ratio='1:1'] .bm-fig { left: 90px; top: 210px; width: 820px; padding: 24px 44px 22px; }
      .ad-player[data-ratio='9:16'] .bm-fig { left: 28px; top: 300px; width: 664px; padding: 22px 28px 20px; }
      /* the chart is width-hungry; on the tall frame the svg shrinks, so the
         in-chart type scales up to hold the line (CSS beats svg attrs) */
      .ad-player[data-ratio='9:16'] .bm-svg text { font-size: 16px; }
      .ad-player[data-ratio='9:16'] .bm-svg .bm-lab { font-size: 19px; }
      .ad-player[data-ratio='9:16'] .bm-svg .bm-name { font-size: 24px; }
      .ad-player[data-ratio='9:16'] .bm-svg .bm-stat { font-size: 19px; }
      .bm-fig { font-size: 21px; }
      .ad-player[data-ratio='9:16'] .bm-fig { font-size: 17px; }
      .bm-svg { display: block; width: 100%; height: auto; margin-top: 20px; }
      .bm-svg text { font-family: var(--font-mono); }
      .bm-lab { font-size: 13px; fill: var(--muted); }
      .bm-axis { font-size: 12px; fill: var(--muted); }
      .bm-grid { stroke: var(--line); stroke-dasharray: 2 5; stroke-width: 1; }
      .bm-ours text { fill: var(--fg); }
      .bm-ours .bm-name { font-size: 17px; font-weight: 700; fill: var(--accent); }
      .bm-ours .bm-stat { font-size: 13px; fill: var(--accent); }
      .bm-punch { margin-top: 18px; }
    </style>
    <figure class="ad-fig bm-fig">
      <figcaption class="cap"><b>capability vs. cost</b><span>task success against average cost per task</span></figcaption>
      ${chartSvg()}
      <p class="ad-punchline bm-punch"><span class="type" data-type="punch"></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = buildParts(p))

    // fig entrance: rise + fade
    const fk = easeOutExpo(clamp01((t - 0.1) / 0.7))
    P.fig.style.opacity = String(fk)
    P.fig.style.transform = `translateY(${((1 - fk) * 16).toFixed(1)}px)`

    // axes fade in
    P.axes.style.opacity = String(easeOutExpo(clamp01((t - AXES_AT) / 0.6)))

    // rivals: line draws left→right, dots pop, label fades; the pack dims
    // once we land — the camera keeps them as context, not competition
    P.rivals.forEach((g, i) => {
      const k = easeStd(clamp01((t - RIV_AT(i)) / RIV_DUR))
      g.path.style.strokeDashoffset = String(1 - k)
      const dim = easeStd(clamp01((t - DIM_AT) / 0.9))
      g.g.style.opacity = String(0.9 - 0.58 * dim)
      g.g.style.filter = dim > 0.02 ? `blur(${(2 * dim).toFixed(2)}px)` : 'none'
      g.dots.forEach((d, j) => {
        const dk = easeOutExpo(clamp01((t - (RIV_AT(i) + 0.2 + j * 0.16)) / 0.3))
        d.style.opacity = String(dk)
        d.style.transform = `scale(${(0.4 + 0.6 * dk).toFixed(3)})`
      })
      const lk = easeOutExpo(clamp01((t - (RIV_AT(i) + RIV_DUR * 0.7)) / 0.4))
      g.lab.style.opacity = String(lk * (1 - 0.45 * dim))
    })

    // our dots: drop in with a glow-pop overshoot, one by one
    P.ours.dots.forEach((d, i) => {
      const on = t >= DROP_AT(i)
      const k = easeOutExpo(clamp01((t - DROP_AT(i)) / 0.38))
      d.style.opacity = String(on ? k : 0)
      d.style.transform = `scale(${(on ? 1.7 - 0.7 * k : 1.7).toFixed(3)})`
    })
    // connecting line draws as the dots land
    const uk = easeStd(clamp01((t - DROP_AT(0)) / (DROP_AT(2) + 0.25 - DROP_AT(0))))
    P.ours.path.style.strokeDashoffset = String(1 - uk)
    const lk = easeOutExpo(clamp01((t - LABEL_AT) / 0.4))
    P.ours.lab.style.opacity = String(lk)
    const sk = easeOutExpo(clamp01((t - STAT_AT) / 0.35))
    P.ours.statEl.style.opacity = String(sk)
    // the glow breathes up as the cluster completes, holds through the dim
    const glow = easeStd(clamp01((t - DROP_AT(0)) / 1.6))
    P.ours.g.style.filter = glow > 0.02
      ? `drop-shadow(0 0 ${(7 * glow).toFixed(1)}px color-mix(in srgb, var(--accent) ${(60 * glow).toFixed(0)}%, transparent))`
      : 'none'

    // camera: wide → push onto the cluster while it lands → pull back for
    // the punchline, wide to the cut
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 7.0 && t < 8.2) {
      const k = easeStd(clamp01((t - 7.0) / 1.2))
      z = 1 + 0.3 * k
      px = p.W / 2 + (980 - p.W / 2) * k
      py = p.H / 2 + (250 - p.H / 2) * k
    } else if (t >= 8.2 && t < 9.9) {
      const k = easeStd(clamp01((t - 8.2) / 1.7))
      z = 1.3 - 0.3 * k
      px = 980 - (980 - p.W / 2) * k
      py = 250 - (250 - p.H / 2) * k
    }
    p.camTo(z, px, py)

    P.typer.stat.run(t >= STAT_AT, '72.1% · $0.30 a task', 22, t - STAT_AT)
    P.typer.punch.run(t >= PUNCH_AT, 'the frontier moved.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT ? '1' : '0'

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)

    const inCut = Math.abs(t - CUT_T) < 0.05
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))

/* ---- build the svg once at mount, cache typed parts ---- */
function chartSvg() {
  const ticks = [75, 70, 65, 60, 55, 50, 45]
  const line = (pts) => pts.map(([c, p]) => `${PX(c).toFixed(1)},${PY(p).toFixed(1)}`).join(' ')
  const rival = (s, i) => `
    <g class="bm-rival" data-riv="${i}">
      <polyline points="${line(s.pts)}" fill="none" stroke="${s.color}" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round" opacity="0.9"
        pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1" data-riv-path="${i}"/>
      ${s.pts.map(([c, p], j) => `
      <circle cx="${PX(c).toFixed(1)}" cy="${PY(p).toFixed(1)}" r="4.5" fill="${s.color}"
        data-riv-dot="${i}.${j}" style="opacity:0;transform-box:fill-box;transform-origin:center"/>`).join('')}
      <text x="${s.lab[0]}" y="${s.lab[1]}" text-anchor="${s.lab[2]}" class="bm-lab" data-riv-lab="${i}"
        style="opacity:0">${s.name}</text>
    </g>`
  const ours = `
    <g class="bm-ours" data-ours>
      <polyline points="${line(US.pts)}" fill="none" stroke="var(--accent)" stroke-width="3"
        stroke-linejoin="round" stroke-linecap="round"
        pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1" data-ours-path/>
      ${US.pts.map(([c, p], j) => `
      <circle cx="${PX(c).toFixed(1)}" cy="${PY(p).toFixed(1)}" r="6" fill="var(--accent)"
        data-ours-dot="${j}" style="opacity:0;transform-box:fill-box;transform-origin:center"/>`).join('')}
      <text x="${US.lab[0]}" y="${US.lab[1]}" text-anchor="${US.lab[2]}" class="bm-name" data-ours-lab
        style="opacity:0">superbot</text>
      <text x="${US.stat[0]}" y="${US.stat[1]}" text-anchor="${US.stat[2]}" class="bm-stat" data-stat-el
        style="opacity:0"><tspan class="type" data-type="stat"></tspan></text>
    </g>`
  return `
    <svg class="bm-svg" viewBox="0 0 800 450" aria-hidden="true">
      <g data-axes style="opacity:0">
        <rect x="70" y="8" width="152" height="24" rx="12" fill="none" stroke="var(--accent)" stroke-width="1"/>
        <text x="146" y="24" text-anchor="middle" font-size="12" fill="var(--accent)">cost per task</text>
        <text x="262" y="24" text-anchor="middle" font-size="12" fill="var(--muted)" opacity="0.55">time per task</text>
        ${ticks.map((p) => `
        <line x1="70" y1="${PY(p).toFixed(1)}" x2="780" y2="${PY(p).toFixed(1)}" class="bm-grid"/>
        <text x="58" y="${(PY(p) + 4).toFixed(1)}" text-anchor="end" font-size="12">${p}%</text>`).join('')}
        <line x1="425" y1="36" x2="425" y2="380" class="bm-grid"/>
        <text x="70" y="400" text-anchor="middle" font-size="12">$10.00</text>
        <text x="425" y="400" text-anchor="middle" font-size="12">$5.00</text>
        <text x="780" y="400" text-anchor="middle" font-size="12">$0.00</text>
        <text x="425" y="428" text-anchor="middle" font-size="13" letter-spacing="0.08em">average cost per task</text>
        <line x1="70" y1="36" x2="70" y2="380" stroke="var(--line)" stroke-width="1"/>
        <line x1="70" y1="380" x2="780" y2="380" stroke="var(--line)" stroke-width="1"/>
      </g>
      ${SERIES.map(rival).join('')}
      ${ours}
    </svg>`
}

function buildParts(p) {
  const fig = p.cam.querySelector('.bm-fig')
  const q = (s) => p.cam.querySelector(s)
  return {
    fig,
    axes: q('[data-axes]'),
    punch: q('.bm-punch'),
    rivals: SERIES.map((_, i) => ({
      g: q(`[data-riv="${i}"]`),
      path: q(`[data-riv-path="${i}"]`),
      dots: [...p.cam.querySelectorAll(`[data-riv-dot^="${i}."]`)],
      lab: q(`[data-riv-lab="${i}"]`),
    })),
    ours: {
      g: q('[data-ours]'),
      path: q('[data-ours-path]'),
      dots: [...p.cam.querySelectorAll('[data-ours-dot]')],
      lab: q('[data-ours-lab]'),
      statEl: q('[data-stat-el]'),
    },
    typer: {
      stat: new Typer(q('[data-type="stat"]')),
      punch: new Typer(q('[data-type="punch"]')),
      wins: new Typer(q('[data-type="wins"]')),
    },
  }
}
