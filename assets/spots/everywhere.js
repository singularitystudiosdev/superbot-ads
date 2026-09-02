/* superbot.gg / ads — the "everywhere" spot.
   Screenlife, cursor as the protagonist: one task (#118), one shared
   progress bar in the card header — chrome that never re-renders — while
   the cursor hops editor → cli → ci tabs and the same task keeps filling
   in all three live client panes. One click on "run in all 3" flips all
   three panes green in the same frame: ubiquity is the payoff.
   Continuity mechanic: the bar + task-id live in the header, outside
   every pane, so the % node is literally the same DOM node across tabs.
   Series rules: ≤42 chars/card, ≥1.5s dwell, SUPERBOT WINS end card.
   All timed state set from tick() inline — no CSS transitions. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

const L1 = { at: 0.7, cps: 22, text: 'same task. every client.', coverAt: 9.9 }
const PAY = { at: 9.9, cps: 28, text: 'never re-explain the task.' }
const CUT_T = 12.4
const GREEN_AT = 9.8        // the panes flip as the bar completes — one gesture
const BAR_DONE = 9.8        // % reads 100
const CLICKS = [1.6, 4.8, 7.3, 9.0]   // editor, cli, ci, run-in-all
// progress: one piecewise ramp, strictly increasing, steepens at each click
const PROG = [[0.9, 0], [1.6, 9], [4.8, 34], [7.3, 58], [9.0, 74], [BAR_DONE, 100]]

// cursor waypoints: [t, x, y] — the three tab pill centres then the run chip,
// all in the tab row so the cursor never crosses pane text. Enters and exits
// top-left so the hand reads different from checks' bottom-right glide
const WAY = [
  [0.0, -80, -80], [1.15, 289, 188], [4.3, 289, 188],
  [4.8, 453, 188], [6.8, 453, 188],
  [7.3, 617, 188], [8.7, 617, 188],
  [9.0, 993, 188], [12.1, 993, 188], [12.6, -80, -80],
]

const PANES = [
  { nm: 'editor', sub: 'src/auth.ts', rows: ['#118 migrate auth', 'session.ts +9 −2', 'tests 12 passing'] },
  { nm: 'cli', sub: '~/proj', rows: ['sb run 118', '3 steps · 0 flags', 'exit 0'] },
  { nm: 'ci · headless', sub: 'runner-3', rows: ['pipeline 118', '47 tasks queued', 'logs streaming'] },
]

export const everywhereSpot = {
  dur: 15.0,
  audit: {
    settles: [],
    wideWindows: [[0.0, 12.3]],
    cutT: CUT_T,
    lines: [
      { at: L1.at, cps: L1.cps, text: L1.text, sel: '[data-type="l1"]', coverAt: L1.coverAt },
      { at: PAY.at, cps: PAY.cps, text: PAY.text, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.7 },
    ],
    beats: [0.9, 1.7, 2.6, 4.9, 5.9, 7.4, 8.2, 9.3, 10.2, 11.4, 12.6, 13.9],
  },
  dom: () => `
    <style>
      .ev-card {
        position: absolute; left: 190px; top: 78px; width: 900px; height: 512px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 24px 26px; box-sizing: border-box;
      }
      .ev-head { display: flex; align-items: baseline; gap: 16px; }
      .ev-head b { font-weight: 500; font-size: 21px; letter-spacing: -0.01em; }
      .ev-task { font: 14px/1.2 var(--font-mono); color: var(--muted); margin-left: auto; white-space: nowrap; }
      .ev-bar { display: flex; align-items: center; gap: 14px; margin-top: 16px; }
      .ev-track { flex: 1; height: 10px; border-radius: 5px; background: var(--raised); position: relative; overflow: hidden; }
      .ev-track .fill { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: 5px; background: var(--accent);
        box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 45%, transparent); }
      .ev-track .mark { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--line); }
      .ev-track .mark.on { background: var(--fg); opacity: 0.55; }
      .ev-pct { width: 56px; text-align: right; font: 700 17px/1 var(--font-mono); color: var(--fg); font-variant-numeric: tabular-nums; }
      .ev-tabs { display: flex; gap: 14px; margin-top: 16px; }
      .ev-tab { position: relative; width: 150px; height: 40px; display: grid; place-items: center;
        font: 15px/1 var(--font-mono); color: var(--muted);
        background: var(--raised); border: 1px solid var(--line); border-radius: 10px; }
      .ev-tab.on { color: var(--fg); border-color: var(--accent); box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 22%, transparent); }
      .ev-tab .tick { position: absolute; right: 7px; top: 5px; font-style: normal; font-size: 12px; color: var(--accent); opacity: 0; }
      .ev-run { margin-left: auto; align-self: center; font: 700 14px/1 var(--font-mono); color: var(--muted);
        border: 1px solid var(--line); border-radius: 10px; padding: 12px 18px; background: var(--raised); }
      .ev-run.on { color: var(--bg); background: var(--accent); border-color: var(--accent);
        box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 45%, transparent); }
      .ev-panes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-top: 18px; }
      .ev-pane { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; opacity: 0.5; min-height: 210px; box-sizing: border-box; }
      .ev-pane.on { opacity: 1; }
      .ev-cap { margin: 0 0 10px; font: 13px/1.2 var(--font-mono); color: var(--accent); letter-spacing: 0.06em; text-transform: uppercase; }
      .ev-cap span { display: block; color: var(--muted); text-transform: none; letter-spacing: 0; margin-top: 4px; font-size: 12px; }
      .ev-row { margin: 0; min-height: 26px; font: 14px/1.7 var(--font-mono); color: var(--fg); opacity: 0; }
      .ev-st { margin: 10px 0 0; font: 700 13px/1.2 var(--font-mono); font-style: normal; height: 18px; }
      .ev-st .sp, .ev-st .ok { font-style: normal; position: absolute; }
      .ev-st { position: relative; }
      .ev-st .sp { color: var(--muted); font-weight: 400; opacity: 0; }
      .ev-st .ok { color: var(--accent); opacity: 0; text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 55%, transparent); }
      .ev-pay { position: absolute; left: 0; right: 0; top: 630px; margin: 0; text-align: center;
        font: 700 21px/1.2 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ev-line { position: absolute; left: 0; right: 0; top: 630px; margin: 0; text-align: center;
        font-size: 19px; color: var(--fg); opacity: 0; }
      .ev-cursor { position: absolute; left: 0; top: 0; width: 26px; height: 26px; opacity: 0; will-change: transform; z-index: 3; }
      .ad-player[data-ratio='9:16'] .ev-card { left: 30px; top: 250px; width: 660px; height: 700px; }
      .ad-player[data-ratio='9:16'] .ev-panes { grid-template-columns: 1fr; }
      .ad-player[data-ratio='9:16'] .ev-pane { min-height: 118px; }
      .ad-player[data-ratio='9:16'] .ev-pane [data-k='2'] { display: none; }
      .ad-player[data-ratio='9:16'] .ev-run { font-size: 12px; padding: 10px 12px; white-space: nowrap; }
      .ad-player[data-ratio='9:16'] .ev-line { top: 990px; }
      .ad-player[data-ratio='9:16'] .ev-pay { top: 1040px; }
      .ad-player[data-ratio='1:1'] .ev-card { left: 90px; top: 110px; width: 820px; height: 560px; }
      .ad-player[data-ratio='1:1'] .ev-line { top: 700px; }
      .ad-player[data-ratio='1:1'] .ev-pay { top: 740px; }
    </style>
    <div class="ev-card">
      <div class="ev-head"><b>superbot · every client</b><span class="ev-task">#118 · migrate auth to v3</span></div>
      <div class="ev-bar"><span class="ev-track"><i class="fill" data-fill></i>
        <i class="mark" data-mark="25" style="left:25%"></i><i class="mark" data-mark="50" style="left:50%"></i><i class="mark" data-mark="75" style="left:75%"></i></span>
        <span class="ev-pct" data-pct>0%</span></div>
      <div class="ev-tabs">
        ${['editor', 'cli', 'ci'].map((nm, i) => `<span class="ev-tab" data-tab="${i}">${nm}<i class="tick" data-tick="${i}">✓</i></span>`).join('')}
        <span class="ev-run" data-run>run in all 3</span>
      </div>
      <div class="ev-panes">
        ${PANES.map((pn, i) => `
        <div class="ev-pane" data-pane="${i}">
          <p class="ev-cap">${pn.nm}<span>${pn.sub}</span></p>
          ${pn.rows.map((r, k) => `<p class="ev-row" data-row="${i}-${k}" data-k="${k}">${r}</p>`).join('')}
          <p class="ev-st"><i class="sp" data-spin="${i}">◠ running</i><i class="ok" data-ok="${i}">✓ done · 3.2s</i></p>
        </div>`).join('')}
      </div>
    </div>
    <p class="ev-line"><span class="type" data-type="l1"></span></p>
    <p class="ev-pay"><span class="type" data-type="pay"></span></p>
    <div class="ev-cursor" data-cursor>
      <svg width="26" height="26" viewBox="0 0 24 24">
        <path d="M5 2.5 L18.5 13.2 L11.8 13.9 L15.2 20.6 L12.5 21.9 L9.2 15.2 L5 19.2 Z"
          fill="var(--fg, #fff)" stroke="var(--bg, #111)" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      tabs: [...p.cam.querySelectorAll('[data-tab]')],
      ticks: [...p.cam.querySelectorAll('[data-tick]')],
      panes: [...p.cam.querySelectorAll('[data-pane]')],
      rows: [...p.cam.querySelectorAll('[data-row]')],
      spins: [...p.cam.querySelectorAll('[data-spin]')],
      oks: [...p.cam.querySelectorAll('[data-ok]')],
      fill: p.cam.querySelector('[data-fill]'),
      marks: [...p.cam.querySelectorAll('[data-mark]')],
      pct: p.cam.querySelector('[data-pct]'),
      run: p.cam.querySelector('[data-run]'),
      cursor: p.cam.querySelector('[data-cursor]'),
      line: p.cam.querySelector('.ev-line'),
      typer: {
        l1: new Typer(p.cam.querySelector('[data-type="l1"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      pay: p.cam.querySelector('.ev-pay'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // one shared progress ramp — the same node fills across every tab switch
    let pct = 0
    for (let i = 0; i < PROG.length - 1; i++) {
      const [t0, v0] = PROG[i], [t1, v1] = PROG[i + 1]
      if (t >= t0) pct = v0 + (v0 === v1 ? 0 : (v1 - v0) * clamp01((t - t0) / (t1 - t0)))
    }
    if (t < PROG[0][0]) pct = 0
    P.fill.style.width = `${pct.toFixed(2)}%`
    P.pct.textContent = `${Math.round(pct)}%`
    P.marks.forEach((m) => m.classList.toggle('on', pct >= Number(m.dataset.mark)))

    // panes light as the cursor clicks them; rows reveal only in lit panes
    P.tabs.forEach((tab, i) => tab.classList.toggle('on', t >= CLICKS[i] && t < GREEN_AT))
    P.panes.forEach((pane, i) => pane.classList.toggle('on', t >= CLICKS[i]))
    P.rows.forEach((row) => {
      const [pi, k] = row.dataset.row.split('-').map(Number)
      const kk = easeOutExpo(clamp01((t - CLICKS[pi] - 0.15 - k * 0.6) / 0.3))
      row.style.opacity = String(t >= CLICKS[pi] + 0.15 + k * 0.6 ? kk : 0)
    })

    // the payoff: all three panes flip green in the same frame, no stagger
    const gk = easeOutExpo(clamp01((t - GREEN_AT) / 0.3))
    P.spins.forEach((el) => { el.style.opacity = t < GREEN_AT && t >= 0.9 ? '1' : '0' })
    P.oks.forEach((el) => {
      el.style.opacity = String(t >= GREEN_AT ? gk : 0)
      el.style.transform = `scale(${(t >= GREEN_AT ? 0.6 + 0.4 * gk : 0.6).toFixed(3)})`
    })
    P.ticks.forEach((el) => { el.style.opacity = String(t >= GREEN_AT ? gk : 0) })
    P.run.classList.toggle('on', t >= 8.6)

    // cursor: glide + press-pulse (same idiom as checks)
    let cx = WAY[0][1], cy = WAY[0][2]
    for (let i = 0; i < WAY.length - 1; i++) {
      const [t0, x0, y0] = WAY[i], [t1, x1, y1] = WAY[i + 1]
      if (t >= t0) {
        const k = easeStd(clamp01((t - t0) / Math.max(0.001, t1 - t0)))
        cx = x0 + (x1 - x0) * k; cy = y0 + (y1 - y0) * k
      }
    }
    let cs = 1
    for (const c of CLICKS) {
      const k = clamp01((t - c) / 0.2)
      if (t >= c && k < 1) cs = 1 - 0.28 * Math.sin(Math.PI * k)
    }
    P.cursor.style.opacity = t < CUT_T ? '1' : '0'
    P.cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) scale(${cs.toFixed(3)})`

    // flat wide until the run-in-all beat, then the checks-style push
    const zk = t < 9.4 ? 0 : easeStd(clamp01((t - 9.4) / 1.2))
    p.camTo(1 + 0.05 * zk, p.W / 2, p.H / 2)

    // card line + punchline + wins card
    P.typer.l1.run(t >= L1.at, L1.text, L1.cps, t - L1.at)
    P.line.style.opacity = t >= L1.at && t < L1.coverAt ? '1' : '0'
    P.typer.pay.run(t >= PAY.at, PAY.text, PAY.cps, t - PAY.at)
    P.pay.style.opacity = t >= PAY.at ? '1' : '0'
    P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('wins', t >= CUT_T)

    const inCut = Math.abs(t - CUT_T) < 0.07
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}
