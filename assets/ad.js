/* superbot.gg / ads — the cost-per-task spot.
   One looping, camera-driven ad rendered live in the page: wide shot of the
   cost figure (the benchmarks page's own .fig shape), a Gemini-style focus
   pull onto fable 5.1 as its bar fills to $9.90, back out, onto superbot as
   it fills to $0.92, then a hard cut to the SUPERBOT WINS card.
   Camera + odometer + typewriter are all rAF-tweened on the site's own
   curves (--ease-std for camera, --ease-out for entrances). */

const easeStd = makeBezier(0.2, 0, 0, 1)
// site entrance curve: cubic-bezier(0.16, 1, 0.3, 1) (expo-out)
const easeOutExpo = makeBezier(0.16, 1, 0.3, 1)
const easeInQuad = (t) => t * t
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function makeBezier(x1, y1, x2, y2) {
  // sampled once per (fn, t) — cheap enough at 60fps for a handful of curves
  const NEWTON = 8, EPS = 1e-6
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t) => ((ay * t + by) * t + cy) * t
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    let t = x
    for (let i = 0; i < NEWTON; i++) {
      const d = sampleX(t) - x
      if (Math.abs(d) < EPS) break
      t -= d / (sampleDX(t) || 1e-6)
    }
    return sampleY(Math.min(1, Math.max(0, t)))
  }
}

/* the spot. DUR is the full loop; every beat below is keyed to it. */
const DUR = 15.7
const FABLE_MAX = 9.9, US_MAX = 0.92
const CHEAPER = (FABLE_MAX / US_MAX).toFixed(1)

// camera shots: [t0, t1, focus, zoomFrom, zoomTo, ease]
// focus null = wide. zoom targets are resolved to element centres at mount.
const SHOTS = [
  { t0: 0.0,  t1: 1.9,  focus: null },
  { t0: 1.9,  t1: 2.8,  focus: 'fable', z0: 1, z1: 1.6, ease: easeStd },
  { t0: 2.8,  t1: 6.1,  focus: 'fable', hold: true },
  { t0: 6.1,  t1: 7.0,  focus: null, z0: 1.6, z1: 1, ease: easeStd },
  { t0: 7.0,  t1: 7.85, focus: 'us', z0: 1, z1: 1.6, ease: easeStd },
  { t0: 7.85, t1: 10.95, focus: 'us', hold: true },
  { t0: 10.95, t1: 11.55, focus: null, z0: 1.6, z1: 1, ease: easeOutExpo },
  { t0: 11.55, t1: 11.8, focus: null, hold: true },
  { t0: 11.8, t1: DUR, focus: null, hold: true }, // wins card lives here
]
// bar fills: [t0, t1, from, to, ease]  — odometer and bar share the tween
const FILLS = [
  { who: 'fable', t0: 2.8, t1: 5.3, v0: 0, v1: FABLE_MAX, ease: easeInOutCubic },
  { who: 'us', t0: 7.85, t1: 10.35, v0: 0, v1: US_MAX, ease: easeOutExpo },
]
const HITS = { fable: 5.3, us: 10.35 }
const CUT_T = 11.8

export class SuperbotAd {
  constructor(root, opts = {}) {
    this.root = root
    this.ratio = opts.ratio || '16:9'
    this.build()
    this.start = performance.now()
    this.paused = false
    this.punch = 0
    this.raf = this.raf.bind(this)
    this.rafId = requestAnimationFrame(this.raf)
  }

  /* ---- DOM ---- */
  build() {
    const [W, H] = { '16:9': [1280, 720], '1:1': [1000, 1000], '9:16': [720, 1280] }[this.ratio]
    this.W = W; this.H = H
    this.root.classList.add('ad-player')
    this.root.dataset.ratio = this.ratio
    this.root.innerHTML = `
      <div class="ad-stage">
        <div class="ad-cam">
          <figure class="ad-fig">
            <figcaption class="cap"><b>cost per task</b><span>dollars · lower is better</span></figcaption>
            <div class="chart">
              <div class="col us">
                <span class="val"><span class="cur">$</span><span class="od" data-od="us"></span></span>
                <span class="track"><span class="bar"></span><span class="hit-ring"></span></span>
                <span class="name">superbot</span>
              </div>
              <div class="col fable">
                <span class="val"><span class="cur">$</span><span class="od" data-od="fable"></span></span>
                <span class="track"><span class="bar"></span><span class="hit-ring"></span></span>
                <span class="name">fable 5.1</span>
              </div>
            </div>
            <p class="ad-punchline"><span class="type" data-type="punch"></span></p>
          </figure>
          <div class="ad-wins" aria-hidden="true">
            <p class="wins-line big"><span class="type wins-type" data-type="wins"></span><span class="caret"></span></p>
            <p class="wins-line sub"><span class="type" data-type="sub"></span></p>
            <p class="wins-mark">superbot<span class="gg">.gg</span></p>
            <span class="wins-rule"></span>
          </div>
        </div>
        <div class="ad-vignette"></div>
        <div class="ad-grain"></div>
        <div class="ad-flash"></div>
      </div>`

    this.stage = this.root.querySelector('.ad-stage')
    this.cam = this.root.querySelector('.ad-cam')
    this.flash = this.root.querySelector('.ad-flash')
    this.cols = {
      us: this.cam.querySelector('.col.us'),
      fable: this.cam.querySelector('.col.fable'),
    }
    this.trackH = { us: 0, fable: 0 }
    this.odos = {}
    for (const who of ['us', 'fable']) {
      this.odos[who] = new Odometer(this.cam.querySelector(`[data-od="${who}"]`))
      this.cols[who].classList.add(who === 'us' ? 'us' : 'them')
    }
    this.typer = {
      punch: new Typer(this.cam.querySelector('[data-type="punch"]')),
      wins: new Typer(this.cam.querySelector('[data-type="wins"]')),
      sub: new Typer(this.cam.querySelector('[data-type="sub"]')),
    }
    this.wins = this.cam.querySelector('.ad-wins')
    this.fit()
    new ResizeObserver(() => this.fit()).observe(this.root)
  }

  fit() {
    const r = this.root.getBoundingClientRect()
    // the site sheet zooms html on wide screens; rects come back in visual
    // px while transforms are local — normalise by the cumulative zoom
    const z = r.width / (this.root.offsetWidth || r.width || 1) || 1
    const s = Math.min(r.width / (this.W * z), r.height / (this.H * z))
    this.scale = s
    this.stage.style.width = this.W + 'px'
    this.stage.style.height = this.H + 'px'
    const ox = (r.width / z - this.W * s) / 2, oy = (r.height / z - this.H * s) / 2
    this.stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`
  }

  /* centre of an element, in design coords, relative to .ad-cam */
  centre(el) {
    let x = 0, y = 0, n = el
    while (n && n !== this.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 }
  }

  /* ---- clock ---- */
  setClock(el) { this.clock = el }

  /* ---- frame ---- */
  raf(now) {
    this.rafId = requestAnimationFrame(this.raf)
    if (this.paused) return
    const t = ((now - this.start) / 1000) % DUR
    this.t = t
    this.tick(t, now)
    if (this.clock) this.clock.textContent = fmtClock(t)
  }

  tick(t, now) {
    // camera
    let shot = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]
    let z = shot.z0 ?? 1, px = this.W / 2, py = this.H / 2
    if (shot.focus) { const c = this.centre(this.cols[shot.focus]); px = c.x; py = c.y - 14 }
    if (!shot.hold && shot.z0 !== undefined) {
      const k = easeSeg(shot, t)
      z = shot.z0 + (shot.z1 - shot.z0) * k
    } else if (shot.focus && shot.z0 === undefined) {
      z = 1.6
    }
    // camera punch on hits: a short zoom impulse that springs back
    const p = this.punch
    if (p > 0.0005) z *= 1 + p * 0.05
    const cx = this.W / 2, cy = this.H / 2
    this.cam.style.transformOrigin = '0 0'
    this.cam.style.transform = `translate(${cx - z * px}px, ${cy - z * py}px) scale(${z})`
    this.cam.style.filter = p > 0.001 ? `blur(${p * 2.2}px)` : 'none'
    this.punch = Math.max(0, p - p * 0.09 - 0.0006)

    // depth of field on the unfocused column + caption
    this.cam.classList.toggle('focus-fable', shot.focus === 'fable')
    this.cam.classList.toggle('focus-us', shot.focus === 'us')
    const wide = !shot.focus
    this.cam.classList.toggle('wide', wide)

    // fills
    let fableV = 0, usV = 0, fableVel = 0, usVel = 0
    for (const f of FILLS) {
      if (t >= f.t1) { if (f.who === 'fable') fableV = f.v1; else usV = f.v1 }
      else if (t > f.t0) {
        const k = f.ease((t - f.t0) / (f.t1 - f.t0))
        const v = f.v0 + (f.v1 - f.v0) * k
        const vel = (f.v1 - f.v0) / (f.t1 - f.t0) * deriv(f.ease, (t - f.t0) / (f.t1 - f.t0), f.t1 - f.t0)
        if (f.who === 'fable') { fableV = v; fableVel = vel } else { usV = v; usVel = vel }
      }
    }
    this.odos.fable.set(fableV, fableVel)
    this.odos.us.set(usV, usVel)
    this.setBar('fable', fableV / FABLE_MAX)
    this.setBar('us', usV / FABLE_MAX)
    this.cam.querySelector('.col.us .bar').style.setProperty('--glow', usV > 0 ? 1 : 0)

    // hits
    for (const [who, ht] of Object.entries(HITS)) {
      const col = this.cols[who]
      if (t >= ht && t < ht + 0.55 && !col.dataset.hitAt) {
        col.dataset.hitAt = String(now)
        col.classList.add('hit')
        this.punch = 1
        this.shake()
      } else if (t < ht - 0.05) {
        delete col.dataset.hitAt
        col.classList.remove('hit')
      }
    }

    // punchline + wins card
    this.typer.punch.run(t >= 11.55, '10.8× cheaper per task.', 26)
    const winsOn = t >= CUT_T
    this.cam.classList.toggle('wins', winsOn)
    if (winsOn) {
      const w = t - CUT_T
      this.typer.wins.run(w >= 0, 'SUPERBOT WINS', 55, w)
      this.typer.sub.run(w >= 1.15, `$0.92 per task · fable 5.1: $9.90 — ${CHEAPER}× cheaper`, 18, w - 1.15)
      this.wins.querySelector('.wins-rule').classList.toggle('on', w >= 2.1)
      this.wins.querySelector('.wins-mark').classList.toggle('on', w >= 2.3)
    }

    // cut flash + loop fade
    this.cam.classList.toggle('drawn', t >= 0.55 && t < CUT_T)
    const inCut = Math.abs(t - CUT_T) < 0.05
    this.flash.style.opacity = inCut ? 0.9 : 0
    const fade = t > DUR - 0.5 ? (t - (DUR - 0.5)) / 0.5 : 0
    this.cam.style.opacity = String(1 - fade)
    this.stage.style.setProperty('--shake', '0px')
  }

  setBar(who, frac) {
    const bar = this.cols[who].querySelector('.bar')
    bar.style.setProperty('--h', (Math.max(0, Math.min(1, frac)) * 100).toFixed(2) + '%')
  }

  shake() {
    this.stage.animate(
      [{ transform: this.stage.style.transform + ' translate(0,0)' },
       { transform: this.stage.style.transform + ' translate(4px,-3px)' },
       { transform: this.stage.style.transform + ' translate(-3px,2px)' },
       { transform: this.stage.style.transform + ' translate(0,0)' }],
      { duration: 240, easing: 'ease-out' })
  }

  pause() { this.paused = true; this.root.classList.add('paused') }
  play() { this.paused = false; this.root.classList.remove('paused') }
  restart() { this.start = performance.now(); this.paused = false; this.root.classList.remove('paused') }
}

function easeSeg(shot, t) {
  const k = Math.min(1, Math.max(0, (t - shot.t0) / (shot.t1 - shot.t0)))
  return (shot.ease || easeStd)(k)
}
function deriv(fn, x, span) {
  const h = 0.004
  return (fn(Math.min(1, x + h)) - fn(Math.max(0, x - h))) / (2 * h * span)
}
function fmtClock(t) {
  const m = Math.floor(t / 60), s = (t % 60).toFixed(3).padStart(6, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

/* ---- odometer: rolling digit columns, velocity-blurred ---- */
class Odometer {
  constructor(el) {
    this.el = el
    this.el.innerHTML = `<span class="od-d" data-d="1"></span><span class="od-dot">.</span><span class="od-d" data-d="2"></span><span class="od-d" data-d="3"></span>`
    this.digits = [...this.el.querySelectorAll('.od-d')].map((d) => {
      const strip = document.createElement('span')
      strip.className = 'od-strip'
      strip.innerHTML = Array.from({ length: 20 }, (_, i) => `<span>${i % 10}</span>`).join('')
      d.appendChild(strip)
      return { wrap: d, strip, last: 0 }
    })
    this.v = 0
  }
  // pos: continuous digit position (units, tenths, hundredths of v)
  set(v, vel = 0) {
    this.v = v
    const places = [1, 10, 100]
    const speeds = [1, 10, 100]
    this.digits.forEach((d, i) => {
      const pos = (v * places[i]) % 10
      d.strip.style.transform = `translate3d(0, ${(-pos).toFixed(3)}em, 0)`
      const blur = Math.min(7, Math.abs(vel) * speeds[i] * 0.9)
      d.strip.style.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none'
      d.last = pos
    })
  }
}

/* ---- typewriter ---- */
class Typer {
  constructor(el) {
    this.el = el
    this.full = ''
    this.shown = -1
    this.el.textContent = ''
  }
  run(on, text, cps, localT = 0) {
    if (!on) { if (this.shown !== 0) { this.el.textContent = ''; this.shown = 0; this.full = '' } return }
    if (text !== this.full) { this.full = text; this.shown = 0 }
    const want = Math.min(text.length, Math.floor(localT * cps))
    if (want !== this.shown) { this.shown = want; this.el.textContent = text.slice(0, want) }
  }
}
