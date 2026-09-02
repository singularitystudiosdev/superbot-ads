/* superbot.gg / ads — the "compared" spot.
   The classic SaaS comparison-table ad, staged as a camera move: the grid
   draws in, "other agents" collect their ✗ stamp row by row while the
   camera tracks down the table, then the superbot column checks off all
   five in one cascade from the wide. Punchline, hard cut, SUPERBOT WINS
   end card. Text rules of the series: ≤42 chars per card, ≥1.5s dwell.
   All timed state is set from tick() (inline styles, no transitions) so
   the virtual-clock render stays deterministic. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

const ROWS = [
  'rate-limit failover',
  'billing-cap guard',
  'one tool, not three',
  'asks before big fixes',
  'works in every client',
]
const DRAW_AT = (i) => 0.3 + i * 0.06        // row slides in
const STAMP_AT = (i) => 1.35 + i * 0.92      // ✗ lands, row lights, camera tracks
const CHECK_AT = (i) => 6.95 + i * 0.36      // ✓ cascade down the us column
const TRACK_END = STAMP_AT(4) + 0.7
const PULL_END = TRACK_END + 0.9
const PUNCH_AT = 9.5
const CUT_T = 11.7

export const comparedSpot = {
  dur: 14.7,
  audit: {
    settles: [],
    // true zoom-1 rests — the tracking pass (1.35–TRACK_END) is a move
    wideWindows: [[0.0, 1.3], [PULL_END, 11.5]],
    cutT: CUT_T,
    lines: [
      { at: PUNCH_AT, cps: 26, text: 'five for five.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.4 },
    ],
    beats: [0.45, 1.5, 2.4, 3.3, 4.2, 5.1, 6.4, 7.4, 8.2, 9.8, 11.9, 13.4],
  },
  dom: () => `
    <style>
      .ad-player[data-ratio='16:9'] .cmp-fig { left: 190px; top: 74px; width: 900px; padding: 30px 44px 32px; }
      .ad-player[data-ratio='1:1'] .cmp-fig { left: 110px; top: 140px; width: 780px; padding: 28px 40px 30px; }
      .ad-player[data-ratio='9:16'] .cmp-fig { left: 34px; top: 300px; width: 652px; padding: 24px 30px 26px; }
      .cmp-fig { font-size: 21px; }
      .ad-player[data-ratio='9:16'] .cmp-fig { font-size: 17px; }
      .cmp-grid { display: grid; gap: 7px; }
      .cmp-row, .cmp-hrow { display: grid; grid-template-columns: 1fr 9em 9em; align-items: center; }
      .cmp-hrow { padding: 0 16px 10px; color: var(--muted); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; }
      .cmp-h.them { text-align: center; }
      .cmp-h.us { text-align: center; color: var(--accent); }
      .cmp-row { height: 58px; padding: 0 18px; border-radius: 10px; background: color-mix(in srgb, var(--fg) 4%, transparent); opacity: 0; }
      .cmp-row.lit { background: color-mix(in srgb, var(--fg) 9%, transparent); }
      .cmp-feat { color: var(--fg); }
      .cmp-m { text-align: center; height: 100%; display: grid; place-items: center; font-style: normal; font-weight: 700; }
      .cmp-x { color: #d98d76; }
      .cmp-c { color: var(--accent); text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent); }
    </style>
    <figure class="ad-fig cmp-fig">
      <figcaption class="cap"><b>capability by capability</b><span>other agents · superbot</span></figcaption>
      <div class="cmp-grid">
        <div class="cmp-hrow"><span></span><span class="cmp-h them">other agents</span><span class="cmp-h us">superbot</span></div>
        ${ROWS.map((r, i) => `
        <div class="cmp-row" data-i="${i}">
          <span class="cmp-feat">${r}</span>
          <span class="cmp-m cmp-x"><i data-stamp="${i}">✗</i></span>
          <span class="cmp-m cmp-c"><i data-check="${i}">✓</i></span>
        </div>`).join('')}
      </div>
      <p class="ad-punchline cmp-punch"><span class="type" data-type="punch"></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      rows: [...p.cam.querySelectorAll('.cmp-row')],
      stamps: [...p.cam.querySelectorAll('[data-stamp]')].map((el) => ({ el })),
      checks: [...p.cam.querySelectorAll('[data-check]')].map((el) => ({ el })),
      typer: {
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.cmp-punch'),
    })

    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // rows: staggered slide-up, then the stamp lights them
    P.rows.forEach((row, i) => {
      const k = easeOutExpo(clamp01((t - DRAW_AT(i)) / 0.55))
      row.style.opacity = String(k)
      row.style.transform = `translateY(${(1 - k) * 14}px)`
      row.classList.toggle('lit', t >= STAMP_AT(i))
    })

    // ✗ stamps land like a rubber stamp: overshoot 1.5 → 1
    P.stamps.forEach(({ el }, i) => {
      const on = t >= STAMP_AT(i)
      const k = easeOutExpo(clamp01((t - STAMP_AT(i)) / 0.32))
      const s = on ? 1.5 - 0.5 * k : 1.5
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `scale(${s.toFixed(3)})`
    })

    // ✓ cascade: quick, confident, slight glow pop
    P.checks.forEach(({ el }, i) => {
      const on = t >= CHECK_AT(i)
      const k = easeOutExpo(clamp01((t - CHECK_AT(i)) / 0.3))
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `scale(${(on ? 0.6 + 0.4 * k : 0.6).toFixed(3)})`
    })

    // camera: draw wide → track the stamps down the table → pull back
    // wide for the cascade and the punchline
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= STAMP_AT(0) && t < TRACK_END) {
      const k = easeStd(clamp01((t - STAMP_AT(0)) / (TRACK_END - STAMP_AT(0))))
      const a = P.rows[0], b = P.rows[P.rows.length - 1]
      py = lerpY(a, b, k, p.cam) - 6
      px = p.W / 2
      z = 1.22
    } else if (t >= TRACK_END && t < PULL_END) {
      z = 1.18 + (1 - 1.18) * easeStd(clamp01((t - TRACK_END) / (PULL_END - TRACK_END)))
    }
    p.camTo(z, px, py)

    // punchline + wins card (inline opacity — the shared class transitions
    // on wall-clock time, which the virtual clock would desync)
    P.typer.punch.run(t >= PUNCH_AT, 'five for five.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT ? '1' : '0'

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)

    p.cam.classList.toggle('drawn', t >= 0.4 && t < CUT_T)
    const inCut = Math.abs(t - CUT_T) < 0.05
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}

/* vertical centre of el→b, k of the way, in design coords */
function lerpY(a, b, k, cam) {
  const y = (el) => {
    let yy = 0, n = el
    while (n && n !== cam) { yy += n.offsetTop; n = n.offsetParent }
    return yy + el.offsetHeight / 2
  }
  return y(a) + (y(b) - y(a)) * k
}
