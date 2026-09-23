// Free exploration: search any cell type or root id, filter classes, toggle layers.
import { h, escapeHtml, toast } from "./ui.js";
import { fmt } from "./data.js";
import { CLASSES, CLASS_ORDER } from "./theme.js";

const FAMOUS = ["DNp01", "EPG", "APL", "CT1", "MDN", "DNa02", "MBON01", "LC4", "T4a", "Mi1", "L1", "R7", "DA1_lPN", "CSD", "LPLC2", "PEN_a(PEN1)", "KCab", "HSN", "VS"];

export class Explorer {
  constructor(app, el) {
    this.app = app;
    this.el = el;
    this.built = false;
    this.hiddenClasses = new Set();
  }

  typeIndex() {
    if (this._types) return this._types;
    const c = this.app.data.cols, m = this.app.data.meta;
    const byType = new Map();
    for (let i = 0; i < c.type.length; i++) {
      const t = c.type[i];
      if (!t) continue;
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t).push(i);
    }
    this._types = [...byType.entries()].map(([t, idx]) => ({ name: m.cellTypes[t], lc: m.cellTypes[t].toLowerCase(), idx }));
    return this._types;
  }

  build() {
    const app = this.app;
    const el = this.el;
    el.innerHTML = "";
    const input = h("input", { type: "search", id: "ex-search", placeholder: "Cell type or root ID, e.g. EPG, DNp01", autocomplete: "off", spellcheck: "false", "aria-label": "Search cell types or root IDs" });
    const results = h("ul", { class: "results", "aria-live": "polite" });
    const renderResults = async () => {
      const q = input.value.trim();
      results.innerHTML = "";
      if (!q) {
        const famous = this.typeIndex().filter((t) => FAMOUS.includes(t.name)).sort((a, b) => FAMOUS.indexOf(a.name) - FAMOUS.indexOf(b.name));
        famous.slice(0, 8).forEach((t) => results.append(this.typeRow(t)));
        return;
      }
      if (/^\d{15,20}$/.test(q)) {
        const ids = await app.card.rootId(0).then(() => app.card._ids);
        const want = BigInt(q);
        const i = ids.indexOf(want);
        if (i >= 0) {
          const b = h("button", { type: "button" }, h("span", {}, `Neuron ${q.slice(0, 6)}…${q.slice(-4)}`), h("span", { class: "rk" }, app.card.label(i)));
          b.addEventListener("click", () => this.openNeuron(i));
          results.append(h("li", {}, b));
        } else results.append(h("li", { class: "note" }, "No proofread v783 neuron has that root ID."));
        return;
      }
      const lq = q.toLowerCase();
      const hits = this.typeIndex().filter((t) => t.lc.includes(lq))
        .sort((a, b) => (a.lc.startsWith(lq) ? 0 : 1) - (b.lc.startsWith(lq) ? 0 : 1) || a.lc.length - b.lc.length || b.idx.length - a.idx.length)
        .slice(0, 30);
      if (!hits.length) results.append(h("li", { class: "note" }, "No cell type matches. Try a shorter name."));
      hits.forEach((t) => results.append(this.typeRow(t)));
    };
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") results.querySelector("button")?.click(); });

    const surprise = h("button", { class: "chip", type: "button" }, "Surprise me");
    surprise.addEventListener("click", () => {
      const i = Math.floor(Math.random() * app.data.meta.count);
      this.openNeuron(i);
    });
    const reset = h("button", { class: "chip", type: "button" }, "Reset view");
    reset.addEventListener("click", () => {
      app.card.close();
      app.layers.neurons.setHighlight(null);
      app.view({ dir: [0.08, 0.22, 1], dist: 1350, shift: "left" });
    });

    const seg = h("div", { class: "seg", role: "group", "aria-label": "Colour neurons by" });
    [["class", "Class"], ["nt", "Transmitter"], ["side", "Side"], ["lineage", "Lineage"]].forEach(([k, l]) => {
      const b = h("button", { type: "button", "aria-pressed": String(k === "class") }, l);
      b.addEventListener("click", () => { app.layers.neurons.setColorMode(k); for (const x of seg.children) x.setAttribute("aria-pressed", String(x === b)); });
      seg.append(b);
    });

    const classChips = h("div", { class: "chips" });
    const meta = app.data.meta, cols = app.data.cols;
    for (const name of CLASS_ORDER) {
      const code = meta.superClasses.indexOf(name);
      if (code < 0) continue;
      const b = h("button", { class: "chip", type: "button", "aria-pressed": "true", style: `--c:${CLASSES[name].color}` }, h("span", { class: "sw" }), CLASSES[name].label);
      b.addEventListener("click", () => {
        this.hiddenClasses.has(code) ? this.hiddenClasses.delete(code) : this.hiddenClasses.add(code);
        b.setAttribute("aria-pressed", String(!this.hiddenClasses.has(code)));
        if (!this.hiddenClasses.size) { app.layers.neurons.setVisibility(null); return; }
        const m = new Uint8Array(meta.count);
        for (let i = 0; i < m.length; i++) m[i] = this.hiddenClasses.has(cols.super[i]) ? 0 : 1;
        app.layers.neurons.setVisibility(m);
      });
      classChips.append(b);
    }

    const sw = (id, label, checked, fn) => {
      const i = h("input", { type: "checkbox", id, checked });
      i.addEventListener("change", () => fn(i.checked));
      return h("label", { class: "switch", for: id }, i, h("span", {}, label));
    };
    const L = app.layers;
    const toggles = h("div", { class: "toggles" },
      sw("tg-points", "Cell bodies", true, (on) => { L.neurons.points.visible = on; }),
      sw("tg-forest", "Neuron fibres", true, (on) => { if (!L.forest) { toast("Neuron shapes are still loading"); return; } on ? L.forest.fade(0.012, 0.8) : L.forest.fade(0, 0.6); }),
      sw("tg-regions", "Brain regions", false, (on) => L.neuropils.fadeTo(on ? 0.9 : 0.28, 0.8, { brainOnly: !on })),
      sw("tg-arcs", "Strong connections", false, (on) => { L.arcs.show(on); if (on) L.arcs.grow(2); }),
    );

    el.append(
      h("p", { class: "eyebrow mono" }, "Free exploration"),
      h("h3", {}, "The whole brain is yours"),
      h("p", { class: "note" }, "Drag to orbit, scroll to zoom, click any point to open that neuron and see its strongest partners."),
      h("div", { class: "ex-section search" }, h("label", { class: "ex-label", for: "ex-search" }, "Find"), input, results),
      h("div", { class: "actions" }, surprise, reset),
      h("div", { class: "ex-section" }, h("span", { class: "ex-label" }, "Colour by"), seg),
      h("div", { class: "ex-section" }, h("span", { class: "ex-label" }, "Show classes"), classChips),
      h("div", { class: "ex-section" }, h("span", { class: "ex-label" }, "Layers"), toggles),
      h("p", { class: "source" }, `${fmt.format(meta.count)} neurons · ${fmt.format(app.data.connectome.synapses)} synapses · FlyWire v783`),
    );
    renderResults();
    this.built = true;
  }

  typeRow(t) {
    const b = h("button", { type: "button" }, h("span", {}, t.name), h("span", { class: "rk" }, `${fmt.format(t.idx.length)} neuron${t.idx.length === 1 ? "" : "s"}`));
    b.addEventListener("click", () => {
      this.app.card.close();
      this.app.focusNeurons(t.idx, `${t.name}: ${fmt.format(t.idx.length)} neuron${t.idx.length === 1 ? "" : "s"}`);
      if (t.idx.length <= 4) this.app.card.show(t.idx[0]);
    });
    return h("li", {}, b);
  }

  openNeuron(i) {
    const app = this.app;
    app.card.show(i);
    const p = app.layers.neurons.worldPos(i);
    app.view({ target: p, dir: [0.2, 0.25, 1], dist: 700, shift: "left", duration: 2.2 });
  }

  open() {
    const app = this.app;
    if (!this.built) this.build();
    this.el.hidden = false;
    app.stage({ points: { intensity: 0.3, color: "class" }, neuropils: { k: 0.28, brainOnly: true }, forest: 0.012 });
    app.view({ dir: [0.08, 0.22, 1], dist: 1350, shift: "left" });
    // reset toggles to match the staged layers
    for (const [id, on] of [["tg-points", true], ["tg-forest", true], ["tg-regions", false], ["tg-arcs", false]]) {
      const i = this.el.querySelector(`#${id}`);
      if (i) i.checked = on;
    }
    const seg = this.el.querySelector(".seg");
    if (seg) for (const b of seg.children) b.setAttribute("aria-pressed", String(b.textContent === "Class"));
    this.hiddenClasses.clear();
    for (const b of this.el.querySelectorAll(".chips .chip")) b.setAttribute("aria-pressed", "true");
    app.layers.neurons.points.visible = true;
  }

  close() {
    this.el.hidden = true;
    this.app.card.close();
    this.app.layers.neurons.setVisibility(null);
    this.app.layers.neurons.points.visible = true;
  }
}
