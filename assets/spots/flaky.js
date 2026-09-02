/* superbot.gg / ads — the "flaky" spot.
   The test-runner idiom, unclaimed in the series: one 16-dot suite, two
   agents. "Them" runs it — one red ✗ — re-runs, and the red MOVES to a
   different test (that relocation is the flakiness, visible in one
   glance) while their header clock burns to +42s. Superbot's run stamps
   green straight across: 41 passed · 9.8s · first try. The dot matrix is
   the argument; no stamps, no charts, no odometer — counter-signal to
   the fleet. All timed state from tick() inline — no CSS transitions. */

import { easeOutExpo, easeStd, Typer } from '../engine.js'

const DOTS = 16
const FAIL_1 = 10   // run 1: test 11 fails
const FAIL_2 = 4    // run 2: a different test fails — the flake
const R1_AT = (i) => 0.7 + i * 0.08
const R1_SUM = 2.0
const FLIP_AT = 3.7     // run 2: old red heals, new red lands
const R2_SUM = 4.6
const SWAP_AT = 6.3
const US_AT = (i) => 6.5 + i * 0.07
const US_SUM = 7.7
const PUNCH_AT = 8.4
const CUT_T = 11.3

export const flakySpot = {
  dur: 13.7,
  audit: {
    settles: [],
    wideWindows: [[0.0, 0.5], [SWAP_AT + 0.4, 11.0]],
    cutT: CUT_T,
    lines: [
      // their run's summary alternates with the run label (one shared
      // typer), so its dwell is tick-driven rather than spec'd here
      { at: US_SUM, cps: 26, text: '41 passed · 9.8s · first try', sel: '[data-type="us-sum"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'green on the first run.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 13.7 },
    ],
    beats: [0.5, 1.2, 2.1, 3.0, 3.9, 4.8, 5.6, 6.5, 7.3, 7.9, 8.7, 11.5, 12.4],
  },
  dom: () => `
    <style>
      .fk-cap { position: absolute; left: 0; right: 0; top: 84px; text-align: center; }
      .fk-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .fk-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .fk-run {
        position: absolute; left: 230px; right: 230px; padding: 18px 26px 16px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px; opacity: 0;
      }
      .fk-run.them { top: 172px; }
      .fk-run.us { top: 400px; }
      .fk-head { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .fk-head b { font-weight: 500; font-size: 16px; }
      .fk-run.them .fk-head b { color: #d98d76; }
      .fk-run.us .fk-head b { color: var(--accent); }
      .fk-head .t { color: var(--muted); font-size: 14px; }
      .fk-dots { display: flex; gap: 9px; justify-content: center; padding: 4px 0; }
      .fk-dot { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        font: 700 13px/1 var(--font-mono); opacity: 0; }
      .fk-dot-g { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); }
      .fk-dot-r { background: color-mix(in srgb, #d98d76 26%, transparent); color: #d98d76; }
      .fk-sum { margin: 8px 0 0; text-align: center; min-height: 24px; font-weight: 700; }
      .fk-run.them .fk-sum { color: #d98d76; }
      .fk-run.us .fk-sum { color: var(--accent); }
      .fk-punch { position: absolute; left: 0; right: 0; top: 590px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .fk-cap { top: 240px; }
      .ad-player[data-ratio='9:16'] .fk-run { left: 34px; right: 34px; }
      .ad-player[data-ratio='9:16'] .fk-run.them { top: 400px; }
      .ad-player[data-ratio='9:16'] .fk-run.us { top: 760px; }
      .ad-player[data-ratio='9:16'] .fk-dot { width: 21px; height: 21px; font-size: 11px; gap: 6px; }
      .ad-player[data-ratio='9:16'] .fk-punch { top: 1030px; }
      .ad-player[data-ratio='1:1'] .fk-run { left: 130px; right: 130px; }
      .ad-player[data-ratio='1:1'] .fk-run.them { top: 210px; }
      .ad-player[data-ratio='1:1'] .fk-run.us { top: 420px; }
      .ad-player[data-ratio='1:1'] .fk-punch { top: 690px; }
    </style>
    <p class="fk-cap"><b>the same suite, twice</b><span>16 tests · them vs superbot</span></p>
    <div class="fk-run them" data-rt>
      <div class="fk-head"><b>them · <span data-rlabel>run 1</span></b><span class="t" data-rtime>suite · 16 tests</span></div>
      <div class="fk-dots" data-dotst></div>
      <p class="fk-sum"><span class="type" data-type="r-sum"></span></p>
    </div>
    <div class="fk-run us" data-ru>
      <div class="fk-head"><b>superbot · run 1</b><span class="t">suite · 16 tests</span></div>
      <div class="fk-dots" data-dotsu></div>
      <p class="fk-sum"><span class="type" data-type="us-sum"></span></p>
    </div>
    <p class="fk-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = (() => {
      const grid = (sel) => {
        const holder = p.cam.querySelector(sel)
        const dots = []
        for (let i = 0; i < DOTS; i++) {
          const d = document.createElement('span')
          d.className = 'fk-dot'
          d.textContent = '·'
          holder.appendChild(d)
          dots.push(d)
        }
        return dots
      }
      return {
        rt: p.cam.querySelector('[data-rt]'), ru: p.cam.querySelector('[data-ru]'),
        rlabel: p.cam.querySelector('[data-rlabel]'), rtime: p.cam.querySelector('[data-rtime]'),
        dotst: grid('[data-dotst]'), dotsu: grid('[data-dotsu]'),
        typer: {
          r: new Typer(p.cam.querySelector('[data-type="r-sum"]')),
          us: new Typer(p.cam.querySelector('[data-type="us-sum"]')),
          punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
          wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
        },
        punch: p.cam.querySelector('.fk-punch'),
      }
    })())
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // their run: dots stamp, one red; run 2 heals the old red and the red
    // MOVES — the flake, visible in one glance
    const run2 = t >= FLIP_AT
    P.rt.style.opacity = t >= 0.5 ? '1' : '0'
    P.dotst.forEach((d, i) => {
      const on = t >= R1_AT(i)
      const k = easeOutExpo(clamp01((t - R1_AT(i)) / 0.14))
      let cls = 'fk-dot', ch = '·'
      if (on) {
        if (run2 ? i === FAIL_2 : i === FAIL_1) { cls += ' fk-dot-r'; ch = '✗' }
        else { cls += ' fk-dot-g'; ch = '✓' }
      }
      d.className = cls
      d.textContent = ch
      d.style.opacity = String(on ? k : 0)
    })
    if (P.rlabel.textContent !== (run2 ? 'run 2' : 'run 1'))
      P.rlabel.textContent = run2 ? 'run 2' : 'run 1'
    if (P.rtime.textContent !== (run2 ? '+ 42s of reruns' : 'suite · 16 tests'))
      P.rtime.textContent = run2 ? '+ 42s of reruns' : 'suite · 16 tests'
    P.typer.r.run(t >= (run2 ? R2_SUM : R1_SUM), run2 ? 'different test. still red.' : '1 failed · 2 flaky', 26, t - (run2 ? R2_SUM : R1_SUM))

    // superbot's run: one green cascade, no red, done
    P.ru.style.opacity = t >= SWAP_AT ? '1' : '0'
    P.dotsu.forEach((d, i) => {
      const on = t >= US_AT(i)
      const k = easeOutExpo(clamp01((t - US_AT(i)) / 0.12))
      d.className = on ? 'fk-dot fk-dot-g' : 'fk-dot'
      d.textContent = on ? '✓' : '·'
      d.style.opacity = String(on ? k : 0)
    })
    P.typer.us.run(t >= US_SUM, '41 passed · 9.8s · first try', 26, t - US_SUM)

    P.typer.punch.run(t >= PUNCH_AT, 'green on the first run.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → lean on each red ✗ landing → wide for the cascade
    let z = 1, px = p.W / 2, py = p.H / 2
    const lean = (at) => { z = 1 + 0.1 * Math.sin(Math.PI * clamp01((t - at) / 0.6)); py = p.H > p.W ? 500 : 300 }
    if (t >= R1_AT(FAIL_1) && t < R1_AT(FAIL_1) + 0.6) lean(R1_AT(FAIL_1))
    else if (t >= FLIP_AT && t < FLIP_AT + 0.6) lean(FLIP_AT)
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
