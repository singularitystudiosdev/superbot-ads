/* superbot.gg / ads — the "hands-off" spot.
   The before/after split, the oldest trick in product advertising, staged
   as two live terminals: left, "other agents" nag — approve? continue?
   still there? — and the interruption counter rolls up; right, superbot
   just ships, task tick after task tick. The nag panel folds away, the
   winner takes the stage, punchline, hard cut, SUPERBOT WINS end card.
   Site copy behind it: your call / nag me / ask first / hands-off —
   "it asks before the bigger fixes, and just does the rest."
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, easeStd, Typer } from '../engine.js'

const NAGS = [
  { at: 0.9, cps: 26, text: 'continue? (y/n)' },
  { at: 2.0, cps: 26, text: 'approve the diff? (y/n)' },
  { at: 3.3, cps: 26, text: 'still there?' },
  { at: 4.5, cps: 26, text: 'ok to proceed? (y/n)' },
  { at: 5.62, cps: 26, text: 'waiting for approval…' },
]
const TASKS = 12
const TASK_AT = (k) => 1.0 + k * 0.5
const WIPE_AT = 8.0
const WIPE_END = 8.5
const PUNCH_AT = 8.85
const CUT_T = 11.5

export const handsoffSpot = {
  dur: 14.4,
  audit: {
    settles: [],
    wideWindows: [[0.0, 1.0], [WIPE_END, 11.3]],
    cutT: CUT_T,
    lines: [
      ...NAGS.map((n, i) => ({ at: n.at, cps: n.cps, text: n.text, sel: `[data-type="nag${i}"]`, coverAt: WIPE_AT })),
      { at: PUNCH_AT, cps: 24, text: '0 interruptions. same work.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.1 },
    ],
    beats: [0.5, 1.4, 2.4, 3.5, 4.7, 5.9, 7.2, 8.2, 9.6, 10.4, 11.7, 13.2],
  },
  dom: () => `
    <style>
      .h-panel {
        position: absolute; top: 96px; height: 504px; width: 550px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 22px 26px; box-sizing: border-box;
      }
      .h-panel.nags { left: 60px; }
      .h-panel.ships { left: 670px; }
      .h-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
      .h-head b { font-weight: 500; font-size: 22px; letter-spacing: -0.01em; }
      .h-panel.nags .h-head b { color: #d98d76; }
      .h-panel.ships .h-head b { color: var(--accent); }
      .h-cnt { display: inline-flex; align-items: baseline; gap: 8px; font: 15px/1.2 var(--font-mono); color: var(--muted); }
      .h-cnt .n { display: inline-block; height: 1.2em; overflow: hidden; font-weight: 700; font-size: 22px; color: var(--fg); }
      .h-cnt .n i { display: block; font-style: normal; line-height: 1.2; }
      .h-cnt .n .strip { display: block; }
      .h-cnt { white-space: nowrap; }
      .h-body { font: 17px/1.8 var(--font-mono); }
      .h-nag { min-height: 33px; margin: 0; color: #d98d76; }
      .h-nag .prompt { color: var(--muted); font-size: 14px; margin-right: 8px; }
      .h-task { margin: 0; color: var(--fg); opacity: 0; }
      .h-task .ok { color: var(--accent); }
      .h-wipe { position: absolute; top: 100px; bottom: 100px; width: 4px; background: var(--accent);
        box-shadow: 0 0 40px 6px color-mix(in srgb, var(--accent) 40%, transparent); opacity: 0; }
      .h-punch { position: absolute; left: 0; right: 0; top: 640px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .h-panel { top: 330px; height: 560px; width: 320px; padding: 18px 20px; }
      .ad-player[data-ratio='9:16'] .h-head b { font-size: 17px; }
      .ad-player[data-ratio='9:16'] .h-cnt { font-size: 12px; }
      .ad-player[data-ratio='9:16'] .h-cnt .n { font-size: 18px; }
      .ad-player[data-ratio='9:16'] .h-panel.nags { left: 30px; }
      .ad-player[data-ratio='9:16'] .h-panel.ships { left: 370px; }
      .ad-player[data-ratio='9:16'] .h-punch { top: 950px; }
      .ad-player[data-ratio='9:16'] .h-body { font-size: 14px; line-height: 1.8; }
      .ad-player[data-ratio='1:1'] .h-panel { top: 170px; height: 560px; width: 400px; }
      .ad-player[data-ratio='1:1'] .h-panel.nags { left: 90px; }
      .ad-player[data-ratio='1:1'] .h-panel.ships { left: 510px; }
      .ad-player[data-ratio='1:1'] .h-punch { top: 790px; }
    </style>
    <div class="h-panel nags">
      <div class="h-head"><b>other agents</b>
        <span class="h-cnt"><span class="n" data-nag-cnt></span> <span data-nag-label>interruptions</span></span></div>
      <div class="h-body">
        ${NAGS.map((n, i) => `
        <p class="h-nag"><span class="prompt">agent</span><span class="type" data-type="nag${i}"></span></p>`).join('')}
      </div>
    </div>
    <div class="h-panel ships">
      <div class="h-head"><b>superbot</b>
        <span class="h-cnt"><span class="n" data-task-cnt></span> tasks</span></div>
      <div class="h-body">
        ${Array.from({ length: TASKS }, (_, k) => `
        <p class="h-task" data-task="${k}"><span class="ok">✓</span> task ${String(k + 1).padStart(2, '0')} · done</p>`).join('')}
      </div>
    </div>
    <div class="h-wipe"></div>
    <p class="h-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      nagPanel: p.cam.querySelector('.h-panel.nags'),
      ships: p.cam.querySelector('.h-panel.ships'),
      wipe: p.cam.querySelector('.h-wipe'),
      tasks: [...p.cam.querySelectorAll('.h-task')],
      nagCnt: new IntRoll(p.cam.querySelector('[data-nag-cnt]')),
      taskCnt: new IntRoll(p.cam.querySelector('[data-task-cnt]')),
      typer: {
        nags: NAGS.map((_, i) => new Typer(p.cam.querySelector(`[data-type="nag${i}"]`))),
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.h-punch'),
      nagLabel: p.cam.querySelector('[data-nag-label]'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // left: the nags type themselves in, the counter rolls as each starts
    NAGS.forEach((n, i) => P.typer.nags[i].run(t >= n.at, n.text, n.cps, t - n.at))
    const nagN = NAGS.filter((n) => t >= n.at).length
    P.nagCnt.set(nagN)
    if (P.nagLabel) P.nagLabel.textContent = nagN === 1 ? 'interruption' : 'interruptions'

    // right: completions stamp in, counter rolls up
    P.tasks.forEach((el, k) => {
      const on = t >= TASK_AT(k)
      const kk = easeOutExpo(clamp01((t - TASK_AT(k)) / 0.22))
      el.style.opacity = String(on ? kk : 0)
      el.style.transform = `translateY(${((1 - kk) * 6).toFixed(1)}px)`
    })
    P.taskCnt.set(t < TASK_AT(0) ? 0 : Math.min(TASKS, Math.floor((t - TASK_AT(0)) / 0.5) + 1))

    // the wipe: the nag panel folds away, the winner slides left and
    // stretches to take the whole stage
    const wk = easeOutExpo(clamp01((t - WIPE_AT) / 0.45))
    P.nagPanel.style.transformOrigin = 'left center'
    P.nagPanel.style.transform = `scaleX(${(1 - wk).toFixed(3)})`
    P.nagPanel.style.opacity = String(Math.max(0, 1 - wk * 1.45))
    const swk = easeOutExpo(clamp01((t - WIPE_AT - 0.18) / 0.5))
    if (P.shipsW0 === undefined) { P.shipsW0 = P.ships.offsetWidth; P.shipsX0 = P.ships.offsetLeft }
    const margin = P.nagPanel.offsetLeft
    const fullW = p.W - 2 * margin
    P.ships.style.left = `${(P.shipsX0 + (margin - P.shipsX0) * swk).toFixed(1)}px`
    P.ships.style.width = `${(P.shipsW0 + (fullW - P.shipsW0) * swk).toFixed(1)}px`
    P.wipe.style.opacity = t >= WIPE_AT && t < WIPE_END
      ? String(Math.sin(Math.PI * clamp01((t - WIPE_AT) / (WIPE_END - WIPE_AT))).toFixed(3)) : '0'
    P.wipe.style.left = `${margin + (p.W - 2 * margin - 4) * swk}px`

    P.typer.punch.run(t >= PUNCH_AT, '0 interruptions. same work.', 24, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → a shallow centred push-in → back → hold on the winner.
    // any left bias (px < 640) throws the ships panel's tasks counter off
    // the right edge at even modest zoom, so the lean stays centred and
    // shallow — both counters hold the frame through the whole move
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 1.0 && t < 3.2) { z = 1 + 0.08 * easeStd(clamp01((t - 1.0) / 0.8)); px = p.W / 2; py = 340 }
    else if (t >= 3.2 && t < 3.9) { z = 1.22 + (1 - 1.22) * easeStd(clamp01((t - 3.2) / 0.7)) }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}

/* integer roll: an overflow-hidden window with an inner strip of 0..N,
   translated to n — the odometer's mechanical feel for whole-number
   counters. The strip moves inside the window; the window never leaves
   its place in the header. */
class IntRoll {
  constructor(win) {
    this.win = win
    this.n = -1
    this.strip = null
  }
  set(n) {
    if (n === this.n) return
    this.n = n
    if (!this.strip) {
      this.win.innerHTML = `<span class="strip">${Array.from({ length: 25 }, (_, i) => `<i>${i}</i>`).join('')}</span>`
      this.strip = this.win.querySelector('.strip')
    }
    this.strip.style.transform = `translateY(${(-n * 1.2).toFixed(2)}em)`
  }
}
