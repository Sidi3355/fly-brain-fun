/**
 * Ripple tank: a damped 2D wave equation on a coarse lattice, rendered as the
 * page's engineering grid seen through the water. Grid nodes are displaced by
 * the local slope of the surface (like refraction), and crests get a faint
 * accent wash. Cheap enough to run at 60 fps on a phone: one Float32 pass for
 * the physics and two batched paths for the lines.
 */

const CELL = 24; // must match --cell in global.css
const MAJOR = 5; // major grid line every 5 cells

interface Palette {
  minor: string;
  major: string;
  accent: [number, number, number];
}

function cssColor(probe: HTMLElement, value: string): string {
  probe.style.color = value;
  return getComputedStyle(probe).color;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.append(probe);
  const minor = cssColor(probe, cs.getPropertyValue('--grid-minor').trim());
  const major = cssColor(probe, cs.getPropertyValue('--grid-major').trim());
  const acc = cssColor(probe, cs.getPropertyValue('--accent').trim()).match(/\d+(\.\d+)?/g)?.map(Number) ?? [201, 56, 22];
  probe.remove();
  return { minor, major, accent: [acc[0], acc[1], acc[2]] };
}

export function initRipple(host: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // Simulation spacing: two nodes per grid cell on desktop, one on touch devices.
  const RES = coarse ? 1 : 2;
  const S = CELL / RES;
  const DAMP = 0.982;
  const GAIN = 14; // px of displacement per unit slope

  let W = 0;
  let H = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let ox = 0; // grid phase so the lattice lines up with the body background
  let oy = 0;
  let pageLeft = 0;
  let pageTop = 0;
  let a = new Float32Array(0);
  let b = new Float32Array(0);
  let shade: HTMLCanvasElement | null = null;
  let shadeCtx: CanvasRenderingContext2D | null = null;
  let shadeImg: ImageData | null = null;
  let palette = readPalette();
  let running = false;
  let visible = true;
  let energy = 0;
  let lastAmbient = 0;
  let raf = 0;

  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    pageTop = r.top + window.scrollY;
    pageLeft = r.left + window.scrollX;
    // The body grid draws its 1px lines at k·CELL − 1 in page space; centre ours on them.
    ox = -(((pageLeft % CELL) + CELL) % CELL) - 0.5;
    oy = -(((pageTop % CELL) + CELL) % CELL) - 0.5;
    cols = Math.ceil((W - ox) / S) + 2;
    rows = Math.ceil((H - oy) / S) + 2;
    a = new Float32Array(cols * rows);
    b = new Float32Array(cols * rows);

    shade = document.createElement('canvas');
    shade.width = cols;
    shade.height = rows;
    shadeCtx = shade.getContext('2d');
    shadeImg = shadeCtx ? shadeCtx.createImageData(cols, rows) : null;
    draw();
  }

  /** Raised-cosine bump of radius r (px) and height amp at (x, y) in host px. */
  function disturb(x: number, y: number, r: number, amp: number) {
    const ci = (x - ox) / S;
    const cj = (y - oy) / S;
    const rn = r / S;
    const i0 = Math.max(1, Math.floor(ci - rn));
    const i1 = Math.min(cols - 2, Math.ceil(ci + rn));
    const j0 = Math.max(1, Math.floor(cj - rn));
    const j1 = Math.min(rows - 2, Math.ceil(cj + rn));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i - ci, j - cj) / rn;
        if (d < 1) a[j * cols + i] += amp * 0.5 * (1 + Math.cos(Math.PI * d));
      }
    }
    energy = Math.max(energy, Math.abs(amp));
    start();
  }

  function step() {
    // Classic two-buffer ripple: next = (sum of 4 neighbours) / 2 − previous, damped.
    let e = 0;
    for (let j = 1; j < rows - 1; j++) {
      const row = j * cols;
      for (let i = 1; i < cols - 1; i++) {
        const k = row + i;
        let v = (a[k - 1] + a[k + 1] + a[k - cols] + a[k + cols]) * 0.5 - b[k];
        v *= DAMP;
        b[k] = v;
        const av = v < 0 ? -v : v;
        if (av > e) e = av;
      }
    }
    const t = a;
    a = b;
    b = t;
    energy = e;
  }

  function draw() {
    ctx!.clearRect(0, 0, W, H);

    // Crest wash at simulation resolution, scaled up smoothly.
    if (shade && shadeCtx && shadeImg && energy > 0.002) {
      const d = shadeImg.data;
      const [r, g, bl] = palette.accent;
      for (let k = 0, p = 0; k < a.length; k++, p += 4) {
        const v = a[k];
        d[p] = r;
        d[p + 1] = g;
        d[p + 2] = bl;
        d[p + 3] = v > 0 ? Math.min(255, v * 140) : 0;
      }
      shadeCtx.putImageData(shadeImg, 0, 0);
      ctx!.imageSmoothingEnabled = true;
      ctx!.globalAlpha = 0.55;
      ctx!.drawImage(shade, ox, oy, cols * S, rows * S);
      ctx!.globalAlpha = 1;
    }

    // Grid lines, displaced by the surface slope.
    const at = (i: number, j: number) => a[j * cols + i];
    const minor = new Path2D();
    const major = new Path2D();
    const calm = energy < 0.002;

    // Horizontal lines.
    for (let j = 0; j < rows; j += RES) {
      const isMajor = Math.round((oy + j * S + pageTop) / CELL) % MAJOR === 0;
      const path = isMajor ? major : minor;
      const jj = Math.min(Math.max(j, 1), rows - 2);
      for (let i = 0; i < cols; i++) {
        const ii = Math.min(Math.max(i, 1), cols - 2);
        const dx = calm ? 0 : (at(ii + 1, jj) - at(ii - 1, jj)) * GAIN;
        const dy = calm ? 0 : (at(ii, jj + 1) - at(ii, jj - 1)) * GAIN;
        const x = ox + i * S + dx;
        const y = oy + j * S + dy;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    }
    // Vertical lines.
    for (let i = 0; i < cols; i += RES) {
      const isMajor = Math.round((ox + i * S + pageLeft) / CELL) % MAJOR === 0;
      const path = isMajor ? major : minor;
      const ii = Math.min(Math.max(i, 1), cols - 2);
      for (let j = 0; j < rows; j++) {
        const jj = Math.min(Math.max(j, 1), rows - 2);
        const dx = calm ? 0 : (at(ii + 1, jj) - at(ii - 1, jj)) * GAIN;
        const dy = calm ? 0 : (at(ii, jj + 1) - at(ii, jj - 1)) * GAIN;
        const x = ox + i * S + dx;
        const y = oy + j * S + dy;
        if (j === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    }
    ctx!.lineWidth = 1;
    ctx!.strokeStyle = palette.minor;
    ctx!.stroke(minor);
    ctx!.strokeStyle = palette.major;
    ctx!.stroke(major);
  }

  function frame(t: number) {
    if (!running) return;
    // Ambient raindrops keep the surface alive while the hero is on screen.
    if (t - lastAmbient > 2600 + Math.random() * 1800) {
      lastAmbient = t;
      disturb(Math.random() * W, H * (0.25 + Math.random() * 0.7), 30, 0.55);
    }
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced.matches || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // Interaction: a wake behind the pointer, a big drop on press.
  let px = -1;
  let py = -1;
  let pt = 0;
  host.addEventListener('pointermove', (e) => {
    if (reduced.matches) return;
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    if (px >= 0) {
      const v = Math.hypot(x - px, y - py) / Math.max(16, now - pt);
      if (v > 0.05) disturb(x, y, 18, Math.min(0.9, v * 0.5));
    }
    px = x;
    py = y;
    pt = now;
  });
  host.addEventListener('pointerleave', () => (px = -1));
  host.addEventListener('pointerdown', (e) => {
    if (reduced.matches) return;
    const r = host.getBoundingClientRect();
    disturb(e.clientX - r.left, e.clientY - r.top, 46, 2.6);
  });
  window.addEventListener('make-wave', () => disturb(W * 0.5, H * 0.45, 70, 3.2));

  new ResizeObserver(() => resize()).observe(host);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  }).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduced.addEventListener('change', () => (reduced.matches ? (stop(), (energy = 0), draw()) : start()));
  window.addEventListener('themechange', () => {
    palette = readPalette();
    draw();
  });

  resize();
  start();
}
