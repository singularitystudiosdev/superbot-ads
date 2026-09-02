/* superbot.gg / ads — the "diff" spot.
   The pull-request review, the one screen every dev reads daily, staged
   as the comparison itself: the other agents fix one bug by rewriting the
   block (+5 −5 of churn), superbot fixes it with one line (+1 −1). The
   diff IS the argument — no chart, no odometer, no terminal. Deliberate
   counter-signal to the rest of the series: pure IDE idiom, minimal text,
   ~10s flat. All timed state from tick() inline — no CSS transitions. */

import { easeInQuad, easeOutExpo, easeStd, Typer } from '../engine.js'

const THEM_LINES = [
  ['-   const o = { ...task }', '+   const o: Partial<Task> = { ...task }'],
  ['-   o.headers = { ...task.headers }', '+   o.headers = assign(o.headers, {'],
  ['-   })', '+     \'x-retry\': \'1\','],
  ['-   if (task.meta != null) {', '+   if (task.meta != null && task.meta) {'],
  ['-     o.meta = { ...task.meta }', '+     o.meta = { ...task.meta } as Record<string, unknown>'],
]
const US_LINES = [
  ['-   if (task.meta != null) {', '+   if (task.meta) {'],
]
const THEM_AT = 0.4
const LINE_AT = (i) => 0.6 + i * 0.07
const SWAP_AT = 3.3
const US_AT = 3.6
const US_LINE_AT = (i) => US_AT + 0.25 + i * 0.14
const PUNCH_AT = 4.7
const CUT_T = 7.2

export const diffSpot = {
  dur: 10.2,
  audit: {
    settles: [],
    wideWindows: [[0.0, 0.4], [US_AT + 0.7, 7.0]],
    cutT: CUT_T,
    lines: [
      { at: US_AT + 0.5, cps: 26, text: '+1 −1 · one line', sel: '[data-type="us-stat"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 28, text: 'one line would’ve done it.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 9.9 },
    ],
    beats: [0.5, 1.0, 1.6, 2.4, 3.2, 3.8, 4.3, 5.2, 6.4, 7.4, 8.6],
  },
  dom: () => `
    <style>
      .d-cap { position: absolute; left: 0; right: 0; top: 96px; text-align: center; }
      .d-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .d-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .d-card {
        position: absolute; left: 220px; right: 220px; padding: 18px 22px 20px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        font: 500 15px/1.9 var(--font-mono);
      }
      .d-card.them { top: 190px; }
      .d-card.us { top: 190px; }
      .d-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
      .d-head b { font-weight: 500; font-size: 18px; }
      .d-card.them .d-head b { color: #d98d76; }
      .d-card.us .d-head b { color: var(--accent); }
      .d-stat { font: 700 14px/1.2 var(--font-mono); color: var(--muted); }
      .d-stat .add { color: var(--accent); }
      .d-stat .del { color: #d98d76; }
      .d-line { margin: 0; padding: 0 10px; border-radius: 4px; opacity: 0; white-space: nowrap; overflow: hidden; }
      .d-line.del { background: color-mix(in srgb, #d98d76 14%, transparent); color: #d98d76; }
      .d-line.add { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
      .d-line span { opacity: 0.55; margin-right: 10px; }
      .d-punch { position: absolute; left: 0; right: 0; top: 560px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .d-cap { top: 220px; }
      .ad-player[data-ratio='9:16'] .d-card { left: 34px; right: 34px; top: 330px; font-size: 13px; }
      .ad-player[data-ratio='9:16'] .d-punch { top: 700px; }
      .ad-player[data-ratio='1:1'] .d-card { left: 130px; right: 130px; top: 210px; }
      .ad-player[data-ratio='1:1'] .d-punch { top: 640px; }
    </style>
    <p class="d-cap"><b>the fix, reviewed</b><span>same bug · two pull requests</span></p>
    <div class="d-card them" data-them>
      <div class="d-head"><b>other agents · pr #482</b>
        <span class="d-stat"><span class="type" data-type="them-stat"></span></span></div>
      ${THEM_LINES.map((l, i) => `
      <p class="d-line del" data-them-line="${i}"><span>-</span>${l[0]}</p>
      <p class="d-line add" data-them-line-a="${i}"><span>+</span>${l[1]}</p>`).join('')}
    </div>
    <div class="d-card us" data-us>
      <div class="d-head"><b>superbot · pr #482</b>
        <span class="d-stat"><span class="type" data-type="us-stat"></span></span></div>
      ${US_LINES.map((l, i) => `
      <p class="d-line del" data-us-line="${i}"><span>-</span>${l[0]}</p>
      <p class="d-line add" data-us-line-a="${i}"><span>+</span>${l[1]}</p>`).join('')}
    </div>
    <p class="d-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      themCard: p.cam.querySelector('[data-them]'),
      usCard: p.cam.querySelector('[data-us]'),
      themLines: [...p.cam.querySelectorAll('[data-them-line], [data-them-line-a]')],
      usLines: [...p.cam.querySelectorAll('[data-us-line], [data-us-line-a]')],
      typer: {
        themStat: new Typer(p.cam.querySelector('[data-type="them-stat"]')),
        usStat: new Typer(p.cam.querySelector('[data-type="us-stat"]')),
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.d-punch'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // their PR: the churn stamps in fast, line by line
    P.themLines.forEach((el, i) => {
      const on = t >= LINE_AT(i)
      const k = easeOutExpo(clamp01((t - LINE_AT(i)) / 0.16))
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `translateX(${((1 - k) * -8).toFixed(1)}px)`
    })
    P.typer.themStat.run(t >= 1.5, '+5 −5', 26, t - 1.5)

    // the swap: churn card leaves upward, one-line card takes its place
    const tk = easeInQuad(clamp01((t - SWAP_AT) / 0.4))
    P.themCard.style.opacity = String(1 - tk)
    P.themCard.style.transform = `translateY(${(-60 * tk).toFixed(1)}px)`
    const uk = easeOutExpo(clamp01((t - US_AT) / 0.4))
    P.usCard.style.opacity = String(uk)
    // after the swap the one-liner drifts to vertical centre — the churn
    // card's exit must not leave the bottom half of frame dead
    const drift = (p.H - P.usCard.offsetHeight) / 2 - P.usCard.offsetTop
    P.usCard.style.transform = `translateY(${((1 - uk) * 22 + drift * uk).toFixed(1)}px)`
    P.usLines.forEach((el, i) => {
      const on = t >= US_LINE_AT(i)
      const k = easeOutExpo(clamp01((t - US_LINE_AT(i)) / 0.16))
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `translateX(${((1 - k) * -8).toFixed(1)}px)`
    })
    P.typer.usStat.run(t >= US_AT + 0.5, '+1 −1 · one line', 26, t - US_AT - 0.5)

    P.typer.punch.run(t >= PUNCH_AT, 'one line would’ve done it.', 28, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → lean on the churn → hold on the one-liner
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 1.2 && t < 2.9) { z = 1 + 0.14 * easeStd(clamp01((t - 1.2) / 0.8)); px = p.W / 2; py = 330 }
    else if (t >= 2.9 && t < 3.6) { z = 1.21 + (1 - 1.21) * easeStd(clamp01((t - 2.9) / 0.7)) }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
