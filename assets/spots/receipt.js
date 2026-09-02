/* superbot.gg / ads — the "receipt" spot.
   The itemized-bill comparison ad (the grocery-receipt format insurance
   and telecom have run for decades): a till roll prints the other agents'
   month line by line while the total rolls up, the tear, and then the
   superbot stub — one line, included, $0.00 — snaps onto the odometer.
   The paper is the argument. Text rules of the series: ≤42 chars per
   card, ≥1.5s full-text dwell. All timed state from tick() inline. */

import { easeOutExpo, easeStd, Typer, Odometer } from '../engine.js'

const LINES = [
  { text: 'retries at pay-per-use', amt: 4.12 },
  { text: 'duplicate tool setups', amt: 2.10 },
  { text: 'idle subscriptions', amt: 1.34 },
]
const PRINT_AT = (i) => 0.9 + i * 0.95
const THEM_MAX = LINES.reduce((s, l) => s + l.amt, 0) // 7.56
const TEAR_AT = 6.5
const STUB_AT = 7.2
const ZERO_AT = 7.9
const PUNCH_AT = 8.9
const CUT_T = 11.6

export const receiptSpot = {
  dur: 14.6,
  audit: {
    settles: [
      { who: 'them', from: 0.0, to: 0.85, value: 0.0 },
      { who: 'them', from: PRINT_AT(2) + 0.6, to: TEAR_AT - 0.15, value: THEM_MAX },
      { who: 'us', from: 0.0, to: STUB_AT - 0.1, value: 0.0 },
      { who: 'us', from: ZERO_AT + 0.5, to: 14.3, value: 0.0 },
    ],
    wideWindows: [[0.0, 4.4], [7.0, 11.4]],
    cutT: CUT_T,
    lines: [
      { at: STUB_AT, cps: 24, text: 'everything above', sel: '[data-type="stub"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'one bill. already paid.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.3 },
    ],
    beats: [0.6, 1.2, 2.1, 3.0, 3.9, 4.8, 5.6, 6.7, 7.4, 8.2, 9.6, 11.9, 13.2],
  },
  dom: () => `
    <style>
      .r-cap { position: absolute; left: 0; right: 0; top: 84px; text-align: center; }
      .r-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .r-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .r-paper {
        position: absolute; left: 460px; top: 168px; width: 360px; padding: 26px 28px 30px;
        background: #efe9dc; color: #232019; border-radius: 4px;
        box-shadow: 0 26px 60px rgba(0,0,0,0.5);
        font: 16px/2.1 var(--font-mono);
      }
      .r-paper::before { content: ''; position: absolute; left: 0; right: 0; top: -10px; height: 10px;
        background: repeating-linear-gradient(90deg, transparent 0 8px, var(--bg) 8px 16px); }
      .r-head-row { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 8px; }
      .r-line { display: flex; justify-content: space-between; opacity: 0; }
      .r-line .amt { font-weight: 700; }
      .r-sub { display: flex; justify-content: space-between; align-items: baseline; margin-top: 12px;
        border-top: 1px dashed rgba(35,32,25,0.4); padding-top: 12px; }
      /* every odometer child shares the 1.05em box so baselines land on one
         line — same fix the term-pay number uses in ad.css */
      .r-sub .od-d, .r-sub .od-dot, .r-stub .big .od-d, .r-stub .big .od-dot { height: 1.05em; line-height: 1.05; }
      .r-sub .od { font-weight: 700; font-size: 26px; }
      .r-sub .od-d, .r-sub .od-dot { height: 1.05em; }
      .r-tear { position: absolute; left: 440px; top: 150px; width: 400px; height: 2px; background: var(--accent);
        box-shadow: 0 0 24px 4px color-mix(in srgb, var(--accent) 45%, transparent); opacity: 0; }
      .r-stub {
        position: absolute; left: 460px; top: 208px; width: 360px; padding: 22px 28px 26px;
        background: #efe9dc; color: #232019; border-radius: 4px; box-shadow: 0 26px 60px rgba(0,0,0,0.5);
        font: 16px/2.1 var(--font-mono); opacity: 0;
      }
      .r-stub::before { content: ''; position: absolute; left: 0; right: 0; top: -10px; height: 10px;
        background: repeating-linear-gradient(90deg, transparent 0 8px, var(--bg) 8px 16px); }
      .r-stub .head { font-weight: 700; margin-bottom: 6px; }
      .r-stub .r-line { opacity: 1; }
      .r-stub .big { display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px;
        border-top: 1px dashed rgba(35,32,25,0.4); padding-top: 10px; font-weight: 700; font-size: 26px; }
      .r-stub .big .od { font-size: inherit; }
      .r-punch { position: absolute; left: 0; right: 0; top: 560px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .r-cap { top: 220px; }
      .ad-player[data-ratio='9:16'] .r-paper { left: 180px; top: 320px; }
      .ad-player[data-ratio='9:16'] .r-stub { left: 180px; top: 360px; }
      .ad-player[data-ratio='9:16'] .r-punch { top: 880px; }
      .ad-player[data-ratio='1:1'] .r-paper { left: 320px; top: 210px; }
      .ad-player[data-ratio='1:1'] .r-stub { left: 320px; top: 250px; }
      .ad-player[data-ratio='1:1'] .r-punch { top: 740px; }
    </style>
    <p class="r-cap"><b>your month, itemized</b><span>the other agents' way · dollars</span></p>
    <div class="r-paper">
      <div class="r-head-row"><span>them · 30 days</span><span>amt</span></div>
      ${LINES.map((l, i) => `
      <div class="r-line" data-line="${i}"><span>${l.text}</span><span class="amt">$${l.amt.toFixed(2)}</span></div>`).join('')}
      <div class="r-sub"><span>total</span><span class="od" data-od="them"></span></div>
    </div>
    <div class="r-tear" data-tear></div>
    <div class="r-stub" data-stub>
      <div class="head">superbot · 30 days</div>
      <p class="r-line"><span class="type" data-type="stub"></span><span class="amt">incl.</span></p>
      <div class="big"><span>total</span><span class="od" data-od="us"></span></div>
    </div>
    <p class="r-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      paper: p.cam.querySelector('.r-paper'),
      stub: p.cam.querySelector('[data-stub]'),
      tear: p.cam.querySelector('[data-tear]'),
      lines: [...p.cam.querySelectorAll('[data-line]')],
      odos: {
        them: new Odometer(p.cam.querySelector('[data-od="them"]')),
        us: new Odometer(p.cam.querySelector('[data-od="us"]')),
      },
      typer: {
        stub: new Typer(p.cam.querySelector('[data-type="stub"]')),
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.r-punch'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // the till roll prints: each line lands under the head as it steps down
    let printed = 0
    P.lines.forEach((el, i) => {
      const on = t >= PRINT_AT(i)
      const k = easeOutExpo(clamp01((t - PRINT_AT(i)) / 0.2))
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `translateY(${((1 - k) * 5).toFixed(1)}px)`
      if (on) printed = i + 1
    })
    // odometer accumulates line by line, settles on the exact subtotal
    const themV = LINES.reduce((s, l, i) => s + (t >= PRINT_AT(i) + 0.2 ? l.amt : 0), 0)
    P.odos.them.set(themV)

    // the tear: paper rotates and drops; the stub takes its place
    const tk = clamp01((t - TEAR_AT) / 0.5)
    const torn = t >= TEAR_AT
    P.paper.style.opacity = torn ? String(1 - tk) : '1'
    P.paper.style.transform = torn
      ? `translateY(${(tk * 420).toFixed(1)}px) rotate(${(tk * 9).toFixed(2)}deg)` : 'none'
    P.tear.style.opacity = t >= TEAR_AT - 0.05 && t < TEAR_AT + 0.25 ? '1' : '0'

    // the stub prints one line carrying the same total, then the odometer
    // rolls it down to $0.00 — the punch of the spot
    P.typer.stub.run(t >= STUB_AT, 'everything above', 24, t - STUB_AT)
    P.stub.style.opacity = t >= STUB_AT ? '1' : '0'
    const zk = easeOutExpo(clamp01((t - ZERO_AT) / 0.45))
    P.odos.us.set(t >= STUB_AT ? THEM_MAX * (1 - zk) : 0)
    if (t >= ZERO_AT && t < ZERO_AT + 0.55 && !P._kick) { P._kick = true; shake(p) }
    if (t < ZERO_AT - 0.05) P._kick = false

    P.typer.punch.run(t >= PUNCH_AT, 'one bill. already paid.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → lean into the rolling total → wide for the tear →
    // settle on the stub as it hits zero
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 4.6 && t < 5.9) { z = 1 + 0.16 * easeStd(clamp01((t - 4.6) / 0.7)); px = 640; py = 400 }
    else if (t >= 5.9 && t < 6.6) { z = 1.22 + (1 - 1.22) * easeStd(clamp01((t - 5.9) / 0.7)) }
    else if (t >= ZERO_AT && t < ZERO_AT + 0.9) {
      z = 1 + 0.1 * Math.sin(Math.PI * clamp01((t - ZERO_AT) / 0.9)); px = 640; py = 380
    }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}

function shake(p) {
  p.stage.animate(
    [{ transform: p.stage.style.transform + ' translate(0,0)' },
     { transform: p.stage.style.transform + ' translate(3px,-2px)' },
     { transform: p.stage.style.transform + ' translate(-2px,2px)' },
     { transform: p.stage.style.transform + ' translate(0,0)' }],
    { duration: 200, easing: 'ease-out' })
}
