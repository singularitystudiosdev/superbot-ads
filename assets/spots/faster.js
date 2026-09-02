/* superbot.gg / ads — the "faster" spot.
   One message (hook → payoff → end card): claude rate-limits mid-work,
   superbot fails over to the second account, fixed in 0.4s. No camera
   chart here — the payoff IS the number: a stopwatch odometer that rolls
   up and settles on 0.40, then the SUPERBOT WINS end card.
   Text rules of the series: ≤42 chars per card, ≥1.5s full-text dwell. */

import { SpotPlayer, easeOutExpo, easeStd, Typer, Odometer } from '../engine.js'

// typed status lines: [at, cps, text, coverAt] — coverAt is when the beat
// wipes it; full text must hold ≥1.5s before that
const ERR = { at: 0.5, cps: 18, text: 'claude said: “too many requests”', coverAt: 5.6 }
const FIX = { at: 5.6, cps: 20, text: 'superbot: switched to your second account', coverAt: 9.9 }
const PAY_AT = 9.9   // stopwatch beat
const CUT_T = 12.6   // cut to the end card

export const fasterSpot = {
  dur: 16.4,
  audit: {
    settles: [
      { who: 's', from: 10.6, to: 16.3, value: 0.4 },
    ],
    wideWindows: [[0.0, 9.8], [10.8, 12.5]],
    cutT: 12.6,
    lines: [
      { at: 0.5, cps: 18, text: 'claude said: “too many requests”', sel: '[data-type="err"]', coverAt: 5.6 },
      { at: 5.6, cps: 20, text: 'superbot: switched to your second account', sel: '[data-type="fix"]', coverAt: 9.9 },
      { at: 12.7, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 15.7 },
    ],
    beats: [1.5, 3.5, 7.0, 10.5, 13.5, 15.6],
  },
  dom: () => `
    <figure class="ad-term">
      <figcaption class="cap"><b>claude code</b><span>live · 2 accounts connected</span></figcaption>
      <p class="term-line err"><span class="type" data-type="err"></span></p>
      <p class="term-line fix"><span class="type" data-type="fix"></span></p>
      <p class="term-pay"><span class="pay-label">fixed by superbot</span>
        <span class="pay-num"><span class="od" data-od="s"></span><span class="pay-unit">s</span></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      typer: {
        err: new Typer(p.cam.querySelector('[data-type="err"]')),
        fix: new Typer(p.cam.querySelector('[data-type="fix"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      od: new Odometer(p.cam.querySelector('[data-od="s"]')),
      pay: p.cam.querySelector('.term-pay'),
    })

    // gentle push-in while the payoff lands, hold the rest wide
    const k = t < PAY_AT ? 0 : Math.min(1, (t - PAY_AT) / 0.7)
    p.camTo(1 + 0.06 * easeStd(k), p.W / 2, p.H / 2)

    P.typer.err.run(t >= ERR.at, ERR.text, ERR.cps, t - ERR.at)
    P.typer.fix.run(t >= FIX.at, FIX.text, FIX.cps, t - FIX.at)

    // stopwatch payoff: roll up fast, settle exactly on 0.40
    const on = t >= PAY_AT
    P.pay.classList.toggle('on', on)
    const v = on ? 0.4 * easeOutExpo(Math.min(1, (t - PAY_AT) / 0.5)) : 0
    P.od.set(v)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
  },
}
