// 139k neurons as glowing points at their cell bodies.
import * as THREE from "three";
import { CLASSES, NTS, SIDES, glow } from "../theme.js";

const VERT = /* glsl */`
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  attribute float aSeed;
  attribute float aReveal;
  attribute float aState;
  attribute float aAct;
  uniform float uTime, uScale, uSize, uMix, uReveal, uFocus, uDimTo, uFlash;
  varying vec3 vColor;
  varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float born = smoothstep(aReveal, aReveal + 0.015, uReveal);
    float front = (1.0 - smoothstep(0.0, 0.03, abs(uReveal - aReveal))) * uFlash;
    float hi = step(1.5, aState);          // 2 = highlighted
    float shown = step(0.5, aState);       // 0 = filtered out
    float dim = mix(1.0, mix(uDimTo, 1.0, hi), uFocus);
    float tw = 0.85 + 0.15 * sin(uTime * (0.6 + aSeed) + aSeed * 60.0);
    float size = uSize * (0.55 + 0.9 * aSeed) * (1.0 + front * 2.2 + aAct * 3.2 + hi * uFocus * 0.9);
    gl_PointSize = clamp(size * uScale / -mv.z, 0.0, 64.0);
    vec3 base = mix(aColorA, aColorB, uMix);
    vColor = base * tw * (1.0 + front * 2.5) + vec3(0.75, 0.97, 1.0) * aAct * 2.2;
    vAlpha = born * shown * dim;
  }`;

const FRAG = /* glsl */`
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    if (a * vAlpha < 0.003) discard;
    gl_FragColor = vec4(vColor * a * vAlpha * uIntensity, 1.0);
  }`;

export class NeuronLayer {
  constructor(world, cols, meta) {
    this.world = world;
    this.meta = meta;
    this.n = meta.count;
    this.cols = cols;
    const pos = new Float32Array(this.n * 3);
    const q = 1 / meta.quant;
    for (let i = 0; i < pos.length; i++) pos[i] = cols.pos[i] * q;
    this.positions = pos;

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.colorA = new THREE.BufferAttribute(new Float32Array(this.n * 3), 3);
    this.colorB = new THREE.BufferAttribute(new Float32Array(this.n * 3), 3);
    const seed = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) seed[i] = Math.random();
    this.reveal = new THREE.BufferAttribute(new Float32Array(this.n), 1);
    this.state = new THREE.BufferAttribute(new Float32Array(this.n).fill(1), 1);
    this.act = new THREE.BufferAttribute(new Float32Array(this.n), 1);
    this.act.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("aColorA", this.colorA);
    g.setAttribute("aColorB", this.colorB);
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aReveal", this.reveal);
    g.setAttribute("aState", this.state);
    g.setAttribute("aAct", this.act);
    g.computeBoundingSphere();

    this.uniforms = {
      uTime: { value: 0 }, uScale: { value: 1 }, uSize: { value: 2.3 }, uMix: { value: 1 },
      uReveal: { value: 2 }, uFocus: { value: 0 }, uDimTo: { value: 0.07 }, uFlash: { value: 1 },
      uIntensity: { value: 0.3 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    world.brain.add(this.points);

    this.setRevealOrder("depth");
    this.colorMode = null;
    this.setColorMode("class", true);
    world.onFrame((dt, t) => {
      this.uniforms.uTime.value = t;
      this.uniforms.uScale.value = world.pointScale;
    });
  }

  // Reveal order: front-to-back like the section sweep (FAFB z runs posterior in site -Z).
  setRevealOrder(kind) {
    const r = this.reveal.array, p = this.positions;
    if (kind === "depth") {
      const zmin = this.meta.bounds.min[2], zmax = this.meta.bounds.max[2];
      for (let i = 0; i < this.n; i++) r[i] = (zmax - p[i * 3 + 2]) / (zmax - zmin);
    }
    this.reveal.needsUpdate = true;
  }

  colorsFor(mode) {
    const out = new Float32Array(this.n * 3);
    const m = this.meta;
    let lut, codes;
    if (mode === "class") { codes = this.cols.super; lut = m.superClasses.map((c) => glow((CLASSES[c] || CLASSES[""]).color)); }
    else if (mode === "nt") { codes = this.cols.nt; lut = m.nts.map((c) => glow((NTS[c] || NTS[""]).color)); }
    else if (mode === "side") { codes = this.cols.side; lut = m.sides.map((c) => glow((SIDES[c] || SIDES[""]).color)); }
    else if (mode === "lineage") {
      codes = this.cols.lineage;
      lut = m.lineages.map((_, i) => {
        if (i === 0) return [0.3, 0.29, 0.38];
        const c = new THREE.Color().setHSL((i * 0.61803) % 1, 0.72, 0.6);
        return [c.r, c.g, c.b];
      });
    } else if (mode === "white") {
      out.fill(0.85);
      return out;
    }
    for (let i = 0; i < this.n; i++) {
      const c = lut[codes[i]] || [0.4, 0.4, 0.5];
      out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2];
    }
    return out;
  }

  setColorMode(mode, instant = false) {
    if (mode === this.colorMode) return;
    this.colorMode = mode;
    const next = this.colorsFor(mode);
    if (instant) {
      this.colorA.array.set(next); this.colorB.array.set(next);
      this.colorA.needsUpdate = this.colorB.needsUpdate = true;
      this.uniforms.uMix.value = 1;
      return;
    }
    // current displayed colour -> A, new -> B, animate the mix
    const a = this.colorA.array, b = this.colorB.array, k = this.uniforms.uMix.value;
    for (let i = 0; i < a.length; i++) a[i] = a[i] + (b[i] - a[i]) * k;
    b.set(next);
    this.colorA.needsUpdate = this.colorB.needsUpdate = true;
    this.tween("uMix", 0, 1, 1.2);
  }

  tween(name, from, to, dur) {
    const u = this.uniforms[name];
    u.value = from;
    const t0 = this.world.time;
    if (this._tw?.[name]) this._tw[name]();
    this._tw = this._tw || {};
    const off = this.world.onFrame((dt, t) => {
      const k = Math.min(1, (t - t0) / dur);
      u.value = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      if (k >= 1) { off(); delete this._tw[name]; }
    });
    this._tw[name] = off;
  }

  stopTween(name) { this._tw?.[name]?.(); if (this._tw) delete this._tw[name]; }

  // mask: Uint8Array/Array of 0|1 (visible) ; highlight: Set or array of indices
  setVisibility(mask) {
    const s = this.state.array;
    for (let i = 0; i < this.n; i++) s[i] = mask ? (mask[i] ? 1 : 0) : 1;
    this.state.needsUpdate = true;
    this._mask = mask || null;
  }

  setHighlight(indices, dimTo = 0.07) {
    const s = this.state.array;
    for (let i = 0; i < this.n; i++) s[i] = this._mask ? (this._mask[i] ? 1 : 0) : 1;
    if (indices && indices.length) {
      for (const i of indices) s[i] = 2;
      this.uniforms.uDimTo.value = dimTo;
      this.tween("uFocus", this.uniforms.uFocus.value, 1, 0.8);
    } else {
      this.tween("uFocus", this.uniforms.uFocus.value, 0, 0.8);
    }
    this.state.needsUpdate = true;
  }

  centroid(indices) {
    const c = [0, 0, 0];
    if (!indices.length) return c;
    for (const i of indices) { c[0] += this.positions[i * 3]; c[1] += this.positions[i * 3 + 1]; c[2] += this.positions[i * 3 + 2]; }
    // brain group mirrors x
    return [-c[0] / indices.length, c[1] / indices.length, c[2] / indices.length];
  }

  worldPos(i) { return [-this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]]; }

  // Nearest visible point to a screen ray, in pixels. Returns index or -1.
  pick(ndcX, ndcY, maxPx = 9) {
    const cam = this.world.camera;
    const w = this.world.renderer.domElement.clientWidth, h = this.world.renderer.domElement.clientHeight;
    const m = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(this.points.matrixWorld);
    const e = m.elements, p = this.positions, s = this.state.array;
    const focus = this.uniforms.uFocus.value > 0.5;
    const rev = this.uniforms.uReveal.value, rv = this.reveal.array;
    let best = -1, bestD = maxPx * maxPx, bestZ = Infinity;
    const sx = w / 2, sy = h / 2, px = ndcX * sx, py = ndcY * sy;
    for (let i = 0; i < this.n; i++) {
      if (s[i] < 0.5 || (focus && s[i] < 1.5) || rv[i] > rev) continue;
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
      const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
      if (cw <= 0) continue;
      const cx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / cw * sx;
      const cy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / cw * sy;
      const dx = cx - px, dy = cy - py, d = dx * dx + dy * dy;
      if (d < bestD || (d < bestD * 1.6 && cw < bestZ)) { if (d < bestD) bestD = d; best = i; bestZ = cw; }
    }
    return best;
  }
}
