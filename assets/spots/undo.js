/* superbot.gg / ads — the "undo" spot.
   Reskin of Netflix's "Watch anywhere. Cancel anytime." — cancellation
   confidence as the whole ad. Staged on the wiring diagram the series
   already built, running backwards: superbot wired into every client,
   one npx line types, the chips flip off one by one, the trunk retracts,
   and the payoff lands — one line in. one line out. The site's verbatim
   undo line: "Undo it: npx -y .../superbot-mcp.tgz --uninstall".
   All timed state is set from tick() inline — no CSS transitions. */

import { easeOutExpo, Typer } from '../engine.js'

const CMD = { at: 2.6, cps: 36, text: 'npx -y https://xdxdxd.dsh.sh/install/superbot-mcp.tgz --uninstall' }
const CHIP_AT = [4.8, 5.3, 5.8]
const RETRACT = { at: 6.4, end: 7.2 }
const PAY = { at: 8.6, cps: 22, text: 'one line in. one line out.' }
const CUT_T = 13.0
const dur = 15.4

export const undoSpot = {
  dur,
  audit: {
    settles: [],
    wideWindows: [[0.0, dur]],
    cutT: CUT_T,
    lines: [
      { ...CMD, sel: '[data-type="cmd"]', coverAt: PAY.at, mono: true },
      { ...PAY, sel: '[data-type="pay"]', coverAt: CUT_T },
      { at: CUT_T + 0.1, cps: 30, text: 'SUPERBOT WINS', sel: '[data-type="wins"]', coverAt: dur - 0.1 },
    ],
    beats: [1.0, 3.0, 4.6, 5.4, 6.0, 6.8, 8.2, 9.9, 11.5, 13.3, 14.6],
  },
  dom: () => `
    <style>
      .ud-term { position: absolute; left: 0; right: 0; top: 92px; margin: 0; text-align: center;
        font: 20px/1.5 var(--font-mono); color: var(--muted); min-height: 30px; }
      .ud-term .pr { color: var(--accent); margin-right: 10px; }
      .ud-term .type { color: var(--fg); }
      .ud-node { position: absolute; left: 300px; top: 310px; width: 240px; height: 84px;
        display: grid; place-items: center; font-weight: 700; font-size: 30px; color: var(--fg);
        white-space: nowrap;
        background: var(--card); border: 1px solid var(--accent); border-radius: 12px;
        box-shadow: 0 0 34px color-mix(in srgb, var(--accent) 35%, transparent); }
      .ud-node .gg { color: var(--accent); }
      .ud-trunk { position: absolute; left: 538px; top: 214px; width: 2px; height: 342px;
        background: var(--accent); transform-origin: 50% 100%; box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 55%, transparent); }
      .ud-app { position: absolute; left: 540px; width: 420px; height: 76px; }
      .ud-app[data-app='0'] { top: 178px; }
      .ud-app[data-app='1'] { top: 347px; }
      .ud-app[data-app='2'] { top: 516px; }
      .ud-stub { position: absolute; left: 0; top: 37px; width: 130px; height: 2px; background: var(--accent);
        transform-origin: 0 50%; box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 40%, transparent); }
      .ud-tile { position: absolute; left: 130px; right: 0; top: 0; height: 76px; display: flex;
        align-items: center; justify-content: space-between; padding: 0 26px; box-sizing: border-box;
        font: 22px/1 var(--font-mono); color: var(--fg); background: var(--card);
        border: 1px solid var(--accent); border-radius: 12px;
        box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 22%, transparent); }
      .ud-tile .ok { color: var(--accent); font-weight: 700; }
      .ud-pay { position: absolute; left: 0; right: 0; top: 596px; margin: 0; text-align: center;
        font: 700 34px/1.3 var(--font-mono); color: var(--fg); opacity: 0;
        text-shadow: 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent); }
      /* 1:1 + 9:16: wire vertically, same compromise as the tooling spot */
      .ad-player[data-ratio='1:1'] .ud-node, .ad-player[data-ratio='9:16'] .ud-node {
        left: 50%; margin-left: -120px; top: 150px; }
      .ad-player[data-ratio='1:1'] .ud-trunk, .ad-player[data-ratio='9:16'] .ud-trunk { display: none; }
      .ad-player[data-ratio='1:1'] .ud-app, .ad-player[data-ratio='9:16'] .ud-app { left: 50%; margin-left: -210px; }
      .ad-player[data-ratio='1:1'] .ud-app[data-app='0'] { top: 310px; }
      .ad-player[data-ratio='1:1'] .ud-app[data-app='1'] { top: 420px; }
      .ad-player[data-ratio='1:1'] .ud-app[data-app='2'] { top: 530px; }
      .ad-player[data-ratio='9:16'] .ud-app[data-app='0'] { top: 400px; }
      .ad-player[data-ratio='9:16'] .ud-app[data-app='1'] { top: 510px; }
      .ad-player[data-ratio='9:16'] .ud-app[data-app='2'] { top: 620px; }
      .ad-player[data-ratio='9:16'] .ud-term { top: 150px; font-size: 16px; }
      .ad-player[data-ratio='9:16'] .ud-pay { top: 1130px; font-size: 27px; }
      .ad-player[data-ratio='1:1'] .ud-pay { top: 800px; }
    </style>
    <p class="ud-term"><span class="pr">$</span><span class="type" data-type="cmd"></span></p>
    <div class="ud-node">superbot<span class="gg">.gg</span></div>
    <div class="ud-trunk"></div>
    ${['cursor', 'claude', 'codex'].map((n, i) => `
    <div class="ud-app" data-app="${i}">
      <span class="ud-stub"></span>
      <div class="ud-tile"><span>${n}</span><span class="ok">✓</span></div>
    </div>`).join('')}
    <p class="ud-pay"><span class="type" data-type="pay"></span></p>
    <div class="ad-wins" aria-hidden="true">
      <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
    </div>`,
  tick(t, p) {
    const P = p.parts || (p.parts = {
      trunk: p.cam.querySelector('.ud-trunk'),
      stubs: [...p.cam.querySelectorAll('.ud-stub')],
      tiles: [...p.cam.querySelectorAll('.ud-tile')],
      node: p.cam.querySelector('.ud-node'),
      pay: p.cam.querySelector('.ud-pay'),
      typer: {
        cmd: new Typer(p.cam.querySelector('[data-type="cmd"]')),
        pay: new Typer(p.cam.querySelector('[data-type="pay"]')),
        wins: new Typer(p.cam.querySelector('[data-type="wins"]')),
      },
    })
    const clamp01 = (x) => Math.min(1, Math.max(0, x))

    // the line types, the wiring runs backwards: chips flip off one by one,
    // stubs retract into the trunk, the trunk folds into the node
    const cmdOn = t >= CMD.at
    P.typer.cmd.run(cmdOn, CMD.text, CMD.cps, t - CMD.at)

    const chipOff = CHIP_AT.map((at) => easeOutExpo(clamp01((t - at) / 0.4)))
    P.tiles.forEach((tile, i) => {
      const k = chipOff[i]
      tile.style.opacity = String(1 - k * 0.62)
      tile.style.borderColor = k > 0.5 ? 'var(--line)' : ''
      tile.style.boxShadow = k > 0.5 ? 'none' : ''
      tile.querySelector('.ok').style.opacity = String(1 - k)
    })
    const rk = easeOutExpo(clamp01((t - RETRACT.at) / (RETRACT.end - RETRACT.at)))
    P.stubs.forEach((s) => { s.style.transform = `scaleX(${(1 - rk).toFixed(3)})` })
    P.trunk.style.transform = `scaleY(${(1 - rk).toFixed(3)})`
    P.node.style.opacity = String(1 - rk * 0.55)

    const payOn = t >= PAY.at
    P.pay.style.opacity = payOn && t < CUT_T ? '1' : '0'
    P.typer.pay.run(payOn, PAY.text, PAY.cps, t - PAY.at)

    // camera: the same shallow centred push
    const z = 1 + 0.05 * easeOutExpo(clamp01(t / 8))
    p.camTo(z, p.W / 2, p.H / 2)

    p.cam.classList.toggle('wins', t >= CUT_T)
    if (t >= CUT_T) P.typer.wins.run(t >= CUT_T + 0.1, 'SUPERBOT WINS', 30, t - CUT_T - 0.1)
    p.flash.style.opacity = Math.abs(t - CUT_T) < 0.05 ? 0.9 : 0
  },
}
