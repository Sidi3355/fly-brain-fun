// Replays whole-brain LIF simulations (after Shiu et al. 2024) on the 3D neurons.
import { DATA, fetchJSON, loadColumns } from "./data.js";

export class SimPlayer {
  constructor(world, neurons, audio) {
    this.world = world;
    this.neurons = neurons;
    this.audio = audio;
    this.cache = new Map();
    this.exp = null;
    this.playing = false;
    this.speed = 0.075;          // simulated seconds per real second
    this.tMs = 0;
    this.ptr = 0;
    this.active = new Set();
    this.listeners = new Set();
    this.tau = 22;               // ms of simulated time for the glow to fade
    world.onFrame((dt) => this.tick(dt));
  }

  async index() {
    if (!this._index) this._index = fetchJSON(DATA + "sim/index.json");
    return this._index;
  }

  async load(id) {
    if (!this.cache.has(id)) {
      this.cache.set(id, loadColumns(`${DATA}sim/${id}.bin`).then((cols) => {
        // per-neuron first spike (ms) for raster ordering
        const first = new Map();
        for (let i = 0; i < cols.n.length; i++) if (!first.has(cols.n[i])) first.set(cols.n[i], cols.t[i] / 10);
        cols.first = first;
        return cols;
      }));
    }
    return this.cache.get(id);
  }

  async select(meta) {
    this.stop();
    this.exp = meta;
    this.data = await this.load(meta.id);
    this.reset();
    this.emit("select");
    return this.data;
  }

  reset() {
    this.tMs = 0;
    this.ptr = 0;
    const a = this.neurons.act.array;
    for (const i of this.active) a[i] = 0;
    this.active.clear();
    this.neurons.act.needsUpdate = true;
    this.emit("time");
  }

  play() {
    if (!this.data) return;
    if (this.tMs >= this.duration) this.reset();
    this.playing = true;
    this.emit("state");
  }

  stop() { this.playing = false; this.emit("state"); }
  toggle() { this.playing ? this.stop() : this.play(); }
  get duration() { return this.exp?.duration_ms || 1000; }

  seek(ms) {
    // rebuild glow state around the new time
    this.reset();
    const d = this.data;
    if (!d) return;
    const target = Math.max(0, Math.min(this.duration, ms));
    const a = this.neurons.act.array;
    const lo = Math.max(0, target - this.tau * 4);
    while (this.ptr < d.t.length && d.t[this.ptr] / 10 <= target) {
      const ts = d.t[this.ptr] / 10;
      if (ts >= lo) {
        const i = d.n[this.ptr];
        a[i] = Math.min(1.6, a[i] * Math.exp(-(ts - lo) / this.tau) + 0.9);
        this.active.add(i);
      }
      this.ptr++;
    }
    this.tMs = target;
    this.neurons.act.needsUpdate = true;
    this.emit("time");
  }

  tick(dt) {
    if (!this.playing || !this.data) return;
    const d = this.data, a = this.neurons.act.array;
    const step = dt * 1000 * this.speed;
    const now = this.tMs + step;
    const k = Math.exp(-step / this.tau);
    for (const i of this.active) {
      a[i] *= k;
      if (a[i] < 0.01) { a[i] = 0; this.active.delete(i); }
    }
    let fired = 0;
    const byClass = new Map();
    while (this.ptr < d.t.length && d.t[this.ptr] / 10 <= now) {
      const i = d.n[this.ptr];
      a[i] = Math.min(1.6, a[i] + 0.9);
      this.active.add(i);
      fired++;
      if (fired < 64) {
        const c = this.neurons.cols.super[i];
        byClass.set(c, (byClass.get(c) || 0) + 1);
      }
      this.ptr++;
    }
    this.neurons.act.needsUpdate = true;
    this.tMs = now;
    if (fired && this.audio) this.audio.spikes(fired, byClass);
    if (now >= this.duration) { this.tMs = this.duration; this.stop(); }
    this.emit("time");
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(kind) { for (const fn of this.listeners) fn(kind, this); }

  clear() {
    this.stop();
    const a = this.neurons.act.array;
    for (const i of this.active) a[i] = 0;
    this.active.clear();
    this.neurons.act.needsUpdate = true;
  }
}

// Pre-render a raster (neurons x time) into an offscreen canvas; draw the revealed part.
export class Raster {
  constructor(canvas, colorOf) {
    this.canvas = canvas;
    this.colorOf = colorOf;
    this.off = document.createElement("canvas");
  }

  build(data, duration) {
    const rows = [...data.first.entries()].sort((a, b) => a[1] - b[1]);
    const maxRows = 1400;
    const pick = rows.length > maxRows ? rows.filter((_, i) => i % Math.ceil(rows.length / maxRows) === 0) : rows;
    const rowOf = new Map(pick.map(([n], i) => [n, i]));
    const W = 1200, H = Math.max(120, Math.min(pick.length, 700));
    this.off.width = W; this.off.height = H;
    const ctx = this.off.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const sy = H / Math.max(1, pick.length);
    for (let i = 0; i < data.t.length; i++) {
      const r = rowOf.get(data.n[i]);
      if (r === undefined) continue;
      ctx.fillStyle = this.colorOf(data.n[i]);
      ctx.fillRect((data.t[i] / 10) / duration * W, r * sy, 1.4, Math.max(1, sy));
    }
    this.rows = pick.length;
    this.total = rows.length;
    this.duration = duration;
  }

  draw(tMs) {
    const c = this.canvas, ctx = c.getContext("2d");
    const W = c.clientWidth, H = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!this.duration) return;
    const frac = tMs / this.duration;
    ctx.globalAlpha = 0.18;
    ctx.drawImage(this.off, 0, 0, this.off.width, this.off.height, 0, 0, W, H);
    ctx.globalAlpha = 1;
    const sw = this.off.width * frac;
    if (sw > 0) ctx.drawImage(this.off, 0, 0, sw, this.off.height, 0, 0, W * frac, H);
    ctx.fillStyle = "rgba(166,244,255,0.9)";
    ctx.fillRect(W * frac, 0, 1, H);
  }
}
