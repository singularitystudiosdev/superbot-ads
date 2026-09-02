/* superbot.gg / ads — the "checks" spot.
   Screenlife, cursor as the protagonist: a pull request with three red
   checks. The cursor is already mid-frame at t=0, clicks the first
   failing row, and superbot reruns the checks green in sequence — merge
   button lights, Merged badge stamps. The shell (PR review UI) is the
   argument; the green-check resolution beat is the spine, a state flip
   every ~2s, premise on screen before second 3.
   Series rules: ≤42 chars/card, ≥1.5s dwell, SUPERBOT WINS end card.
   All timed state set from tick() inline — no CSS transitions. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

const CHECKS = ['lint', 'tests', 'typecheck']
const CLICK_AT = (i) => 2.2 + i * 2.0      // cursor lands + presses the row
const SPIN_AT = (i) => CLICK_AT(i) + 0.1   // rerun starts
const GREEN_AT = (i) => SPIN_AT(i) + 1.2   // row flips green
const MERGE_AT = 8.6                       // cursor presses the merge button
const BADGE_AT = 9.3                       // Merged badge stamps in
const L1 = { at: 2.4, cps: 26, text: '3 failing checks. one click.', coverAt: 9.3 }
const PUNCH = { at: 9.6, cps: 32, text: 'green on the first try. every time.' }
const CUT_T = 12.4

// cursor waypoints: [t, x, y] in design coords — enters already moving,
// presses each row and holds through the click pulse, then parks on the
// merge button (bottom-left of the card) and leaves with the cut
const WAY = [
  [0.0, 1380, 780], [0.9, 512, 258], [2.6, 512, 258],
  [4.1, 512, 328], [4.6, 512, 328],
  [6.1, 512, 398], [6.6, 512, 398],
  [8.5, 424, 436], [12.1, 424, 436], [12.5, 1380, 780],
]
const CLICKS = [2.2, 4.2, 6.2, MERGE_AT]

export const checksSpot = {
  dur: 15.0,
  audit: {
    settles: [],
    wideWindows: [[0.0, 12.2]],
    cutT: CUT_T,
    lines: [
      { at: L1.at, cps: L1.cps, text: L1.text, sel: '[data-type="l1"]', coverAt: L1.coverAt },
      { at: PUNCH.at, cps: PUNCH.cps, text: PUNCH.text, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.7 },
    ],
    beats: [0.6, 2.3, 3.5, 4.3, 5.5, 7.5, 8.7, 9.4, 10.4, 11.5, 12.6, 13.8],
  },
  dom: () => `
    <style>
      .ck-card {
        position: absolute; left: 240px; top: 88px; width: 800px; height: 470px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 22px 30px; box-sizing: border-box;
      }
      .ck-head { display: flex; align-items: baseline; gap: 14px; }
      .ck-head b { font-weight: 500; font-size: 24px; letter-spacing: -0.01em; }
      .ck-head span { font: 15px/1.2 var(--font-mono); color: var(--muted); }
      .ck-tabs { display: flex; gap: 26px; align-items: baseline; margin: 16px 0 8px; font: 14px/1 var(--font-mono); color: var(--muted); }
      .ck-tabs .on { color: var(--fg); border-bottom: 2px solid var(--accent); padding-bottom: 8px; }
      .ck-cnt { margin-left: auto; font: 14px/1 var(--font-mono); color: var(--muted); display: inline-flex; align-items: baseline; gap: 6px; }
      .ck-cnt .n { display: inline-block; height: 1.2em; overflow: hidden; font-weight: 700; font-size: 18px; color: var(--fg); }
      .ck-cnt .n .strip { display: block; }
      .ck-cnt .n .strip span { display: block; height: 1.2em; line-height: 1.2; font-style: normal; text-align: center; }
      .ck-row { display: flex; align-items: center; gap: 16px; height: 62px; margin: 8px 0;
        padding: 0 18px; border-radius: 10px; background: color-mix(in srgb, var(--fg) 4%, transparent); }
      .ck-row .nm { font: 16px/1 var(--font-mono); color: var(--fg); }
      .ck-row .tag { font: 12px/1 var(--font-mono); color: var(--accent); opacity: 0; margin-left: 12px; }
      .ck-row .st { margin-left: auto; font-style: normal; font-weight: 700; font-size: 22px; width: 26px; text-align: center; }
      .ck-st-x, .ck-st-spin, .ck-st-ok { font-style: normal; position: absolute; }
      .ck-row .st { position: relative; display: grid; place-items: center; }
      .ck-st-x { color: #d98d76; opacity: 0; }
      .ck-st-spin { color: var(--muted); opacity: 0; font-size: 18px; }
      .ck-st-ok { color: var(--accent); opacity: 0; text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent); }
      .ck-foot { display: flex; align-items: center; gap: 18px; margin-top: 20px; }
      .ck-merge { border: 1px solid var(--line); border-radius: 8px; padding: 12px 22px;
        font: 700 15px/1 var(--font-mono); color: var(--muted); background: var(--raised); }
      .ck-merge.on { background: var(--accent); border-color: var(--accent); color: var(--bg);
        box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 45%, transparent); }
      .ck-badge { font: 700 14px/1 var(--font-mono); color: #c8a2ff; border: 1px solid #c8a2ff;
        border-radius: 20px; padding: 8px 16px; opacity: 0; }
      .ck-line { position: absolute; left: 0; right: 0; top: 610px; margin: 0; text-align: center;
        font-size: 19px; color: var(--fg); opacity: 0; }
      .ck-pay { position: absolute; left: 0; right: 0; top: 610px; margin: 0; text-align: center;
        font: 700 21px/1.2 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ck-cursor { position: absolute; left: 0; top: 0; width: 26px; height: 26px; opacity: 0; will-change: transform; z-index: 3; }
      .ad-player[data-ratio='9:16'] .ck-card { left: 30px; top: 210px; width: 660px; height: 620px; }
      .ad-player[data-ratio='9:16'] .ck-line { top: 870px; }
      .ad-player[data-ratio='9:16'] .ck-pay { top: 930px; }
      .ad-player[data-ratio='1:1'] .ck-card { left: 120px; top: 110px; width: 760px; height: 560px; }
      .ad-player[data-ratio='1:1'] .ck-line { top: 710px; }
      .ad-player[data-ratio='1:1'] .ck-pay { top: 760px; }
    </style>
    <div class="ck-card">
      <div class="ck-head"><b>fix: rate-limit failover</b><span>#412 · 2 approvals</span></div>
      <div class="ck-tabs"><span>conversation</span><span class="on">checks</span><span>files changed</span>
        <span class="ck-cnt"><span class="n" data-cnt><span class="strip">${'0123456789'.split('').map((c) => `<span>${c}</span>`).join('')}</span></span>/3 green</span></div>
      ${CHECKS.map((nm, i) => `
      <div class="ck-row" data-row="${i}">
        <span class="nm">${nm}</span><span class="tag" data-tag="${i}">rerun by superbot</span>
        <span class="st"><i class="ck-st-x" data-x="${i}">✗</i><i class="ck-st-spin" data-spin="${i}">◠</i><i class="ck-st-ok" data-ok="${i}">✓</i></span>
      </div>`).join('')}
      <div class="ck-foot">
        <span class="ck-merge" data-merge>merge pull request</span>
        <span class="ck-badge" data-badge>● merged</span>
      </div>
    </div>
    <p class="ck-line"><span class="type" data-type="l1"></span></p>
    <p class="ck-pay"><span class="type" data-type="pay"></span></p>
    <div class="ck-cursor" data-cursor>
      <svg width="26" height="26" viewBox="0 0 24 24">
        <path d="M5 2.5 L18.5 13.2 L11.8 13.9 L15.2 20.6 L12.5 21.9 L9.2 15.2 L5 19.2 Z"
          fill="var(--fg, #fff)" stroke="var(--bg, #111)" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      xs: [...p.cam.querySelectorAll('[data-x]')].map((el) => ({ el })),
      spins: [...p.cam.querySelectorAll('[data-spin]')].map((el) => ({ el })),
      oks: [...p.cam.querySelectorAll('[data-ok]')].map((el) => ({ el })),
      tags: [...p.cam.querySelectorAll('[data-tag]')],
      cnt: p.cam.querySelector('[data-cnt] .strip'),
      merge: p.cam.querySelector('[data-merge]'),
      badge: p.cam.querySelector('[data-badge]'),
      cursor: p.cam.querySelector('[data-cursor]'),
      typer: {
        l1: new Typer(p.cam.querySelector('[data-type="l1"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      line: p.cam.querySelector('.ck-line'),
      pay: p.cam.querySelector('.ck-pay'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // rows: red ✗ until clicked, spinner on the rerun, green + tag after
    P.xs.forEach(({ el }, i) => {
      const spun = t >= SPIN_AT(i), green = t >= GREEN_AT(i)
      el.style.opacity = spun ? '0' : t >= 0.3 ? '1' : '0'
    })
    P.spins.forEach(({ el }, i) => {
      const spun = t >= SPIN_AT(i), green = t >= GREEN_AT(i)
      el.style.opacity = spun && !green ? '1' : '0'
      el.style.transform = `rotate(${(((t - SPIN_AT(i)) * 2.6) % 1) * 360}deg)`
    })
    P.oks.forEach(({ el }, i) => {
      const kk = easeOutExpo(clamp01((t - GREEN_AT(i)) / 0.28))
      el.style.opacity = String(t >= GREEN_AT(i) ? kk : 0)
      el.style.transform = `scale(${(t >= GREEN_AT(i) ? 0.6 + 0.4 * kk : 0.6).toFixed(3)})`
    })
    P.tags.forEach((el, i) => {
      el.style.opacity = String(t >= GREEN_AT(i) ? clamp01((t - GREEN_AT(i) - 0.3) / 0.4) : 0)
    })
    // green counter: a strip roll, one step per green check
    const nGreen = CHECKS.filter((_, i) => t >= GREEN_AT(i)).length
    P.cnt.style.transform = `translateY(${(-nGreen * 1.2).toFixed(2)}em)`

    // merge button lights as the last check lands; badge stamps on click
    P.merge.classList.toggle('on', t >= GREEN_AT(2) + 0.4)
    const bk = easeOutExpo(clamp01((t - BADGE_AT) / 0.32))
    P.badge.style.opacity = String(bk)
    P.badge.style.transform = `scale(${(bk > 0 ? 1.4 - 0.4 * bk : 1.4).toFixed(3)})`

    // cursor: glide between waypoints, press-pulse on each click
    let cx = WAY[0][1], cy = WAY[0][2]
    for (let i = 0; i < WAY.length - 1; i++) {
      const [t0, x0, y0] = WAY[i], [t1, x1, y1] = WAY[i + 1]
      if (t >= t0) {
        const k = easeStd(clamp01((t - t0) / Math.max(0.001, t1 - t0)))
        cx = x0 + (x1 - x0) * k; cy = y0 + (y1 - y0) * k
      }
    }
    let cs = 1
    for (const c of CLICKS) {
      const k = clamp01((t - c) / 0.2)
      if (t >= c && k < 1) cs = 1 - 0.28 * Math.sin(Math.PI * k)
    }
    P.cursor.style.opacity = t < CUT_T ? '1' : '0'
    P.cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) scale(${cs.toFixed(3)})`

    // gentle push-in once the merge beat starts
    const zk = t < GREEN_AT(2) + 0.4 ? 0 : easeStd(clamp01((t - GREEN_AT(2) - 0.4) / 1.2))
    p.camTo(1 + 0.05 * zk, p.W / 2, p.H / 2)

    // card line + punchline + wins card
    P.typer.l1.run(t >= L1.at, L1.text, L1.cps, t - L1.at)
    P.line.style.opacity = t >= L1.at && t < L1.coverAt ? '1' : '0'
    P.typer.pay.run(t >= PUNCH.at, PUNCH.text, PUNCH.cps, t - PUNCH.at)
    P.pay.style.opacity = t >= PUNCH.at ? '1' : '0'

    P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('wins', t >= CUT_T)

    const inCut = Math.abs(t - CUT_T) < 0.07
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}
