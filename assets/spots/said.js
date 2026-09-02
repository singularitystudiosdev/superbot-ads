/* superbot.gg / ads — the "said" spot.
   The device is the pull-quote pair — they said / we did — the format
   campaign journalism and apology-statements use: the other agents' own
   failure lines on the left (verbatim from the site's incident feed:
   the rate-limit error, the metered bill, the re-setup), superbot's
   receipt on the right, one pair at a time. The quotes are the argument;
   no odometer, no stopwatch, no terminal typing, no rank board, no
   receipt roll (all taken elsewhere in the series). Punchline is the
   device's own second half. Text rules of the series: ≤42 chars per
   card, ≥1.5s full-text dwell. All timed state from tick() inline. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

// the pairs: [they said, — attribution, we did]
const PAIRS = [
  { said: '“too many requests”', by: 'claude code', did: 'switched your second account · 0.4s', at: 1.6 },
  { said: '“$4.12 at pay-per-use prices”', by: 'the meter', did: 'covered · $0.00', at: 3.4 },
  { said: '“set up the same tool again”', by: 'every client', did: 'merged to one · backup saved', at: 5.2 },
]
const PUNCH_AT = 7.2
const CUT_T = 10.6
const DUR = 13.9

const prog = (t, t0, t1) => Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
const enter = (t, at) => easeOutExpo(prog(t, at, at + 0.45))

export const saidSpot = {
  dur: DUR,
  audit: {
    wideWindows: [[0.0, CUT_T - 0.2]],
    lines: [
      { at: PUNCH_AT, cps: 20, text: 'they said. we did.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 30, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: DUR - 0.7 },
    ],
    beats: [0.4, 1.7, 2.3, 3.5, 4.1, 5.3, 5.9, 7.3, 8.4, 9.4, 10.7, 12.4],
  },
  dom: () => `
    <style>
      .q-cap { position: absolute; left: 0; right: 0; top: 64px; text-align: center; }
      .q-cap b { display: block; font-weight: 500; font-size: 32px; letter-spacing: -0.01em; }
      .q-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .q-rows { position: absolute; left: 150px; top: 200px; width: 980px; }
      .q-row { position: absolute; left: 0; right: 0; display: grid; grid-template-columns: 1fr 56px 1fr; align-items: center; }
      .q-they { position: relative; padding: 18px 26px 18px 58px; border-radius: 12px; background: var(--raised); }
      .q-they .qm { position: absolute; left: 14px; top: 2px; font-size: 54px; color: #d98d76; opacity: 0.75; font-family: Georgia, serif; }
      .q-they b { display: block; font: 500 24px/1.3 Georgia, 'Times New Roman', serif; font-style: italic; }
      .q-they span { display: block; color: var(--muted); font: 15px/1.4 var(--font-mono); margin-top: 5px; }
      .q-arrow { text-align: center; font: 700 26px/1 var(--font-mono); color: var(--muted); }
      .q-we { position: relative; padding: 18px 24px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 8%, var(--card)); }
      .q-we::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 4px; border-radius: 2px;
        background: var(--accent); box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 55%, transparent); }
      .q-we b { display: block; font: 600 24px/1.3 var(--font-mono); }
      .q-punch { position: absolute; left: 0; right: 0; top: 596px; text-align: center; min-height: 30px;
        color: var(--fg); font-size: 24px; font-weight: 600; opacity: 0; }
      .q-punch.on { opacity: 1; }
      .ad-player[data-ratio='9:16'] .q-cap { top: 130px; }
      .ad-player[data-ratio='9:16'] .q-rows { left: 60px; top: 300px; width: 600px; }
      .ad-player[data-ratio='9:16'] .q-they b { font-size: 27px; }
      .ad-player[data-ratio='9:16'] .q-we b { font-size: 25px; }
      .ad-player[data-ratio='9:16'] .q-punch { top: 900px; }
      .ad-player[data-ratio='1:1'] .q-rows { left: 110px; top: 230px; width: 780px; }
      .ad-player[data-ratio='1:1'] .q-punch { top: 700px; }
    </style>
    <p class="q-cap"><b>they said · we did</b><span>your agents · this month · verbatim</span></p>
    <div class="q-rows">
      ${PAIRS.map((q, i) => `
      <div class="q-row" data-row="${i}">
        <div class="q-they"><span class="qm">“</span><b>${q.said}</b><span>— ${q.by}</span></div>
        <span class="q-arrow">→</span>
        <div class="q-we"><b>${q.did}</b></div>
      </div>`).join('')}
    </div>
    <p class="q-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      rows: PAIRS.map((q, i) => ({
        they: p.cam.querySelector(`[data-row="${i}"] .q-they`),
        we: p.cam.querySelector(`[data-row="${i}"] .q-we`),
        arrow: p.cam.querySelector(`[data-row="${i}"] .q-arrow`),
      })),
      punch: p.cam.querySelector('.q-punch'),
      punchTyper: new Typer(p.cam.querySelector('[data-type="punch"]')),
      winsTyper: new Typer(p.cam.querySelector('[data-type="wins"]')),
    })
    const RH = p.ratio === '9:16' ? 168 : 124

    // each pair: the quote fades in like a pull-quote, then the receipt
    // slides in from the right with its accent bar drawing downward
    P.rows.forEach((r, i) => {
      const q = PAIRS[i]
      const e1 = enter(t, q.at)
      const e2 = enter(t, q.at + 0.8)
      r.they.style.opacity = String(e1)
      r.they.style.transform = `translateY(${((1 - e1) * 14).toFixed(1)}px) rotate(${((1 - e1) * -1.2).toFixed(2)}deg)`
      r.we.style.opacity = String(e2)
      r.we.style.transform = `translateX(${((1 - e2) * 30).toFixed(1)}px)`
      r.arrow.style.opacity = String(e2)
    })
    // rows stack on a fixed pitch; position is a pure function of t
    P.rows.forEach((r, i) => {
      r.they.parentElement.style.transform = `translateY(${i * RH}px)`
    })

    // punchline + end card
    P.punch.classList.toggle('on', t >= PUNCH_AT)
    P.punchTyper.run(t >= PUNCH_AT, 'they said. we did.', 20, t - PUNCH_AT)
    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.winsTyper.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 30, t - CUT_T - 0.1)

    // camera: slow drift down the pairs as they land, settle on the punch
    const d = easeStd(Math.min(1, t / PUNCH_AT))
    p.camTo(1 + 0.04 * d, p.W / 2, p.H / 2 + 20 * d)
  },
}
