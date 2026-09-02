/* superbot.gg / ads — the "didyoumean" spot.
   Reskin of Mailchimp's "Did You Mean Mailchimp?" name-play: the brand
   name itself is the joke. A search bar types the name wrong three ways
   — superbought, supperbot, soup-er-bot — each struck through with
   "did you mean superbot?" typing underneath, until the real thing
   locks in green. One message: the name sticks.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const MISSES = [
  { at: 0.6, cps: 16, text: 'superbought', strike: 2.2, corr: 2.5 },
  { at: 4.0, cps: 16, text: 'supperbot', strike: 5.6, corr: 5.9 },
  { at: 7.4, cps: 16, text: 'soup-er-bot', strike: 9.0, corr: 9.3 },
]
const FINAL = { at: 10.6, cps: 16, text: 'superbot', lock: 11.4 }
const CORR_TEXT = 'did you mean superbot?'
const CORR_CPS = 30
const PAY = { at: 12.2, cps: 22, text: "superbot. you'll remember." }
const CUT_T = 15.0
const dur = 17.5

export const didyoumeanSpot = {
  dur,
  audit: {
    settles: [],
    wideWindows: [[0.0, dur]],
    cutT: CUT_T,
    lines: [
      { at: FINAL.at, cps: FINAL.cps, text: FINAL.text, sel: '[data-type="bar"]' },
      ...MISSES.map((m, i) => ({ at: m.corr, cps: CORR_CPS, text: CORR_TEXT, sel: `[data-type="corr${i}"]` })),
      { at: PAY.at, cps: PAY.cps, text: PAY.text, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: dur - 0.1 },
    ],
    beats: [1.2, 2.8, 3.4, 4.8, 6.2, 6.8, 8.2, 9.6, 10.2, 11.8, 12.9, 14.2, 15.6, 16.6],
  },
  dom: () => `
    <style>
      .dy-bar { position: absolute; left: 320px; top: 220px; width: 640px; height: 84px; box-sizing: border-box;
        display: flex; align-items: center; gap: 18px; padding: 0 34px;
        background: var(--card); border: 1px solid var(--line); border-radius: 42px; }
      .dy-bar.live { border-color: var(--accent); box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 25%, transparent); }
      .dy-glass { position: relative; width: 22px; height: 22px; flex: none; }
      .dy-glass::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--muted); border-radius: 50%; }
      .dy-glass::after { content: ''; position: absolute; left: 17px; top: 17px; width: 9px; height: 2.5px;
        background: var(--muted); border-radius: 2px; transform: rotate(45deg); transform-origin: 0 50%; }
      .dy-q { font: 500 34px/1 var(--font-mono); color: var(--fg); white-space: nowrap; min-height: 36px; }
      .dy-q .type.locked { color: var(--accent); }
      .dy-q .caret { margin-left: 3px; }
      .dy-ok { font: 700 26px/1 var(--font-mono); color: var(--bg); background: var(--accent); border-radius: 8px;
        padding: 5px 12px; margin-left: auto; opacity: 0; }
      .dy-strike { position: absolute; left: 74px; top: 50%; width: 228px; height: 3px; background: #d9564a;
        transform-origin: 0 50%; transform: scaleX(var(--w, 0)); border-radius: 2px; }
      .dy-corrs { position: absolute; left: 320px; top: 356px; }
      .dy-corr { display: flex; align-items: baseline; gap: 12px; margin: 0 0 22px; font: 24px/1.3 var(--font-mono);
        color: var(--accent); opacity: 0; min-height: 31px; }
      .dy-corr .n { font: 15px/1 var(--font-mono); color: var(--muted); min-width: 22px; }
      .dy-pay { position: absolute; left: 0; right: 0; top: 640px; margin: 0; text-align: center;
        font: 700 34px/1.3 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ad-player[data-ratio='1:1'] .dy-bar { left: 180px; top: 320px; width: 640px; }
      .ad-player[data-ratio='1:1'] .dy-corrs { left: 180px; top: 466px; }
      .ad-player[data-ratio='1:1'] .dy-pay { top: 800px; }
      .ad-player[data-ratio='9:16'] .dy-bar { left: 40px; top: 430px; width: 640px; }
      .ad-player[data-ratio='9:16'] .dy-corrs { left: 40px; top: 576px; }
      .ad-player[data-ratio='9:16'] .dy-corr { margin-bottom: 30px; }
      .ad-player[data-ratio='9:16'] .dy-pay { top: 1030px; }
    </style>
    <div class="dy-bar">
      <span class="dy-glass"></span>
      <span class="dy-q"><span class="type" data-type="bar"></span><span class="caret"></span></span>
      <span class="dy-ok">✓</span>
      <span class="dy-strike"></span>
    </div>
    <div class="dy-corrs">
      ${MISSES.map((_, i) => `
      <p class="dy-corr" data-corr="${i}">
        <span class="n">×${i + 1}</span>
        <span class="type" data-type="corr${i}"></span>
      </p>`).join('')}
    </div>
    <p class="dy-pay"><span class="type" data-type="pay"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      bar: p.cam.querySelector('.dy-bar'),
      strike: p.cam.querySelector('.dy-strike'),
      ok: p.cam.querySelector('.dy-ok'),
      corrs: [...p.cam.querySelectorAll('.dy-corr')],
      typer: {
        bar: new Typer(p.cam.querySelector('[data-type="bar"]')),
        corr: MISSES.map((_, i) => new Typer(p.cam.querySelector(`[data-type="corr${i}"]`))),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      pay: p.cam.querySelector('.dy-pay'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // the bar: three misses, each struck through, then the real thing
    const active = MISSES.find((m) => t >= m.at && t < FINAL.at) || (t >= FINAL.at ? FINAL : null)
    if (active) P.typer.bar.run(true, active.text, active.cps, t - active.at)
    const struck = MISSES.findIndex((m, i) => t >= m.strike && t < (MISSES[i + 1] ? MISSES[i + 1].at : FINAL.at))
    P.strike.style.setProperty('--w', struck >= 0 ? String(easeOutExpo(clamp01((t - MISSES[struck].strike) / 0.3))) : '0')
    P.bar.classList.toggle('live', t < CUT_T)
    const locked = t >= FINAL.lock
    P.typer.bar.el.classList.toggle('locked', locked)
    P.ok.style.opacity = locked ? String(easeOutExpo(clamp01((t - FINAL.lock) / 0.25))) : '0'

    // corrections type in under the bar and stay
    MISSES.forEach((m, i) => {
      const on = t >= m.corr
      P.corrs[i].style.opacity = on ? '1' : '0'
      P.typer.corr[i].run(on, CORR_TEXT, CORR_CPS, t - m.corr)
    })

    // payoff, then the cut
    const payOn = t >= PAY.at
    P.pay.style.opacity = payOn && t < CUT_T ? '1' : '0'
    P.typer.pay.run(payOn, PAY.text, PAY.cps, t - PAY.at)

    // camera: the same shallow centred push
    const z = 1 + 0.04 * easeOutExpo(clamp01(t / 8))
    p.camTo(z, p.W / 2, p.H / 2)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
