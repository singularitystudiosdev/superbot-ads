/* superbot.gg / ads — the "tooling" spot.
   One message: one MCP wires itself into every coding app, nothing to
   configure — "the last MCP you'll ever need" (site copy, verbatim).
   Visual: the superbot node draws a trunk + stubs into three app tiles.
   Series rules: ≤42 chars/card, ≥1.5s full-text dwell, end card held. */

import { SpotPlayer, easeOutExpo, easeStd, Typer } from '../engine.js'

const L1 = { at: 0.6, cps: 20, text: 'one mcp. every app.', coverAt: 7.0 }
const L2 = { at: 7.0, cps: 20, text: 'nothing to configure.', coverAt: 10.0 }
const PAY = { at: 10.0, cps: 24, text: "the last MCP you'll ever need.", coverAt: 12.9 }
const CUT_T = 12.9
const APPS = ['claude code', 'cursor', 'codex']

export const toolingSpot = {
  dur: 16.1,
  audit: {
    settles: [],
    wideWindows: [[0.0, 9.9], [10.4, 12.8]],
    cutT: CUT_T,
    lines: [
      { at: L1.at, cps: L1.cps, text: L1.text, sel: '[data-type="l1"]', coverAt: L1.coverAt },
      { at: L2.at, cps: L2.cps, text: 'nothing to configure.', sel: '[data-type="l2"]', coverAt: L2.coverAt },
      { at: PAY.at, cps: PAY.cps, text: PAY.text, sel: '[data-type="pay"]', coverAt: PAY.coverAt },
      { at: 13.0, cps: 22, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 15.4 },
    ],
    beats: [1.5, 3.0, 7.5, 10.8, 13.4, 15.4],
  },
  dom: () => `
    <div class="ad-mcp">
      <p class="m-line l1"><span class="type" data-type="l1"></span></p>
      <p class="m-line l2"><span class="type" data-type="l2"></span></p>
      <div class="y-node">superbot<span class="gg">.gg</span></div>
      <div class="y-trunk"></div>
      ${APPS.map((a, i) => `
        <div class="y-app" data-app="${i}"><span class="y-stub"></span><span class="y-tile">${a}</span></div>`).join('')}
      <p class="y-pay"><span class="type" data-type="pay"></span></p>
    </div>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      typer: {
        l1: new Typer(p.cam.querySelector('[data-type="l1"]')),
        l2: new Typer(p.cam.querySelector('[data-type="l2"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      apps: [...p.cam.querySelectorAll('.y-app')],
      trunk: p.cam.querySelector('.y-trunk'),
    })

    // trunk grows, stubs fire staggered, tiles light as their wire lands
    P.trunk.style.transform = `scaleY(${Math.min(1, Math.max(0, (t - 0.8) / 1.4)).toFixed(3)})`
    P.apps = P.apps || P.trunk.parentElement.querySelectorAll('.y-app')
    P.apps.forEach((app, i) => {
      const k = Math.min(1, Math.max(0, (t - (1.3 + i * 0.5)) / 0.4))
      app.style.setProperty('--w', k.toFixed(3))
      app.classList.toggle('on', k >= 1)
    })

    // gentle push on the payoff
    const k = t < PAY.at ? 0 : Math.min(1, (t - PAY.at) / 0.7)
    p.camTo(1 + 0.05 * easeStd(k), p.W / 2, p.H / 2)

    P.typer.l1.run(t >= L1.at, L1.text, L1.cps, t - L1.at)
    P.typer.l2.run(t >= L2.at, L2.text, L2.cps, t - L2.at)
    P.typer.pay.run(t >= PAY.at, PAY.text, PAY.cps, t - PAY.at)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 22, t - CUT_T - 0.1)
  },
}
