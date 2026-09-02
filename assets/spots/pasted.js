/* superbot.gg / ads — the "pasted" spot.
   Reskin of Loom's industry-defining marketing device: the product demo
   IS the ad. A chat transcript, live — the site's verbatim line gets
   pasted to a coding agent, the agent replies "on it.", three client
   chips light up ✓, and the punchline lands: your agent just installed
   your agent. One message: the install is agent-native.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const U1A = { at: 0.6, cps: 30, text: 'install the superbot mcp server globally' }
const U1B = { at: 2.2, cps: 30, text: 'https://xdxdxd.dsh.sh/mcp' }
const A1 = { at: 4.6, cps: 26, text: 'on it.' }
const A2 = { at: 7.4, cps: 26, text: 'wired into every client on this machine.' }
const PAY = { at: 11.4, cps: 24, text: 'your agent just installed your agent.' }
const CHIP_AT = [5.4, 6.0, 6.6]
const CUT_T = 14.6
const dur = 16.9

export const pastedSpot = {
  dur,
  audit: {
    settles: [],
    wideWindows: [[0.0, dur]],
    cutT: CUT_T,
    lines: [
      { ...U1A, sel: '[data-type="u1a"]', coverAt: A1.at },
      { ...U1B, sel: '[data-type="u1b"]', coverAt: A1.at },
      { ...A1, sel: '[data-type="a1"]', coverAt: A2.at },
      { ...A2, sel: '[data-type="a2"]', coverAt: PAY.at },
      { ...PAY, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 30, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: dur - 0.1 },
    ],
    beats: [1.2, 2.8, 3.6, 5.0, 5.7, 6.3, 7.0, 8.2, 9.6, 11.8, 13.2, 14.9, 16.1],
  },
  dom: () => `
    <style>
      .pa-chat { position: absolute; left: 240px; top: 110px; width: 800px; box-sizing: border-box;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 30px 38px 26px; }
      .pa-row { display: flex; gap: 16px; margin: 0 0 24px; align-items: flex-start; opacity: 0; }
      .pa-who { font: 13px/1.6 var(--font-mono); color: var(--muted); min-width: 46px; padding-top: 6px;
        letter-spacing: 0.08em; }
      .pa-msg { font: 500 23px/1.5 var(--font-mono); color: var(--fg); min-height: 34px; }
      .pa-msg .url { color: var(--muted); }
      .pa-row.agent .pa-msg { color: var(--accent); }
      .pa-chips { display: flex; gap: 12px; margin: 0 0 24px 62px; }
      .pa-chip { font: 16px/1 var(--font-mono); color: var(--muted); border: 1px solid var(--line);
        border-radius: 20px; padding: 9px 18px; opacity: 0; }
      .pa-chip.on { color: var(--accent); border-color: var(--accent);
        box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 25%, transparent); }
      .pa-pay { position: absolute; left: 0; right: 0; top: 614px; margin: 0; text-align: center;
        font: 700 32px/1.3 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ad-player[data-ratio='1:1'] .pa-chat { left: 120px; top: 190px; width: 760px; }
      .ad-player[data-ratio='1:1'] .pa-pay { top: 820px; }
      .ad-player[data-ratio='9:16'] .pa-chat { left: 40px; top: 300px; width: 640px; padding: 26px 30px 22px; }
      .ad-player[data-ratio='9:16'] .pa-msg { font-size: 19px; min-height: 29px; }
      .ad-player[data-ratio='9:16'] .pa-chip { font-size: 14px; padding: 8px 14px; }
      .ad-player[data-ratio='9:16'] .pa-chips { margin-left: 0; }
      .ad-player[data-ratio='9:16'] .pa-pay { top: 1105px; font-size: 27px; }
    </style>
    <div class="pa-chat">
      <p class="pa-row" data-row="0">
        <span class="pa-who">you</span>
        <span class="pa-msg"><span class="type" data-type="u1a"></span><br>
          <span class="url"><span class="type" data-type="u1b"></span></span></span>
      </p>
      <p class="pa-row agent" data-row="1">
        <span class="pa-who">agent</span>
        <span class="pa-msg"><span class="type" data-type="a1"></span></span>
      </p>
      <div class="pa-chips">
        <span class="pa-chip">cursor <b>✓</b></span>
        <span class="pa-chip">claude <b>✓</b></span>
        <span class="pa-chip">codex <b>✓</b></span>
      </div>
      <p class="pa-row agent" data-row="2">
        <span class="pa-who">agent</span>
        <span class="pa-msg"><span class="type" data-type="a2"></span></span>
      </p>
    </div>
    <p class="pa-pay"><span class="type" data-type="pay"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      rows: [...p.cam.querySelectorAll('.pa-row')],
      chips: [...p.cam.querySelectorAll('.pa-chip')],
      pay: p.cam.querySelector('.pa-pay'),
      typer: {
        u1a: new Typer(p.cam.querySelector('[data-type="u1a"]')),
        u1b: new Typer(p.cam.querySelector('[data-type="u1b"]')),
        a1: new Typer(p.cam.querySelector('[data-type="a1"]')),
        a2: new Typer(p.cam.querySelector('[data-type="a2"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))
    const line = (spec, typer) => {
      const on = t >= spec.at
      typer.run(on, spec.text, spec.cps, t - spec.at)
      return on
    }

    // the paste, the reply, the confirmation
    const rowFade = (el, at) => {
      const k = easeOutExpo(clamp01((t - at) / 0.3))
      el.style.opacity = String(t >= at ? k : 0)
      el.style.transform = `translateY(${((1 - k) * 6).toFixed(1)}px)`
    }
    rowFade(P.rows[0], U1A.at)
    line(U1A, P.typer.u1a)
    line(U1B, P.typer.u1b)
    rowFade(P.rows[1], A1.at)
    line(A1, P.typer.a1)
    CHIP_AT.forEach((at, i) => {
      const on = t >= at
      const k = easeOutExpo(clamp01((t - at) / 0.25))
      P.chips[i].classList.toggle('on', on)
      P.chips[i].style.opacity = String(on ? k : 0)
    })
    rowFade(P.rows[2], A2.at)
    line(A2, P.typer.a2)

    // payoff, then the cut
    const payOn = t >= PAY.at
    P.pay.style.opacity = payOn && t < CUT_T ? '1' : '0'
    line(PAY, P.typer.pay)

    // camera: the same shallow centred push
    const z = 1 + 0.05 * easeOutExpo(clamp01(t / 9))
    p.camTo(z, p.W / 2, p.H / 2)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 30, t - CUT_T - 0.1)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
