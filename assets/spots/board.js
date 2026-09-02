/* superbot.gg / ads — the "board" spot.
   The comparison device is the leaderboard-in-motion: a ranked fix board
   where the rivals sit stamped ✗ ("sells you a bigger plan", "you, again,
   at 1am", "works until it doesn't") and superbot enters at rank 4, then
   physically climbs to #1 as its checklist ticks 0/3 → 3/3. The rank
   swaps ARE the argument — rows demote as superbot clears their failure.
   Deliberately no odometer, no stopwatch, no terminal typing (taken by the
   cheaper / faster spots). Tagline is the site's own line.
   Text rules of the series: ≤42 chars per card, ≥1.5s full-text dwell. */

import { SpotPlayer, easeStd, easeOutExpo, Typer } from '../engine.js'

const RH = 94 // row pitch, landscape/square design space
const RH_TALL = 116 // row pitch, 9:16 — bigger type needs the room

const RIVALS = [
  { name: 'fable 5.1', note: 'sells you a bigger plan', at: 1.4 },
  { name: 'you, manually', note: 'again · at 1am', at: 2.8 },
  { name: 'your second account', note: 'works until it doesn’t', at: 4.2 },
]
const SB_AT = 6.0
// each fix confirms and drives one rank swap: superbot and the row above
// exchange slots over [t0, t1]
const CLIMB = [
  { t0: 7.2, t1: 7.9, fix: 'rate limit → switched · 0.4s' },
  { t0: 8.6, t1: 9.3, fix: 'billing → covered · $0.00' },
  { t0: 10.0, t1: 10.7, fix: 'setup → merged · backup saved' },
]
const TAG_AT = 10.9
const CUT_T = 13.6
const DUR = 16.4

const TAGLINE = 'the last MCP you’ll ever need.'

// swap progress and row-entrance progress, both pure functions of t
const prog = (s, t) => easeOutExpo(Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0))))
const enter = (t, at) => easeOutExpo(Math.min(1, Math.max(0, (t - at) / 0.45)))

export const boardSpot = {
  dur: DUR,
  audit: {
    wideWindows: [[0.0, CUT_T - 0.2]],
    lines: [
      { at: TAG_AT, cps: 34, text: TAGLINE, sel: '[data-type="tag"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 30, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: DUR - 0.7 },
    ],
    beats: [0.3, 1.5, 2.9, 4.3, 5.3, 6.1, 6.9, 7.4, 8.1, 8.8, 9.5, 10.2, 10.9, 11.8, 12.8, 13.8, 15.2],
  },
  dom: () => `
    <style>
      .bd-card { position: absolute; margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
      .bd-card .cap { margin-bottom: 22px; }
      .bd-card .cap b { display: block; font-weight: 500; letter-spacing: -0.01em; }
      .bd-card .cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .bd-rows { position: relative; height: ${4 * RH}px; }
      .ad-player[data-ratio='9:16'] .bd-rows { height: ${4 * RH_TALL}px; }
      .bd-row { position: absolute; left: 0; right: 0; height: ${RH - 10}px; display: flex; align-items: center; gap: 20px;
        padding: 0 18px; border-radius: 10px; background: var(--raised); border: 1px solid transparent;
        will-change: transform; }
      .bd-row .rk { font: 600 22px/1 var(--font-mono); color: var(--muted); width: 30px; }
      .bd-row .who { min-width: 0; flex: 1; }
      .bd-row .who b { display: block; font-size: 24px; font-weight: 500; letter-spacing: -0.01em; }
      .bd-row .who span { display: block; color: var(--muted); font-size: 16px; margin-top: 3px; }
      .bd-row .stamp { font: 700 26px/1 var(--font-mono); opacity: 0; }
      .bd-row.out .stamp { color: #d98d76; }
      .bd-row.sb { background: color-mix(in srgb, var(--accent) 9%, var(--raised)); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
      .bd-row.sb .stamp { color: var(--accent); }
      .bd-row.sb .who b { font-weight: 600; }
      .bd-row.dim { filter: brightness(0.62); }
      .bd-row.top { border-color: var(--accent); box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 22%, transparent); }
      .bd-tally { display: inline-flex; gap: 5px; margin-top: 7px; }
      .bd-tally i { width: 9px; height: 9px; border-radius: 2px; background: var(--line); }
      .bd-tally i.on { background: var(--accent); box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent); }
      .bd-tag { margin: 24px 0 0; text-align: center; min-height: 30px; color: var(--fg); font-size: 20px; opacity: 0; }
      .bd-tag.on { opacity: 1; }
      .ad-player[data-ratio='16:9'] .bd-card { left: 240px; top: 78px; width: 800px; padding: 34px 46px 36px; }
      .ad-player[data-ratio='1:1'] .bd-card { left: 130px; top: 168px; width: 740px; padding: 34px 46px 36px; }
      .ad-player[data-ratio='9:16'] .bd-card { left: 50px; top: 300px; width: 620px; padding: 32px 40px 36px; }
      .ad-player[data-ratio='9:16'] .bd-card .cap b { font-size: 34px; }
      .ad-player[data-ratio='9:16'] .bd-row .who b { font-size: 27px; }
      .ad-player[data-ratio='9:16'] .bd-row .who span { font-size: 18px; }
    </style>
    <figure class="bd-card">
      <figcaption class="cap"><b>who fixes your agents?</b><span>live · the fix board</span></figcaption>
      <div class="bd-rows">
        ${RIVALS.map((r, i) => `
        <div class="bd-row out" data-row="${i}">
          <span class="rk">${i + 1}</span>
          <span class="who"><b>${r.name}</b><span>${r.note}</span></span>
          <span class="stamp">✗</span>
        </div>`).join('')}
        <div class="bd-row sb" data-row="sb">
          <span class="rk">4</span>
          <span class="who"><b>superbot</b><span data-sb-note style="opacity:.55">watching your agent</span>
            <span class="bd-tally"><i></i><i></i><i></i></span></span>
          <span class="stamp">✓</span>
        </div>
      </div>
      <p class="bd-tag"><span class="type" data-type="tag"></span></p>
    </figure>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      rows: [
        ...RIVALS.map((r, i) => ({ el: p.cam.querySelector(`[data-row="${i}"]`), base: i })),
        { el: p.cam.querySelector('[data-row="sb"]'), base: 3, sb: true },
      ],
      sbNote: p.cam.querySelector('[data-sb-note]'),
      tally: [...p.cam.querySelectorAll('.bd-tally i')],
      tag: p.cam.querySelector('.bd-tag'),
      tagTyper: new Typer(p.cam.querySelector('[data-type="tag"]')),
      winsTyper: new Typer(p.cam.querySelector('[data-type="wins"]')),
    })

    // slot geometry: superbot's slot falls from 3 → 0 as the swaps run; each
    // swap simultaneously demotes the displaced row one slot. All positions
    // are computed from t — no CSS transitions — so render frames are exact.
    const p1 = prog(CLIMB[0], t), p2 = prog(CLIMB[1], t), p3 = prog(CLIMB[2], t)
    const rh = p.ratio === '9:16' ? RH_TALL : RH
    const sbSlot = 3 - (p1 + p2 + p3)
    const slots = [0 + p3, 1 + p2, 2 + p1, sbSlot]
    const dimmed = [p1 > 0, p2 > 0, p3 > 0] // rival has been passed → sits low

    P.rows.forEach((r, i) => {
      const e = enter(t, r.sb ? SB_AT : RIVALS[i].at)
      r.el.style.opacity = String(e)
      r.el.style.transform = `translateY(${(slots[i] * rh + (1 - e) * 16).toFixed(2)}px)`
      r.el.classList.toggle('dim', r.sb ? false : dimmed[i])
      r.el.classList.toggle('top', r.sb && p3 >= 1)
      r.el.querySelector('.rk').textContent = String(Math.round(slots[i]) + 1)
      if (!r.sb) {
        // failure stamp slams in a beat after each rival row lands
        const k = enter(t, RIVALS[i].at + 1.0)
        const st = r.el.querySelector('.stamp')
        st.style.opacity = String(k)
        st.style.transform = `scale(${(1.8 - 0.8 * easeOutExpo(k)).toFixed(3)}) rotate(${(-9 + 5 * k).toFixed(2)}deg)`
      } else {
        const st = r.el.querySelector('.stamp')
        // superbot's check lands only once it holds rank 1
        const k = t > CLIMB[2].t1 ? enter(t, CLIMB[2].t1 + 0.15) : 0
        st.style.opacity = String(k)
        st.style.transform = `scale(${(1.8 - 0.8 * easeOutExpo(k)).toFixed(3)})`
      }
      // a swap reads as motion: the mover lifts slightly, everything holds still otherwise
      r.el.style.filter = r.sb && (p1 > 0 && p1 < 1 || p2 > 0 && p2 < 1 || p3 > 0 && p3 < 1)
        ? 'brightness(1.12)' : ''
    })

    // fix tally + note: each cleared failure lights a cell and swaps the note
    const cleared = CLIMB.filter((s) => t >= s.t0).length
    P.tally.forEach((cell, i) => cell.classList.toggle('on', i < cleared))
    if (cleared > 0) P.sbNote.textContent = CLIMB[cleared - 1].fix
    P.sbNote.style.opacity = cleared > 0 ? '1' : '0.55'

    // tagline + end card
    P.tag.classList.toggle('on', t >= TAG_AT)
    P.tagTyper.run(t >= TAG_AT, TAGLINE, 30, t - TAG_AT)
    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.winsTyper.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)

    // camera: slow drift down follows the climb, then holds
    const drift = easeStd(Math.min(1, t / CLIMB[2].t1))
    p.camTo(1 + 0.03 * drift, p.W / 2, p.H / 2 + 26 * drift)
  },
}
