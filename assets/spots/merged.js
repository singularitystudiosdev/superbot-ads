/* superbot.gg / ads — the "merged" spot.
   The site's own line, staged: "the same tool was set up 3 times". Three
   per-client setup cards slam into a messy pile, the pile jitters while
   the camera pushes in, then the whole mess snaps into a single pill —
   one tool, every client — with the site's own receipt underneath
   (2 copies removed · backup saved). Punchline, hard cut, end card.
   All timed state is set from tick() inline — no CSS transitions. */

import { easeStd, easeOutExpo, Typer } from '../engine.js'

const CLIENTS = [
  { name: 'claude code', x: 400, y: 250, r: -4 },
  { name: 'cursor', x: 640, y: 330, r: 3 },
  { name: 'codex', x: 880, y: 255, r: -2 },
]
const LAND_AT = (i) => 0.45 + i * 0.8
const CHIP_AT = 2.75
const MERGE_AT = 5.6
const MERGE_END = 6.3
const PILL_AT = 5.95
const SUB_AT = 6.9
const PUNCH_AT = 9.0
const CUT_T = 11.5

export const mergedSpot = {
  dur: 14.5,
  audit: {
    settles: [],
    wideWindows: [[0.0, 2.5], [MERGE_END, 11.3]],
    cutT: CUT_T,
    lines: [
      { at: CHIP_AT, cps: 24, text: 'the same tool, set up 3 times', sel: '[data-type="chip"]', coverAt: MERGE_AT },
      { at: SUB_AT, cps: 22, text: '2 copies removed · backup saved', sel: '[data-type="sub"]', coverAt: CUT_T },
      { at: PUNCH_AT, cps: 26, text: 'three setups. one line.', sel: '[data-type="punch"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 20, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: 14.2 },
    ],
    beats: [0.55, 1.4, 2.2, 3.4, 4.4, 5.2, 6.2, 7.3, 8.2, 9.4, 11.7, 13.2],
  },
  dom: () => `
    <style>
      .m-cap { position: absolute; left: 0; right: 0; top: 118px; text-align: center; }
      .m-cap b { display: block; font-weight: 500; font-size: 30px; letter-spacing: -0.01em; }
      .m-cap span { display: block; color: var(--muted); margin-top: 6px; font-size: 17px; }
      .m-card {
        position: absolute; width: 340px; padding: 20px 24px 22px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.45); opacity: 0;
      }
      .m-card b { display: block; font-weight: 500; font-size: 22px; }
      .m-card code { display: block; margin-top: 8px; font: 15px/1.5 var(--font-mono); color: var(--muted); }
      .m-card code em { font-style: normal; color: var(--accent); }
      .m-chip { position: absolute; left: 0; right: 0; bottom: 190px; text-align: center; font: 18px/1.4 var(--font-mono); color: #d98d76; }
      .m-one {
        position: absolute; left: 50%; top: 372px; transform: translate(-50%, 0) scale(0.8); opacity: 0;
        padding: 18px 34px; border: 1px solid var(--accent); border-radius: 999px;
        font: 500 30px/1.2 var(--font-mono); color: var(--fg);
        text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 45%, transparent);
        background: color-mix(in srgb, var(--accent) 12%, var(--card));
        box-shadow: 0 0 60px color-mix(in srgb, var(--accent) 22%, transparent);
      }
      .m-sub { position: absolute; left: 0; right: 0; top: 452px; text-align: center; font: 17px/1.5 var(--font-mono); color: var(--muted); opacity: 0; }
      .m-punch { position: absolute; left: 0; right: 0; top: 545px; text-align: center; font-size: 19px; color: var(--fg); opacity: 0; }
      .ad-player[data-ratio='9:16'] .m-cap { top: 240px; }
      .ad-player[data-ratio='9:16'] .m-card { width: 300px; }
      .ad-player[data-ratio='9:16'] .m-chip { bottom: auto; top: 660px; }
      .ad-player[data-ratio='9:16'] .m-one { top: 700px; }
      .ad-player[data-ratio='9:16'] .m-sub { top: 790px; }
      .ad-player[data-ratio='9:16'] .m-punch { top: 880px; }
      .ad-player[data-ratio='1:1'] .m-card { width: 320px; }
    </style>
    <p class="m-cap"><b>setup, counted</b><span>three AI clients · one tool</span></p>
    ${CLIENTS.map((c, i) => `
    <div class="m-card" data-card="${i}"><b>${c.name}</b><code>superbot-mcp · configured <em>✓</em></code></div>`).join('')}
    <p class="m-chip"><span class="type" data-type="chip"></span></p>
    <div class="m-one">one tool · every client</div>
    <p class="m-sub"><span class="type" data-type="sub"></span></p>
    <p class="m-punch"><span class="type" data-type="punch"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      cards: [...p.cam.querySelectorAll('.m-card')],
      one: p.cam.querySelector('.m-one'),
      chip: p.cam.querySelector('.m-chip'),
      sub: p.cam.querySelector('.m-sub'),
      punch: p.cam.querySelector('.m-punch'),
      typer: {
        chip: new Typer(p.cam.querySelector('[data-type="chip"]')),
        sub: new Typer(p.cam.querySelector('[data-type="sub"]')),
        punch: new Typer(p.cam.querySelector('[data-type="punch"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // cards slam in one per client, each landing with a stage kick
    const k = easeOutExpo(clamp01((t - MERGE_AT) / (MERGE_END - MERGE_AT)))
    P.cards.forEach((card, i) => {
      const c = CLIENTS[i]
      const on = t >= LAND_AT(i)
      const lk = easeOutExpo(clamp01((t - LAND_AT(i)) / 0.42))
      // pre-merge: the pile lives — a small restless jitter; post-merge: gone
      const mx = (p.W / 2 - c.x) * k, my = (330 - c.y) * k
      card.style.opacity = String(on ? lk * (1 - k) : 0)
      card.style.transform =
        `translate(${(c.x - 170 + mx).toFixed(1)}px, ${(c.y - 60 + my).toFixed(1)}px) ` +
        `rotate(${(c.r * (1 - k) + (t >= CHIP_AT && t < MERGE_AT ? jit(t, i) : 0)).toFixed(2)}deg)`
    })

    // chip types while the pile jitters
    P.typer.chip.run(t >= CHIP_AT, 'the same tool, set up 3 times', 22, t - CHIP_AT)
    P.chip.style.opacity = t >= CHIP_AT && t < MERGE_AT ? '1' : '0'

    // the mess snaps into one pill
    const pk = easeOutExpo(clamp01((t - PILL_AT) / 0.4))
    P.one.style.opacity = String(pk)
    P.one.style.transform = `translate(-50%, 0) scale(${(0.8 + 0.2 * pk).toFixed(3)})`
    if (t >= MERGE_AT && t < MERGE_AT + 0.05 && !P._kick) { P._kick = true; shake(p) }
    if (t < MERGE_AT - 0.05) P._kick = false

    P.typer.sub.run(t >= SUB_AT, '2 copies removed · backup saved', 22, t - SUB_AT)
    P.sub.style.opacity = t >= SUB_AT && t < CUT_T ? '1' : '0'

    P.typer.punch.run(t >= PUNCH_AT, 'three setups. one line.', 26, t - PUNCH_AT)
    P.punch.style.opacity = t >= PUNCH_AT && t < CUT_T ? '1' : '0'

    // camera: wide → push into the pile → pull back as it snaps
    let z = 1, px = p.W / 2, py = p.H / 2
    if (t >= 2.6 && t < 5.2) {
      z = 1 + 0.3 * easeStd(clamp01((t - 2.6) / 1.2))
      px = p.W / 2; py = 330
    } else if (t >= 5.2 && t < 6.1) {
      z = 1.3 + (1 - 1.3) * easeStd(clamp01((t - 5.2) / 0.9))
    }
    p.camTo(z, px, py)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 20, t - CUT_T - 0.1)
    p.cam.classList.toggle('drawn', t >= 0.3 && t < CUT_T)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}

/* pile jitter, deterministic */
function jit(t, i) {
  return Math.sin(t * 5.3 + i * 1.7) * 0.8
}

function shake(p) {
  p.stage.animate(
    [{ transform: p.stage.style.transform + ' translate(0,0)' },
     { transform: p.stage.style.transform + ' translate(3px,-2px)' },
     { transform: p.stage.style.transform + ' translate(-2px,2px)' },
     { transform: p.stage.style.transform + ' translate(0,0)' }],
    { duration: 200, easing: 'ease-out' })
}
