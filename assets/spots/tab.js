/* superbot.gg / ads — the "tab" spot.
   The style switch for this batch: the whole ad IS an editor window —
   tab bar, line numbers, cursor — because autocomplete is the one screen
   every dev already knows how to read. Beat one: "them" types the fix by
   hand while a sped-up clock races to 41s, stalls mid-line, backspaces.
   Beat two: superbot's ghost text fills the rest of the line in grey, a
   tab keycap pops at the cursor, and the fix solidifies in one keystroke
   — clock: 2.1s. No stamps, no charts, no lanes: a deliberate
   counter-signal to the rest of the series. ~11s. All timed state from
   tick() inline — no CSS transitions. */

import { easeOutExpo, easeStd, Typer } from '../engine.js'

const CONTEXT = 'function retry(task) {'
const SOLID = '  o.attempts = '
const GHOST_TAIL = 'task.attempts + 1'
const THEM_OUT = 2.7
const US_AT = 3.1
const GHOST_AT = 3.35
const TAB_AT = 3.95
const PUNCH_AT = 4.6
const CUT_T = 7.8

export const tabSpot = {
  dur: 10.8,
  audit: {
    settles: [],
    wideWindows: [[0.0, 0.2], [US_AT + 0.7, 7.5]],
    cutT: CUT_T,
    lines: [
      { at: US_AT + 0.25, cps: 400, text: 'superbot · 2.1s', sel: '[data-type="us-clock"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'type less. ship more.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 10.5 },
    ],
    beats: [0.4, 1.0, 1.8, 2.4, 3.0, 3.6, 4.2, 5.0, 6.2, 8.0, 9.4],
  },
  dom: () => `
    <style>
      .t-cap { position: absolute; left: 0; right: 0; top: 84px; text-align: center; }
      .t-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .t-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .t-ed {
        position: absolute; left: 190px; right: 190px; top: 190px; height: 360px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        overflow: hidden; opacity: 0;
      }
      .t-bar { display: flex; align-items: center; height: 44px; border-bottom: 1px solid var(--line); padding: 0 14px; gap: 8px; }
      .t-tab { padding: 9px 14px; border-radius: 8px; font: 500 14px/1 var(--font-mono); color: var(--fg);
        background: color-mix(in srgb, var(--fg) 7%, transparent); }
      .t-tab i { font-style: normal; color: var(--muted); margin-left: 7px; }
      .t-clock { margin-left: auto; font: 700 15px/1 var(--font-mono); color: #d98d76; }
      .t-clock.us { color: var(--accent); display: none; }
      .t-body { display: flex; padding: 20px 0; font: 500 20px/2.2 var(--font-mono); }
      .t-ln { width: 60px; text-align: right; padding-right: 20px; color: color-mix(in srgb, var(--muted) 60%, transparent); user-select: none; }
      .t-code { flex: 1; }
      .t-code .row { white-space: pre; }
      .t-code .row { min-height: 44px; }
      .t-ghost { color: color-mix(in srgb, var(--fg) 36%, transparent); }
      .t-caret { display: inline-block; width: 10px; height: 24px; background: var(--accent);
        vertical-align: -3px; margin-left: 1px; }
      .t-key {
        display: inline-block; margin-left: 14px; padding: 7px 15px; border-radius: 9px; opacity: 0;
        background: var(--bg); border: 1px solid var(--accent); color: var(--fg);
        font: 700 14px/1 var(--font-mono); letter-spacing: 0.08em; vertical-align: 2px;
        box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 38%, transparent), 0 3px 0 0 color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .t-punch { position: absolute; left: 0; right: 0; top: 610px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .t-cap { top: 220px; }
      .ad-player[data-ratio='9:16'] .t-ed { left: 30px; right: 30px; top: 330px; height: 430px; }
      .ad-player[data-ratio='9:16'] .t-body { font-size: 15px; }
      .ad-player[data-ratio='9:16'] .t-punch { top: 840px; }
      .ad-player[data-ratio='1:1'] .t-ed { left: 130px; right: 130px; top: 240px; height: 400px; }
      .ad-player[data-ratio='1:1'] .t-punch { top: 710px; }
    </style>
    <p class="t-cap"><b>the same fix, twice</b><span>retry.ts · typed by hand vs tab</span></p>
    <div class="t-ed">
      <div class="t-bar">
        <span class="t-tab">retry.ts<i>×</i></span>
        <span class="t-clock"><span data-them-clock>them · 0.0s</span></span>
        <span class="t-clock us" data-usclock><span class="type" data-type="us-clock"></span></span>
      </div>
      <div class="t-body">
        <div class="t-ln">1<br>2<br>3</div>
        <div class="t-code">
          <div class="row"><span>${CONTEXT}</span></div>
          <div class="row" data-l2><span data-solid></span><span class="t-ghost" data-ghost></span><span class="t-caret" data-caret></span><span class="t-key" data-key>tab ⇥</span></div>
        </div>
      </div>
    </div>
    <p class="t-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      ed: p.cam.querySelector('.t-ed'),
      themClock: p.cam.querySelector('[data-them-clock]'),
      usClock: p.cam.querySelector('[data-usclock]'),
      solid: p.cam.querySelector('[data-solid]'),
      ghost: p.cam.querySelector('[data-ghost]'),
      caret: p.cam.querySelector('[data-caret]'),
      key: p.cam.querySelector('[data-key]'),
      typer: {
        usClock: new Typer(p.cam.querySelector('[data-type="us-clock"]')),
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.t-punch'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // editor draws once
    const ek = easeOutExpo(clamp01((t - 0.15) / 0.4))
    P.ed.style.opacity = String(ek)
    P.ed.style.transform = `translateY(${((1 - ek) * 16).toFixed(1)}px)`

    const them = t < THEM_OUT
    P.usClock.style.display = them ? 'none' : 'inline-block'
    P.themClock.parentElement.style.display = them ? 'inline-block' : 'none'
    if (them) {
      // hand-typing against a sped-up clock: fast, stall, backspace churn
      let n
      if (t < 1.3) n = Math.floor(Math.max(0, t - 0.5) * 20)
      else if (t < 1.7) n = Math.max(0, 16 - Math.floor((t - 1.3) * 30))
      else n = Math.min(SOLID.length, 16 + Math.floor((t - 1.7) * 20))
      P.solid.textContent = SOLID.slice(0, Math.max(0, n))
      P.ghost.textContent = ''
      P.caret.style.opacity = t % 0.8 < 0.45 ? '1' : '0'
      P.key.style.opacity = '0'
      P.themClock.textContent = `them · ${Math.min(41.2, Math.max(0, (t - 0.5) * 20)).toFixed(1)}s`
    } else {
      // the ghost beat: grey suggestion fills the tail, tab solidifies it
      const accepted = t >= TAB_AT
      const gk = easeStd(clamp01((t - GHOST_AT) / 0.35))
      P.solid.textContent = SOLID
      P.ghost.textContent = accepted ? '' : GHOST_TAIL.slice(0, Math.ceil(GHOST_TAIL.length * gk))
      if (accepted) P.solid.textContent = SOLID + GHOST_TAIL
      P.caret.style.opacity = accepted ? '0' : '1'
      const kk = easeOutExpo(clamp01((t - TAB_AT) / 0.28))
      P.key.style.opacity = String(kk * (t < TAB_AT + 1.0 ? 1 : Math.max(0, 1 - (t - TAB_AT - 1.0) * 2)))
    }
    P.typer.usClock.run(t >= US_AT + 0.25, 'superbot · 2.1s', 400, t - US_AT - 0.25)

    P.typer.punch.run(t >= PUNCH_AT, 'type less. ship more.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → lean on the stalling line → soft pop on the accept
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 1.2 && t < 2.5) { z = 1 + 0.18 * easeStd(clamp01((t - 1.2) / 0.6)); px = p.W / 2; py = 350 }
    else if (t >= 2.5 && t < 3.1) { z = 1.22 + (1 - 1.22) * easeStd(clamp01((t - 2.5) / 0.6)) }
    else if (t >= TAB_AT && t < TAB_AT + 0.8) {
      z = 1 + 0.08 * Math.sin(Math.PI * clamp01((t - TAB_AT) / 0.8)); px = p.W / 2; py = 340
    }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
