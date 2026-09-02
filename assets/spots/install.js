/* superbot.gg / ads — the "install" spot.
   One message: one line installs superbot into every AI client on the
   machine, and the same line is the update. The hook is the real curl line
   (site copy, verbatim) typing itself in the first seconds.
   Series rules: ≤42 chars/card except the mono command line, ≥1.5s dwell. */

import { SpotPlayer, easeStd, Typer } from '../engine.js'

const CMD = { at: 0.6, cps: 20, text: '$ curl -fsSL https://xdxdxd.dsh.sh/install/bootstrap.sh | sh', coverAt: 7.0 }
const L2 = { at: 7.0, cps: 20, text: 'installed into every client', coverAt: 10.6 }
const PAY = { at: 10.6, cps: 30, text: 're-running it is the update.', coverAt: 13.4 }
const CUT_T = 13.4

export const installSpot = {
  dur: 16.6,
  audit: {
    settles: [],
    wideWindows: [[0.0, 13.3]],
    cutT: CUT_T,
    lines: [
      { at: CMD.at, cps: CMD.cps, text: CMD.text, sel: '[data-type="cmd"]', coverAt: CMD.coverAt, mono: true },
      { at: L2.at, cps: L2.cps, text: 'installed into every client', sel: '[data-type="l2"]', coverAt: L2.coverAt },
      { at: PAY.at, cps: PAY.cps, text: PAY.text, sel: '[data-type="pay"]', coverAt: PAY.coverAt },
      { at: 13.5, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 15.8 },
    ],
    beats: [2.0, 4.5, 7.6, 11.2, 13.8, 15.6],
  },
  dom: () => `
    <figure class="ad-term">
      <figcaption class="cap"><b>install · superbot</b><span>one line · nothing to configure</span></figcaption>
      <p class="term-line cmd"><span class="type" data-type="cmd"></span><span class="caret i-caret"></span></p>
      <p class="term-line fix"><span class="type" data-type="l2"></span></p>
      <p class="term-pay i-pay"><span class="type" data-type="pay"></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      typer: {
        cmd: new Typer(p.cam.querySelector('[data-type="cmd"]')),
        l2: new Typer(p.cam.querySelector('[data-type="l2"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      pay: p.cam.querySelector('.i-pay'),
    })

    // push on the payoff, hold the rest wide
    const k = t < PAY.at ? 0 : Math.min(1, (t - PAY.at) / 0.7)
    p.camTo(1 + 0.05 * easeStd(k), p.W / 2, p.H / 2)

    P.typer.cmd.run(t >= CMD.at, CMD.text, CMD.cps, t - CMD.at)
    P.typer.l2.run(t >= L2.at, L2.text, L2.cps, t - L2.at)
    P.typer.pay.run(t >= PAY.at, PAY.text, PAY.cps, t - PAY.at)
    P.pay.classList.toggle('on', t >= PAY.at)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
  },
}
