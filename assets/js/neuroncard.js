// Detail card for one neuron: identity, numbers, strongest partners drawn as live lines.
import * as THREE from "three";
import { DATA, loadColumns, fmt } from "./data.js";
import { h, escapeHtml, toast } from "./ui.js";
import { CLASSES, NTS, SIDES } from "./theme.js";

const SHARD = 2048;

const VERT = /* glsl */`
  attribute float aT;
  attribute vec3 aColor;
  uniform float uTime;
  varying float vA;
  varying vec3 vC;
  void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float head = fract(uTime * 0.45);
    vA = 0.22 + 1.4 * exp(-pow((aT - head) * 7.0, 2.0));
    vC = aColor;
  }`;
const FRAG = /* glsl */`
  varying float vA;
  varying vec3 vC;
  void main(){ gl_FragColor = vec4(vC * vA, 1.0); }`;

export class NeuronCard {
  constructor(app, el) {
    this.app = app;
    this.el = el;
    this.shards = new Map();
    this.current = -1;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: { uTime: { value: 0 } },
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(new THREE.BufferGeometry(), mat);
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    app.world.brain.add(this.lines);
    app.world.onFrame((dt, t) => { mat.uniforms.uTime.value = t; });
  }

  async shard(i) {
    const s = Math.floor(i / SHARD);
    if (!this.shards.has(s)) this.shards.set(s, loadColumns(`${DATA}partners/p${String(s).padStart(3, "0")}.bin`));
    return { cols: await this.shards.get(s), k: i - s * SHARD };
  }

  async rootId(i) {
    if (!this._ids) this._ids = fetch(DATA + "root_ids.bin").then((r) => r.arrayBuffer()).then((b) => new BigUint64Array(b));
    return (await this._ids)[i].toString();
  }

  async partners(i) {
    const { cols, k } = await this.shard(i);
    const take = (dir) => {
      const off = cols[dir + "Off"], a = off[k], b = off[k + 1];
      const out = [];
      for (let j = a; j < b; j++) out.push({ i: cols[dir + "Idx"][j], syn: cols[dir + "Syn"][j] });
      return out;
    };
    const deg = cols.deg;
    return { ins: take("in"), outs: take("out"), deg: { inAll: deg[k * 4], outAll: deg[k * 4 + 1], in5: deg[k * 4 + 2], out5: deg[k * 4 + 3] } };
  }

  label(i) {
    const m = this.app.data.meta, c = this.app.data.cols;
    return m.cellTypes[c.type[i]] || "untyped";
  }

  async show(i) {
    const app = this.app, m = app.data.meta, c = app.data.cols;
    this.current = i;
    const cls = m.superClasses[c.super[i]], nt = m.nts[c.nt[i]], side = m.sides[c.side[i]];
    const type = this.label(i);
    const el = this.el;
    el.hidden = false;
    el.innerHTML = "";
    const close = h("button", { class: "icon-btn", type: "button", "aria-label": "Close neuron card" },
      h("span", { html: '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' }));
    close.addEventListener("click", () => this.close());
    const rootCode = h("code", {}, "loading…");
    const copyBtn = h("button", { class: "mini-btn", type: "button" }, "Copy");
    const codex = h("a", { href: "https://codex.flywire.ai", target: "_blank", rel: "noopener" }, "Open in FlyWire Codex ↗");
    const kv = h("dl", { class: "kv" });
    const addKV = (k, v) => { if (v) kv.append(h("dt", {}, k), h("dd", {}, v)); };
    addKV("Class", CLASSES[cls]?.label || cls || "—");
    addKV("Subclass", [m.cellClasses[c.cls[i]], m.subClasses[c.sub[i]]].filter(Boolean).join(" · ").replace(/_/g, " "));
    addKV("Transmitter", NTS[nt] ? `${NTS[nt].label}${NTS[nt].role ? ` (${NTS[nt].role})` : ""}` : "Unknown");
    addKV("Hemisphere", SIDES[side]?.label || side);
    addKV("Lineage", m.lineages[c.lineage[i]]);
    addKV("Nerve", m.nerves[c.nerve[i]]);
    addKV("Synapses", `${fmt.format(c.inSyn[i])} in · ${fmt.format(c.outSyn[i])} out`);
    const partnersKV = h("dd", {}, "…");
    kv.append(h("dt", {}, "Partners"), partnersKV);
    const insList = h("ul", { class: "partners" }), outsList = h("ul", { class: "partners" });
    const flyBtn = h("button", { class: "chip", type: "button" }, "Fly to it");
    const typeBtn = h("button", { class: "chip", type: "button" }, `All ${type === "untyped" ? "untyped" : type}`);
    el.append(
      h("div", { class: "nc-top" }, h("div", {},
        h("p", { class: "eyebrow mono" }, `${CLASSES[cls]?.label || "Neuron"} · #${fmt.format(i)}`),
        h("h3", {}, type)), close),
      kv,
      h("div", { class: "rootid" }, h("span", { class: "eyebrow mono" }, "Root ID"), rootCode, copyBtn),
      h("div", { class: "actions" }, flyBtn, typeBtn),
      h("div", { class: "ex-section" }, h("span", { class: "ex-label" }, "Strongest inputs ↘"), insList),
      h("div", { class: "ex-section" }, h("span", { class: "ex-label" }, "Strongest outputs ↗"), outsList),
      h("p", { class: "source" }, codex),
    );
    flyBtn.addEventListener("click", () => {
      const p = app.layers.neurons.worldPos(i);
      app.view({ target: p, dir: [0.2, 0.25, 1], dist: 420, shift: "left", duration: 2 });
    });
    typeBtn.addEventListener("click", () => {
      const t = c.type[i];
      const idx = [];
      for (let k = 0; k < c.type.length; k++) if (c.type[k] === t) idx.push(k);
      app.focusNeurons(idx, `${fmt.format(idx.length)} neurons of type ${type}`);
    });
    this.rootId(i).then((id) => {
      if (this.current !== i) return;
      rootCode.textContent = id;
      codex.href = `https://codex.flywire.ai/app/cell_details?cell_names_or_id=${id}&data_version=783`;
      copyBtn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(id); toast("Root ID copied"); }
        catch { const r = document.createRange(); r.selectNodeContents(rootCode); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selected. Press Ctrl+C / ⌘C to copy"); }
      });
    });
    const p = await this.partners(i);
    if (this.current !== i) return;
    partnersKV.textContent = `${fmt.format(p.deg.in5)} in · ${fmt.format(p.deg.out5)} out (5+ synapses); ${fmt.format(p.deg.inAll + p.deg.outAll)} counting single synapses`;
    const row = (x, dir) => {
      const pc = m.superClasses[c.super[x.i]];
      const b = h("button", { type: "button", style: `--c:${CLASSES[pc]?.color || "#777"}` },
        h("span", { class: "sw" }), h("span", {}, this.label(x.i)), h("span", { class: "syn" }, `${fmt.format(x.syn)} syn`));
      b.addEventListener("click", () => this.show(x.i));
      return h("li", {}, b);
    };
    if (!p.ins.length) insList.append(h("li", { class: "note" }, "No strong inputs recorded"));
    if (!p.outs.length) outsList.append(h("li", { class: "note" }, "No strong outputs recorded"));
    p.ins.forEach((x) => insList.append(row(x, "in")));
    p.outs.forEach((x) => outsList.append(row(x, "out")));
    this.draw(i, p);
    app.layers.neurons.setHighlight([i, ...p.ins.map((x) => x.i), ...p.outs.map((x) => x.i)], 0.1);
  }

  draw(i, p) {
    const P = this.app.layers.neurons.positions;
    const segs = [];
    const inC = [0.45, 0.72, 1.0], outC = [1.0, 0.62, 0.32];
    const S = 16;
    const push = (a, b, col) => {
      const A = new THREE.Vector3(P[a * 3], P[a * 3 + 1], P[a * 3 + 2]);
      const B = new THREE.Vector3(P[b * 3], P[b * 3 + 1], P[b * 3 + 2]);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      mid.multiplyScalar(0.8); // bow toward the brain's core, where neuropils are
      for (let s = 0; s < S; s++) {
        for (const t of [s / S, (s + 1) / S]) {
          const u = 1 - t;
          const x = A.x * u * u + mid.x * 2 * u * t + B.x * t * t;
          const y = A.y * u * u + mid.y * 2 * u * t + B.y * t * t;
          const z = A.z * u * u + mid.z * 2 * u * t + B.z * t * t;
          segs.push([x, y, z, t, col]);
        }
      }
    };
    p.ins.forEach((x) => push(x.i, i, inC));
    p.outs.forEach((x) => push(i, x.i, outC));
    const pos = new Float32Array(segs.length * 3), t = new Float32Array(segs.length), col = new Float32Array(segs.length * 3);
    segs.forEach((s, k) => { pos.set(s.slice(0, 3), k * 3); t[k] = s[3]; col.set(s[4], k * 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    this.lines.geometry.dispose();
    this.lines.geometry = g;
    this.lines.visible = true;
  }

  close() {
    this.el.hidden = true;
    this.current = -1;
    this.lines.visible = false;
    this.app.layers.neurons?.setHighlight(null);
  }
}
