/* superbot.gg / ads — the "pipeline" spot.
   Screenlife on a CI log: the run hits the billing cap at 2am — a red
   "429, retry in 58m" — and the timestamps are the argument: superbot
   reroutes to the backup client and the jobs go green one after another
   while a greyed rival job stays stuck at its retry. The wall-clock cost
   is the punchline: 58 minutes of waiting, or 4.
   Not a stopwatch (faster), not two terminals (handsoff): the first spot
   where the log's own timeline carries the comparison.
   Series rules: ≤42 chars/card, ≥1.5s dwell, SUPERBOT WINS end card.
   All timed state set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const L1 = { at: 0.6, cps: 24, text: 'cap hit at 2am.', coverAt: 9.2 }
const REROUTE = { at: 1.9, cps: 32, text: 'superbot: rerouted · build continues' }
const RIVAL = { at: 3.6, cps: 30, text: 'other agents: still queued to retry' }
const SUMMARY = { at: 9.4, cps: 30, text: 'all checks passed · 4m 12s' }
const PUNCH = { at: 9.9, cps: 28, text: '58 minutes waiting. or 4.' }
const CUT_T = 13.2

// job rows: [name, spinner starts, goes green, landed-at clock]
const JOBS = [
  { nm: 'build', spin: 0.0, ok: 4.2, ts: '02:01:06' },
  { nm: 'test', spin: 6.0, ok: 7.4, ts: '02:03:41' },
  { nm: 'deploy', spin: 7.8, ok: 9.0, ts: '02:04:58' },
]

export const pipelineSpot = {
  dur: 16.0,
  audit: {
    settles: [],
    wideWindows: [[0.0, 13.0]],
    cutT: CUT_T,
    lines: [
      { at: L1.at, cps: L1.cps, text: L1.text, sel: '[data-type="l1"]', coverAt: L1.coverAt },
      { at: REROUTE.at, cps: REROUTE.cps, text: REROUTE.text, sel: '[data-type="rr"]', coverAt: CUT_T },
      { at: RIVAL.at, cps: RIVAL.cps, text: RIVAL.text, sel: '[data-type="rv"]', coverAt: CUT_T },
      { at: SUMMARY.at, cps: SUMMARY.cps, text: SUMMARY.text, sel: '[data-type="sum"]', coverAt: CUT_T },
      { at: PUNCH.at, cps: PUNCH.cps, text: PUNCH.text, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 15.7 },
    ],
    beats: [0.7, 1.4, 2.5, 3.7, 4.3, 6.1, 7.5, 9.1, 9.6, 11.0, 12.1, 13.4],
  },
  dom: () => `
    <style>
      .pl-card {
        position: absolute; left: 240px; top: 84px; width: 800px; height: 500px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 22px 30px; box-sizing: border-box;
      }
      .pl-head { display: flex; align-items: baseline; gap: 14px; }
      .pl-head b { font-weight: 500; font-size: 22px; letter-spacing: -0.01em; }
      .pl-clock { font: 15px/1.2 var(--font-mono); color: var(--muted); font-variant-numeric: tabular-nums; }
      .pl-log { margin-top: 18px; font: 16px/1 var(--font-mono); }
      .pl-line { display: flex; align-items: center; gap: 14px; height: 44px; margin: 6px 0;
        padding: 0 16px; border-radius: 8px; opacity: 0; }
      .pl-line .nm { color: var(--fg); }
      .pl-line .tx { color: var(--muted); font-size: 14px; }
      .pl-line .ts { margin-left: auto; color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
      .pl-line.err { background: color-mix(in srgb, #d98d76 9%, transparent); }
      .pl-line.err .tx, .pl-line.err .st { color: #d98d76; }
      .pl-line.good { background: color-mix(in srgb, var(--accent) 8%, transparent); }
      .pl-line.dim .nm, .pl-line.dim .tx { color: var(--muted); opacity: 0.75; }
      .pl-line .st { font-style: normal; font-weight: 700; width: 22px; text-align: center; }
      .pl-line .st.ok { color: var(--accent); }
      .pl-line .st.sp { color: var(--muted); font-size: 15px; }
      .pl-sum { margin-top: 16px; text-align: center; font: 700 18px/1.4 var(--font-mono); color: var(--fg);
        opacity: 0; text-shadow: 0 0 22px color-mix(in srgb, var(--accent) 40%, transparent); }
      .pl-pay { position: absolute; left: 0; right: 0; top: 622px; margin: 0; text-align: center;
        font: 700 21px/1.2 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ad-player[data-ratio='9:16'] .pl-card { left: 30px; top: 190px; width: 660px; height: 640px; }
      .ad-player[data-ratio='9:16'] .pl-pay { top: 900px; }
      .ad-player[data-ratio='1:1'] .pl-card { left: 120px; top: 100px; width: 760px; height: 580px; }
      .ad-player[data-ratio='1:1'] .pl-pay { top: 740px; }
    </style>
    <div class="pl-card">
      <div class="pl-head"><b>run #4182 · deploy</b><span class="pl-clock" data-clock>02:01:03</span></div>
      <div class="pl-log">
        ${JOBS.map((j, i) => `
        <p class="pl-line job" data-job="${i}">
          <span class="st sp" data-jsp="${i}">◠</span><span class="st ok" data-jok="${i}">✓</span>
          <span class="nm">${j.nm}</span><span class="tx" data-jtx="${i}"></span>
          <span class="ts">${j.ts}</span>
        </p>`).join('')}
        <p class="pl-line err" data-errline><span class="st">✗</span><span class="tx type" data-type="l1"></span><span class="ts">02:01:04</span></p>
        <p class="pl-line" data-rrline><span class="st ok">→</span><span class="tx type" data-type="rr"></span><span class="ts">02:01:05</span></p>
        <p class="pl-line dim" data-rvline><span class="st">…</span><span class="tx type" data-type="rv"></span><span class="ts">02:01:04</span></p>
      </div>
      <p class="pl-sum"><span class="type" data-type="sum"></span></p>
    </div>
    <p class="pl-pay"><span class="type" data-type="pay"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      jobs: [...p.cam.querySelectorAll('.pl-line.job')],
      jsp: [...p.cam.querySelectorAll('[data-jsp]')],
      jok: [...p.cam.querySelectorAll('[data-jok]')],
      lines: {
        err: p.cam.querySelector('[data-errline]'),
        rr: p.cam.querySelector('[data-rrline]'),
        rv: p.cam.querySelector('[data-rvline]'),
      },
      clock: p.cam.querySelector('[data-clock]'),
      sum: p.cam.querySelector('.pl-sum'),
      typer: {
        l1: new Typer(p.cam.querySelector('[data-type="l1"]')),
        rr: new Typer(p.cam.querySelector('[data-type="rr"]')),
        rv: new Typer(p.cam.querySelector('[data-type="rv"]')),
        sum: new Typer(p.cam.querySelector('[data-type="sum"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
      pay: p.cam.querySelector('.pl-pay'),
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // jobs: the row draws in just before its spinner starts, then
    // spinner while running, green when superbot lands it
    JOBS.forEach((j, i) => {
      const on = t >= 0.35 + i * 0.2
      const spun = t >= j.spin && t < j.ok
      const kk = easeOutExpo(clamp01((t - j.ok) / 0.28))
      P.jobs[i].style.opacity = on ? '1' : '0'
      P.jsp[i].style.opacity = spun ? '1' : '0'
      if (spun) P.jsp[i].style.transform = `rotate(${((t * 2.6) % 1) * 360}deg)`
      P.jok[i].style.opacity = String(t >= j.ok ? kk : 0)
    })

    // log lines: the error, the reroute, the stuck rival
    P.typer.l1.run(t >= L1.at, L1.text, L1.cps, t - L1.at)
    P.lines.err.style.opacity = t >= L1.at ? '1' : '0'
    P.typer.rr.run(t >= REROUTE.at, REROUTE.text, REROUTE.cps, t - REROUTE.at)
    P.lines.rr.style.opacity = t >= REROUTE.at ? '1' : '0'
    P.typer.rv.run(t >= RIVAL.at, RIVAL.text, RIVAL.cps, t - RIVAL.at)
    P.lines.rv.style.opacity = t >= RIVAL.at ? '1' : '0'
    P.typer.sum.run(t >= SUMMARY.at, SUMMARY.text, SUMMARY.cps, t - SUMMARY.at)
    P.sum.style.opacity = t >= SUMMARY.at ? '1' : '0'

    // the wall clock is the spine — it ticks through the whole run
    const secs = 2 * 3600 + 1 * 60 + 3 + Math.floor(t)
    const hh = String(Math.floor(secs / 3600)).padStart(2, '0')
    const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    P.clock.textContent = `${hh}:${mm}:${ss}`

    // punchline + wins card
    P.typer.pay.run(t >= PUNCH.at, PUNCH.text, PUNCH.cps, t - PUNCH.at)
    P.pay.style.opacity = t >= PUNCH.at ? '1' : '0'
    P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('wins', t >= CUT_T)

    const inCut = Math.abs(t - CUT_T) < 0.07
    p.flash.style.opacity = inCut ? 0.9 : 0
  },
}
