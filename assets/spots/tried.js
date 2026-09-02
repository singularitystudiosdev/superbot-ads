/* superbot.gg / ads — the "tried" spot.
   Reskin of Slack's "So Yeah, We Tried Slack…" (Sandwich Video): the
   deadpan mockumentary understatement. Staged as a behind-the-scenes
   production log — timestamps, a blinking REC dot, lines that type
   themselves and never raise their voice. One message, straight from the
   site copy: it's a model too — a fast one. talk to it any time.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const LINES = [
  { at: 0.5, cps: 22, text: 'so yeah, we tried superbot.' },
  { at: 4.2, cps: 22, text: "it's a model too — a fast one." },
  { at: 7.6, cps: 22, text: 'talk to it any time.' },
  { at: 10.4, cps: 22, text: "that's it. that's the ad." },
]
const CUT_T = 13.2
const dur = 15.7

export const triedSpot = {
  dur,
  audit: {
    settles: [],
    wideWindows: [[0.0, dur]],
    cutT: CUT_T,
    lines: [
      ...LINES.map((l, i) => ({
        ...l, sel: `[data-type="tr${i}"]`, coverAt: LINES[i + 1] ? LINES[i + 1].at : CUT_T,
      })),
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: dur - 0.1 },
    ],
    beats: [1.0, 2.6, 4.8, 6.4, 8.4, 10.0, 11.8, 12.8, 14.2, 15.2],
  },
  dom: () => `
    <style>
      .tr-log { position: absolute; left: 200px; top: 230px; width: 880px; }
      .tr-rec { position: absolute; left: 48px; top: 44px; display: inline-flex; align-items: center; gap: 10px;
        font: 15px/1 var(--font-mono); letter-spacing: 0.14em; color: var(--muted); }
      .tr-rec i { width: 12px; height: 12px; border-radius: 50%; background: #d9564a;
        box-shadow: 0 0 12px rgba(217, 86, 74, 0.7); }
      .tr-entry { display: flex; align-items: baseline; gap: 22px; margin: 0 0 44px; opacity: 0; }
      .tr-entry .ts { font: 17px/1.4 var(--font-mono); color: var(--muted); min-width: 56px; }
      .tr-entry .line { font: 500 30px/1.3 var(--font-mono); color: var(--fg); min-height: 40px; }
      .tr-entry.hot .line { color: var(--accent); }
      .ad-player[data-ratio='1:1'] .tr-log { left: 120px; top: 260px; width: 760px; }
      .ad-player[data-ratio='1:1'] .tr-entry .line { font-size: 27px; }
      .ad-player[data-ratio='9:16'] .tr-log { left: 56px; top: 420px; width: 608px; }
      .ad-player[data-ratio='9:16'] .tr-entry { margin-bottom: 52px; }
      .ad-player[data-ratio='9:16'] .tr-entry .ts { font-size: 15px; min-width: 48px; }
      .ad-player[data-ratio='9:16'] .tr-entry .line { font-size: 22px; min-height: 30px; }
    </style>
    <span class="tr-rec"><i></i>REC</span>
    <div class="tr-log">
      ${LINES.map((l, i) => `
      <p class="tr-entry" data-tr="${i}">
        <span class="ts">${fmtTs(l.at)}</span>
        <span class="line"><span class="type" data-type="tr${i}"></span></span>
      </p>`).join('')}
    </div>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      entries: [...p.cam.querySelectorAll('.tr-entry')],
      rec: p.cam.querySelector('.tr-rec i'),
      typer: LINES.map((_, i) => new Typer(p.cam.querySelector(`[data-type="tr${i}"]`)))
        .concat(new Typer(p.cam.querySelector('[data-type="wins"]'))),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // each entry fades up as its line starts typing
    LINES.forEach((l, i) => {
      const on = t >= l.at
      const k = easeOutExpo(clamp01((t - l.at) / 0.35))
      const el = P.entries[i]
      el.style.opacity = String(on ? k : 0)
      el.style.transform = `translateY(${((1 - k) * 8).toFixed(1)}px)`
      el.classList.toggle('hot', on && t < (LINES[i + 1] ? LINES[i + 1].at : CUT_T))
      P.typer[i].run(on, l.text, l.cps, t - l.at)
    })

    // REC dot: steady pulse on the virtual clock
    P.rec.style.opacity = (t % 1.2) < 0.7 ? '1' : '0.25'

    // camera: a slow, shallow centred push — the mockumentary barely moves
    const z = 1 + 0.05 * easeOutExpo(clamp01(t / 9))
    p.camTo(z, p.W / 2, p.H / 2)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer[4].run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}

function fmtTs(at) {
  const s = Math.floor(at)
  return `00:${String(s).padStart(2, '0')}`
}
