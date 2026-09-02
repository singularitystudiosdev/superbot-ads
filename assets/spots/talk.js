/* superbot.gg / ads — the "talk" spot.
   The site's uncovered claim, staged as two terminal panes: "it's a model
   too - a fast one. talk to it any time." Same question into both. The
   agent pane crawls, then refuses; the superbot pane answers while the
   other is still thinking — relative answer latency IS the argument. The
   refusal is the docs' own posture line (ask Superbot before telling the
   user something cannot be done), kept generic on purpose. Hard cut,
   SUPERBOT WINS end card. Text rules: ≤42 chars per card, ≥1.5s dwell.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

const Q = { at: 0.6, cps: 20, text: 'you: can this ship tonight?' }            // 27
const CRAWL = { at: 3.4, cps: 24, text: 'agent: checking…' }                 // 16
const REFUSE = { at: 5.6, cps: 20, text: 'agent: that’s not possible.' }     // 27
const ANSW = { at: 6.4, cps: 34, text: 'superbot: it ships. here’s the diff.' } // 36
const DIFF_AT = 8.0
const PUNCH_AT = 9.2
const CUT_T = 12.4

export const talkSpot = {
  dur: 15.4,
  audit: {
    settles: [],
    wideWindows: [[0.0, 2.9], [11.5, 12.25]],
    cutT: CUT_T,
    lines: [
      { at: Q.at, cps: Q.cps, text: Q.text, sel: '[data-type="qL"]', coverAt: CUT_T },
      { at: Q.at, cps: Q.cps, text: Q.text, sel: '[data-type="qR"]', coverAt: CUT_T },
      { at: CRAWL.at, cps: CRAWL.cps, text: CRAWL.text, sel: '[data-type="crawl"]', coverAt: REFUSE.at },
      { at: REFUSE.at, cps: REFUSE.cps, text: REFUSE.text, sel: '[data-type="refuse"]', coverAt: CUT_T },
      { at: ANSW.at, cps: ANSW.cps, text: ANSW.text, sel: '[data-type="answer"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'it’s a model too. talk to it any time.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 15.0 },
    ],
    beats: [1.5, 4.2, 6.1, 7.4, 8.6, 9.9, 11.2, 12.2, 13.6, 14.6],
  },
  dom: () => `
    <style>
      .ad-player[data-ratio='16:9'] .tk-pane { position: absolute; top: 130px; width: 560px; padding: 26px 32px 30px; }
      .ad-player[data-ratio='16:9'] .tk-pane[data-side='L'] { left: 60px; }
      .ad-player[data-ratio='16:9'] .tk-pane[data-side='R'] { left: 660px; }
      .ad-player[data-ratio='1:1'] .tk-pane { position: absolute; top: 150px; width: 440px; padding: 22px 28px 26px; }
      .ad-player[data-ratio='1:1'] .tk-pane[data-side='L'] { left: 60px; }
      .ad-player[data-ratio='1:1'] .tk-pane[data-side='R'] { left: 500px; top: 496px; }
      .ad-player[data-ratio='9:16'] .tk-pane { position: absolute; left: 50px; width: 620px; padding: 22px 28px 26px; }
      .ad-player[data-ratio='9:16'] .tk-pane[data-side='L'] { top: 240px; }
      .ad-player[data-ratio='9:16'] .tk-pane[data-side='R'] { top: 640px; }
      .tk-pane {
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        opacity: 0;
      }
      .tk-pane.us { border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); }
      .tk-pane .cap { margin-bottom: 24px; }
      .tk-pane .cap b { display: block; font-weight: 500; font-size: 24px; letter-spacing: -0.01em; }
      .tk-pane.us .cap b { color: var(--accent); }
      .tk-pane .cap span { display: block; color: var(--muted); margin-top: 5px; font-size: 15px; }
      .tk-line { margin: 0 0 16px; font: 19px/1.45 var(--font-mono); min-height: 28px; }
      .tk-line.dim { color: var(--muted); }
      .tk-line.refuse { color: #d98d76; }
      .tk-line.answer { color: var(--fg); }
      .tk-line.answer .type::before { content: '→ '; color: var(--accent); }
      .tk-diff {
        margin-top: 4px; padding: 10px 14px; border: 1px dashed var(--line); border-radius: 10px;
        font: 15px/1.5 var(--font-mono); color: var(--muted); opacity: 0;
      }
      .tk-diff em { font-style: normal; color: var(--accent); }
      .tk-punch {
        position: absolute; left: 0; right: 0; bottom: 96px; text-align: center;
        font-size: 21px; color: var(--fg); opacity: 0; min-height: 30px;
      }
      .ad-player[data-ratio='1:1'] .tk-punch { bottom: 96px; }
      .ad-player[data-ratio='9:16'] .tk-punch { bottom: 230px; font-size: 19px; }
    </style>
    <div class="tk-pane" data-side="L">
      <figcaption class="cap"><b>them · the agent</b><span>waiting on its tools</span></figcaption>
      <p class="tk-line"><span class="type" data-type="qL"></span></p>
      <p class="tk-line dim"><span class="type" data-type="crawl"></span><span class="tk-ellipsis">…</span></p>
      <p class="tk-line refuse"><span class="type" data-type="refuse"></span></p>
    </div>
    <div class="tk-pane us" data-side="R">
      <figcaption class="cap"><b>superbot · direct</b><span>it’s also a model — ask it anything</span></figcaption>
      <p class="tk-line"><span class="type" data-type="qR"></span></p>
      <p class="tk-line answer"><span class="type" data-type="answer"></span></p>
      <p class="tk-diff"><em>+</em> rate limit · <em>3 tests passing</em> · diff attached</p>
    </div>
    <p class="tk-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = buildParts(p))

    // panes rise in
    const fk = easeOutExpo(clamp01((t - 0.1) / 0.7))
    P.panes.forEach((el, i) => {
      const k = easeOutExpo(clamp01((t - (0.1 + i * 0.12)) / 0.7))
      el.style.opacity = String(k)
      el.style.transform = `translateY(${((1 - k) * 16).toFixed(1)}px)`
    })

    // the same question, typed into both panes at once
    P.typer.qL.run(t >= Q.at, Q.text, Q.cps, t - Q.at)
    P.typer.qR.run(t >= Q.at, Q.text, Q.cps, t - Q.at)

    // left crawls, then refuses; the ellipsis pulses while it thinks
    P.typer.crawl.run(t >= CRAWL.at, CRAWL.text, CRAWL.cps, t - CRAWL.at)
    P.typer.refuse.run(t >= REFUSE.at, REFUSE.text, REFUSE.cps, t - REFUSE.at)
    const pulse = t >= CRAWL.at && t < REFUSE.at ? (Math.sin(t * 6) * 0.5 + 0.5) : 0
    P.ellipsis.style.opacity = (0.15 + 0.75 * pulse).toFixed(2)
    P.ellipsis.style.opacity = t >= REFUSE.at ? '0' : P.ellipsis.style.opacity

    // right answers fast — cps 34 vs the agent's 20 — then the diff chip
    P.typer.answer.run(t >= ANSW.at, ANSW.text, ANSW.cps, t - ANSW.at)
    P.typer.punch.run(t >= PUNCH_AT, 'it’s a model too. talk to it any time.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT ? '1' : '0'
    const dk = easeOutExpo(clamp01((t - DIFF_AT) / 0.4))
    P.diff.style.opacity = String(dk)
    P.diff.style.transform = `translateY(${((1 - dk) * 8).toFixed(1)}px)`

    // camera: wide → push onto the stall → back → push onto the answer →
    // wide for the punchline. On the tall frame the panes stack, so hold
    // a gentle drift instead of targeted pushes.
    const stack = p.ratio === '9:16'
    let z = 1, px = p.W / 2, py = p.H / 2
    if (!stack) {
      const L = P.centers.L, R = P.centers.R
      if (t >= 2.9 && t < 4.9) {
        const k = easeStd(clamp01((t - 2.9) / 2.0))
        z = 1 + 0.24 * k
        px = p.W / 2 + (L.x - p.W / 2) * k
        py = p.H / 2 + (L.y - p.H / 2) * k
      } else if (t >= 4.9 && t < 6.2) {
        const k = easeStd(clamp01((t - 4.9) / 1.3))
        z = 1.24 - 0.24 * k
        px = L.x - (L.x - p.W / 2) * k
        py = L.y - (L.y - p.H / 2) * k
      } else if (t >= 6.4 && t < 8.4) {
        const k = easeStd(clamp01((t - 6.4) / 2.0))
        z = 1 + 0.24 * k
        px = p.W / 2 + (R.x - p.W / 2) * k
        py = p.H / 2 + (R.y - p.H / 2) * k
      } else if (t >= 8.4 && t < 9.4) {
        z = 1.24
        px = R.x; py = R.y
      } else if (t >= 9.4 && t < 10.8) {
        const k = easeStd(clamp01((t - 9.4) / 1.4))
        z = 1.24 - 0.24 * k
        px = R.x - (R.x - p.W / 2) * k
        py = R.y - (R.y - p.H / 2) * k
      }
    } else {
      const k = easeStd(clamp01((t - 6.4) / 3.0))
      z = 1 + 0.1 * (1 - Math.abs(2 * k - 1))
    }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)

    const inCut = Math.abs(t - CUT_T) < 0.05
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))

function buildParts(p) {
  const q = (s) => p.cam.querySelector(s)
  // pane centres in design coords (offsetParent chain stops at the cam)
  const center = (el) => {
    let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el
    while (n && n !== p.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent }
    return { x, y }
  }
  const panes = [...p.cam.querySelectorAll('.tk-pane')]
  return {
    panes,
    centers: { L: center(panes[0]), R: center(panes[1]) },
    diff: q('.tk-diff'),
    punch: q('.tk-punch'),
    ellipsis: q('.tk-ellipsis'),
    typer: {
      qL: new Typer(q('[data-type="qL"]')),
      qR: new Typer(q('[data-type="qR"]')),
      crawl: new Typer(q('[data-type="crawl"]')),
      refuse: new Typer(q('[data-type="refuse"]')),
      answer: new Typer(q('[data-type="answer"]')),
      punch: new Typer(q('[data-type="punch"]')),
      wins: new Typer(q('[data-type="wins"]')),
    },
  }
}
