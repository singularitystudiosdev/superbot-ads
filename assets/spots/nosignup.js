/* superbot.gg / ads — the "nosignup" spot.
   Reskin of Vercel's "Develop. Preview. Ship." — the award-recognized
   three-beat imperative cadence — pointed at the site's unclaimed line:
   "nothing to sign up for. try it, and it's there." A create-account
   card erases its own fields one by one (email, password, card, then
   the button), collapses to a single "try it" pill, and the payoff:
   it's already there. One message: zero signup.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const FIELDS = ['email', 'password', 'card number']
const FD_AT = [2.2, 3.2, 4.2] // field dissolve times
const BTN_FADE = 5.0
const CARD_GONE = 5.8
const PILL_AT = 6.2
const PAY1 = { at: 8.6, cps: 22, text: 'nothing to sign up for.' }
const PAY2 = { at: 11.3, cps: 22, text: "it's already there." }
const CUT_T = 13.8
const dur = 16.0

export const nosignupSpot = {
  dur,
  audit: {
    settles: [],
    wideWindows: [[0.0, dur]],
    cutT: CUT_T,
    lines: [
      { ...PAY1, sel: '[data-type="pay1"]', coverAt: PAY2.at },
      { ...PAY2, sel: '[data-type="pay2"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 30, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: dur - 0.1 },
    ],
    beats: [1.2, 2.5, 3.5, 4.5, 5.2, 6.0, 6.8, 8.0, 9.4, 10.6, 12.0, 13.2, 14.6, 15.5],
  },
  dom: () => `
    <style>
      .ns-card { position: absolute; left: 340px; top: 140px; width: 600px; box-sizing: border-box;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 34px 44px 40px; }
      .ns-title { margin: 0 0 26px; font: 500 24px/1.3 var(--font-mono); color: var(--fg); letter-spacing: -0.01em; }
      .ns-field { margin: 0 0 20px; transform-origin: 50% 50%; }
      .ns-field label { display: block; font: 13px/1 var(--font-mono); color: var(--muted); margin-bottom: 9px;
        letter-spacing: 0.1em; }
      .ns-field .box { height: 48px; border: 1px solid var(--line); border-radius: 9px; background: var(--raised); }
      .ns-btn { margin-top: 28px; height: 52px; border-radius: 10px; background: var(--accent); color: var(--bg);
        display: grid; place-items: center; font: 700 18px/1 var(--font-mono); }
      .ns-pill { position: absolute; left: 50%; top: 320px; transform: translate(-50%, 0) scale(0);
        font: 700 30px/1 var(--font-mono); color: var(--accent); border: 1px solid var(--accent); border-radius: 40px;
        padding: 20px 52px; box-sizing: border-box;
        box-shadow: 0 0 40px color-mix(in srgb, var(--accent) 30%, transparent); }
      .ns-pay { position: absolute; left: 0; right: 0; top: 620px; margin: 0; text-align: center;
        font: 700 32px/1.3 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ad-player[data-ratio='1:1'] .ns-card { left: 200px; top: 180px; width: 600px; }
      .ad-player[data-ratio='1:1'] .ns-pill { top: 560px; }
      .ad-player[data-ratio='1:1'] .ns-pay { top: 820px; }
      .ad-player[data-ratio='9:16'] .ns-card { left: 40px; top: 280px; width: 640px; }
      .ad-player[data-ratio='9:16'] .ns-pill { top: 900px; }
      .ad-player[data-ratio='9:16'] .ns-pay { top: 1105px; font-size: 27px; }
    </style>
    <div class="ns-card">
      <p class="ns-title">create account</p>
      ${FIELDS.map((f, i) => `
      <div class="ns-field" data-field="${i}">
        <label>${f}</label>
        <div class="box"></div>
      </div>`).join('')}
      <div class="ns-btn">create account</div>
    </div>
    <div class="ns-pill">try it</div>
    <p class="ns-pay"><span class="type" data-type="pay1"></span></p>
    <p class="ns-pay"><span class="type" data-type="pay2"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      fields: [...p.cam.querySelectorAll('.ns-field')],
      btn: p.cam.querySelector('.ns-btn'),
      card: p.cam.querySelector('.ns-card'),
      pill: p.cam.querySelector('.ns-pill'),
      pay: [...p.cam.querySelectorAll('.ns-pay')],
      typer: {
        pay1: new Typer(p.cam.querySelector('[data-type="pay1"]')),
        pay2: new Typer(p.cam.querySelector('[data-type="pay2"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // the form erases itself: fields fold away one by one, then the button,
    // then the whole card collapses into the try-it pill
    FIELDS.forEach((_, i) => {
      const k = easeInBack(clamp01((t - FD_AT[i]) / 0.45))
      P.fields[i].style.opacity = String(t < FD_AT[i] ? 1 : 1 - k)
      P.fields[i].style.transform = `scaleX(${(1 - k * 0.85).toFixed(3)})`
    })
    P.btn.style.opacity = String(t < BTN_FADE ? 1 : 1 - clamp01((t - BTN_FADE) / 0.35))
    P.card.style.opacity = String(t < CARD_GONE ? 1 : 1 - clamp01((t - CARD_GONE) / 0.3))
    const pk = easeOutExpo(clamp01((t - PILL_AT) / 0.4))
    P.pill.style.transform = `translate(-50%, 0) scale(${pk.toFixed(3)})`

    // the two-beat payoff: gone, then already there — opacity swap, the
    // first line's textContent stays intact (the audit checks completed text)
    const on1 = t >= PAY1.at, on2 = t >= PAY2.at
    P.typer.pay1.run(on1, PAY1.text, PAY1.cps, t - PAY1.at)
    P.typer.pay2.run(on2, PAY2.text, PAY2.cps, t - PAY2.at)
    P.pay[0].style.opacity = on1 && !on2 && t < CUT_T ? '1' : '0'
    P.pay[1].style.opacity = on2 && t < CUT_T ? '1' : '0'

    // camera: the same shallow centred push
    const z = 1 + 0.05 * easeOutExpo(clamp01(t / 8))
    p.camTo(z, p.W / 2, p.H / 2)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 30, t - CUT_T - 0.1)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}

/* easeInBack: fields start the fold with a tiny wind-up — a hand-drawn feel
   for the erase, matching the deadpan of the form deleting itself */
function easeInBack(x) {
  const c1 = 1.70158, c3 = c1 + 1
  return c3 * x * x * x - c1 * x * x
}
