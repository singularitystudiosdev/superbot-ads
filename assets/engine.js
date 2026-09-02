/* superbot.gg / ads — shared spot engine.
   Everything the ad series shares: the site's easing curves, the stage-fit
   rig, the odometer and the typewriter. Each spot (ad.js, spots/*.js) is a
   thin spec on top; no spot carries its own copy of any of this. */

export const easeStd = makeBezier(0.2, 0, 0, 1)
// site entrance curve: cubic-bezier(0.16, 1, 0.3, 1) (expo-out)
export const easeOutExpo = makeBezier(0.16, 1, 0.3, 1)
export const easeInQuad = (t) => t * t
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const RATIOS = { '16:9': [1280, 720], '1:1': [1000, 1000], '9:16': [720, 1280] }

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

/* ---- typewriter ---- */
export class Typer {
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

/* ---- odometer: rolling digit columns, mechanical carry ---- */
export class Odometer {
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
  set(v) {
    this.v = v
    // mechanical carry: a wheel rolls only while the wheel to its right
    // runs its final tenth into the 9→0 wrap, so every wheel rests on an
    // exact digit ($0.92, never $1.92 frozen mid-glyph)
    const roll = (p) => Math.max(0, p - 9)
    const p2 = (v * 100) % 10
    const p1 = (Math.floor((v * 10) % 10) + roll(p2)) % 10
    const p0 = (Math.floor(v) + roll(p1)) % 10
    const places = [p0, p1, p2]
    this.digits.forEach((d, i) => {
      // strips are 1.05em per digit — step by 1.05em so each glyph lands
      // dead-centre in its window (1em steps drift a digit half out by 9)
      d.strip.style.transform = `translate3d(0, ${(-places[i] * 1.05).toFixed(3)}em, 0)`
      // blur only the wheels that actually moved this frame
      const blur = Math.min(7, Math.abs(places[i] - d.last) * 0.9)
      d.strip.style.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none'
      d.last = places[i]
    })
  }
}

/* ---- the player rig every spot mounts through ----
   A spot = { dom(rig) → innerHTML template string, dur, tick(t) }.
   The rig owns the clock, the stage fit and the loop seam (symmetric
   fade out/in); the spot owns everything on screen. */
export class SpotPlayer {
  constructor(root, spot, opts = {}) {
    this.root = root
    this.spot = spot
    this.ratio = opts.ratio || '16:9'
    const [W, H] = RATIOS[this.ratio]
    this.W = W; this.H = H
    root.classList.add('ad-player')
    root.dataset.ratio = this.ratio
    root.innerHTML = `
      <div class="ad-stage">
        <div class="ad-cam">${spot.dom(this)}</div>
        <div class="ad-vignette"></div>
        <div class="ad-grain"></div>
        <div class="ad-flash"></div>
      </div>`
    this.stage = root.querySelector('.ad-stage')
    this.cam = root.querySelector('.ad-cam')
    this.flash = root.querySelector('.ad-flash')
    this.carets = [...root.querySelectorAll('.caret')]
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.start = performance.now()
    this.paused = false
    this.raf = this.raf.bind(this)
    this.rafId = requestAnimationFrame(this.raf)
    this.fit()
    new ResizeObserver(() => this.fit()).observe(root)
    // prime the spot at t=0 so the DOM is fully built before anything audits it
    this.spot.tick(0, this)
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
    this.fitTransform = this.stage.style.transform
  }

  /* camera: zoom about a point in design coords */
  camTo(z, px, py) {
    const cx = this.W / 2, cy = this.H / 2
    this.cam.style.transformOrigin = '0 0'
    this.cam.style.transform = `translate(${cx - z * px}px, ${cy - z * py}px) scale(${z})`
  }

  raf(now) {
    this.rafId = requestAnimationFrame(this.raf)
    if (this.paused) return
    const t = ((now - this.start) / 1000) % this.spot.dur
    this.t = t
    this.spot.tick(t, this)
    // loop seam: dim late and floor at 0.35 so the end card is still
    // legible on the final frame — the ramp finishes inside the last
    // 0.2s so the audit's seam check (t ≥ dur−0.15) sees the floor
    const fadeOut = t > this.spot.dur - 0.35 ? 0.65 * Math.min(1, (t - (this.spot.dur - 0.35)) / 0.2) : 0
    const fadeIn = t < 0.4 ? 1 - t / 0.4 : 0
    this.cam.style.opacity = String(1 - Math.max(fadeOut, fadeIn))
    // caret blink on the virtual clock — a wall-clock CSS animation
    // flickers arbitrarily per rendered frame
    if (!this.still) {
      const caretOn = (t % 0.7) < 0.35
      for (const c of this.carets) c.style.opacity = caretOn ? '' : '0'
    }
    if (this.clock) this.clock.textContent = fmtClock(t)
  }

  pause() { this.paused = true; this.root.classList.add('paused') }
  play() { this.paused = false; this.root.classList.remove('paused') }
  restart() { this.start = performance.now(); this.paused = false; this.root.classList.remove('paused') }
}

/* ---- shared shot helpers ---- */
// zoom k along a shot: [t0, t1, z0, z1, ease]
export function shotZoom(shot, t) {
  const k = Math.min(1, Math.max(0, (t - shot.t0) / (shot.t1 - shot.t0)))
  return shot.z0 + (shot.z1 - shot.z0) * (shot.ease || easeStd)(k)
}
export function fmtClock(t) {
  const m = Math.floor(t / 60), s = (t % 60).toFixed(3).padStart(6, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}
