/* superbot.gg / ads — the "raced" spot.
   The overtake race, the oldest comparison device in motorsport and
   processor-launch advertising: same task, two lanes. "Them" chugs along
   at their pace; superbot starts a beat later, digs in, and blows past at
   the 3-second mark — the camera riding the overtake — then coasts across
   while they're still mid-track. Two rolling stopwatches settle on the
   exact split: 5.00 vs 9.90. Punchline, hard cut, SUPERBOT WINS end card.
   Text rules of the series: ≤42 chars per card, ≥1.5s dwell. All timed
   state from tick() inline — no CSS transitions. */

import { easeInOutCubic, easeOutExpo, easeStd, Typer, Odometer } from '../engine.js'

const THEM_T = 9.9   // their finish time (echoes the $9.90 benchmark)
const US_T = 5.0     // ours
const THEM_START = 0.5
const US_START = 1.0
const US_RUN = US_T - US_START
const CROSS_US = US_START + US_T
const PUNCH_AT = 6.4
const CUT_T = 12.1

export const racedSpot = {
  dur: 15.0,
  audit: {
    settles: [
      { who: 'them', from: 0.0, to: THEM_START - 0.1, value: 0.0 },
      { who: 'them', from: THEM_START + THEM_T + 0.4, to: 11.8, value: THEM_T },
      { who: 'us', from: 0.0, to: US_START - 0.1, value: 0.0 },
      { who: 'us', from: CROSS_US + 0.4, to: 11.8, value: US_T },
    ],
    wideWindows: [[0.0, 1.4], [CROSS_US + 0.9, 11.8]],
    cutT: CUT_T,
    lines: [
      { at: PUNCH_AT, cps: 26, text: 'finished. they’re not.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.7 },
    ],
    beats: [0.6, 1.5, 2.4, 3.4, 4.4, 5.2, 6.7, 7.8, 8.8, 9.7, 10.6, 12.3, 13.6],
  },
  dom: () => `
    <style>
      .rc-cap { position: absolute; left: 0; right: 0; top: 96px; text-align: center; }
      .rc-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .rc-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .rc-lane {
        position: absolute; left: 90px; right: 90px; height: 104px;
        display: grid; grid-template-columns: 150px 1fr 130px; align-items: center; gap: 18px;
      }
      .rc-lane.them { top: 262px; }
      .rc-lane.us { top: 420px; }
      .rc-name { font: 700 19px/1.2 var(--font-mono); }
      .rc-lane.them .rc-name { color: #d98d76; }
      .rc-lane.us .rc-name { color: var(--accent); }
      .rc-track { position: relative; height: 104px; border: 1px solid var(--line); border-radius: 12px;
        background: color-mix(in srgb, var(--fg) 3%, transparent); }
      .rc-track::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 10px;
        background: repeating-conic-gradient(var(--fg) 0 25%, transparent 0 50%) 0 0/10px 10px; opacity: 0.5; }
      .rc-token {
        position: absolute; top: 50%; left: 8px; transform: translateY(-50%);
        padding: 8px 14px; border-radius: 999px; font: 700 15px/1 var(--font-mono); white-space: nowrap;
        background: var(--card); border: 1px solid var(--line);
      }
      .rc-lane.us .rc-token { color: var(--fg); border-color: var(--accent);
        box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 35%, transparent); }
      .rc-lane.them .rc-token { color: #d98d76; }
      .rc-clock { font: 700 22px/1.2 var(--font-mono); color: var(--fg); }
      .rc-lane.us .rc-clock { text-shadow: 0 0 22px color-mix(in srgb, var(--accent) 40%, transparent); }
      .rc-lane.them .rc-clock { color: var(--muted); }
      .rc-gap { position: absolute; left: 0; right: 0; top: 566px; text-align: center;
        font: 700 24px/1.2 var(--font-mono); color: var(--accent); opacity: 0; }
      .rc-punch { position: absolute; left: 0; right: 0; top: 634px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .rc-cap { top: 240px; }
      .ad-player[data-ratio='9:16'] .rc-lane { left: 40px; right: 40px; height: 90px; grid-template-columns: 110px 1fr 100px; }
      .ad-player[data-ratio='9:16'] .rc-lane.them { top: 430px; }
      .ad-player[data-ratio='9:16'] .rc-lane.us { top: 570px; }
      .ad-player[data-ratio='9:16'] .rc-name, .ad-player[data-ratio='9:16'] .rc-token { font-size: 14px; }
      .ad-player[data-ratio='9:16'] .rc-gap { top: 730px; }
      .ad-player[data-ratio='9:16'] .rc-punch { top: 800px; }
      .ad-player[data-ratio='1:1'] .rc-lane { left: 80px; right: 80px; }
      .ad-player[data-ratio='1:1'] .rc-lane.them { top: 300px; }
      .ad-player[data-ratio='1:1'] .rc-lane.us { top: 452px; }
      .ad-player[data-ratio='1:1'] .rc-gap { top: 600px; }
      .ad-player[data-ratio='1:1'] .rc-punch { top: 668px; }
    </style>
    <p class="rc-cap"><b>same task. head to head.</b><span>one benchmark task · seconds</span></p>
    <div class="rc-lane them">
      <span class="rc-name">other agents</span>
      <div class="rc-track"><span class="rc-token">them</span></div>
      <span class="rc-clock"><span class="od" data-od="them"></span>s</span>
    </div>
    <div class="rc-lane us">
      <span class="rc-name">superbot</span>
      <div class="rc-track"><span class="rc-token">superbot</span></div>
      <span class="rc-clock"><span class="od" data-od="us"></span>s</span>
    </div>
    <p class="rc-gap"><span data-gap></span></p>
    <p class="rc-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      tokens: {
        them: p.cam.querySelector('.rc-lane.them .rc-token'),
        us: p.cam.querySelector('.rc-lane.us .rc-token'),
      },
      tracks: {
        them: p.cam.querySelector('.rc-lane.them .rc-track'),
        us: p.cam.querySelector('.rc-lane.us .rc-track'),
      },
      odos: {
        them: new Odometer(p.cam.querySelector('[data-od="them"]')),
        us: new Odometer(p.cam.querySelector('[data-od="us"]')),
      },
      gap: p.cam.querySelector('.rc-gap'),
      gapTxt: p.cam.querySelector('[data-gap]'),
      typer: {
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      punch: p.cam.querySelector('.rc-punch'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // the race: them chugs at constant pace; superbot starts a beat later
    // and eases in — easeInOutCubic means the overtake lands mid-track
    const pThem = clamp01((t - THEM_START) / THEM_T)
    const pUs = t < US_START ? 0 : easeInOutCubic(clamp01((t - US_START) / US_RUN))
    const place = (token, track, prog) => {
      const w = track.offsetWidth - token.offsetWidth - 26
      token.style.left = `${(8 + prog * w).toFixed(1)}px`
    }
    place(P.tokens.them, P.tracks.them, pThem)
    place(P.tokens.us, P.tracks.us, pUs)

    // rolling stopwatches — each settles exactly on its finish time
    P.odos.them.set(clamp01((t - THEM_START) / THEM_T) * THEM_T)
    P.odos.us.set(t < US_START ? 0 : Math.min(US_T, t - US_START))

    // the live gap chip: "digging in…" while behind, then the finish-time
    // margin once past them (their pace is constant, so the time gap is
    // exactly the difference of the two finish clocks)
    const gapTxtVal = t < US_START ? ''
      : pUs < pThem ? 'digging in…'
      : `+${(THEM_T - US_T).toFixed(1)}s ahead`
    if (gapTxtVal && gapTxtVal !== P.lastGap) {
      P.gapTxt.textContent = gapTxtVal
      P.gap.style.opacity = '1'
      P.lastGap = gapTxtVal
    }
    P.gap.style.opacity = gapTxtVal ? '1' : '0'

    // camera: wide → ride the overtake on our lane → wide for the finish
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 1.4 && t < 5.3) {
      const k = easeStd(clamp01((t - 1.4) / 0.5))
      z = 1 + 0.22 * k
      const tk = P.tracks.us
      px = tk.offsetLeft + tk.offsetWidth * (0.3 + 0.35 * clamp01((t - 1.4) / 3.4))
      py = p.H / 2 + 40
    } else if (t >= 5.3 && t < 6.1) {
      z = 1.28 + (1 - 1.28) * easeStd(clamp01((t - 5.3) / 0.8))
    }
    p.camTo(z, px, py)
    if (t >= 2.6 && t < 2.65 && !P._kick) { P._kick = true; shake(p) }
    if (t < 2.55) P._kick = false

    P.typer.punch.run(t >= PUNCH_AT, 'finished. they’re not.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

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
