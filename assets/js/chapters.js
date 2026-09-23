// The voyage: each station sets the scene, the camera and the story card.
import { h, animateNumber, showTip, hideTip, escapeHtml, toast } from "./ui.js";
import { fmt, fmtCompact } from "./data.js";
import { CLASSES, CLASS_ORDER, NTS, NT_ORDER, SIDES, SYSTEM_COLORS, SYSTEM_BLURBS, REGION_BLURBS, CHART_CLASS_COLOR, chartClassOf } from "./theme.js";
import * as charts from "./charts.js";
import { Microscope, niceScale } from "./layers/em.js";
import { Raster } from "./sim.js";

const src = (text) => h("p", { class: "source" }, text);
const para = (html) => h("p", { html });

export const STATIONS = [
  { id: "slice", rail: "Slice", title: "The slice" },
  { id: "assembly", rail: "Assembly", title: "Assembly" },
  { id: "census", rail: "Census", title: "Census" },
  { id: "territories", rail: "Territories", title: "Territories" },
  { id: "wiring", rail: "Wiring", title: "Wiring" },
  { id: "characters", rail: "Characters", title: "Characters" },
  { id: "pulse", rail: "Pulse", title: "Pulse" },
  { id: "scale", rail: "Scale", title: "Scale" },
  { id: "explore", rail: "Explore", title: "Explore" },
];

function kicker(i, name) {
  return h("p", { class: "eyebrow mono kicker" }, h("span", { class: "num" }, String(i + 1).padStart(2, "0")), h("span", {}, name));
}

// ---------------------------------------------------------------- 1 · slice
function slice(app, card, side) {
  const { layers, world } = app;
  app.stage({ points: { intensity: 0.09 }, neuropils: { k: 0.55, brainOnly: true }, em: true });
  app.view({ dir: [0.95, 0.42, 1.0], dist: 1500, shift: "both" });

  const secEl = h("span", { class: "v" }, "—");
  const depthEl = h("span", { class: "v" }, "—");
  card.append(
    kicker(0, "The slice"),
    h("h2", { html: "Seven thousand slices of a <em>poppy seed</em>" }),
    para("In 2018 a team at HHMI Janelia cut the brain of one female fruit fly into <strong>7,062 sections</strong>, each 40 nanometres thick, about a thousandth the width of a hair. Electron microscopes photographed every one: <strong>21 million images</strong>."),
    para("The plane sweeping through the brain shows real sections from that volume, where they sit in 3D."),
    h("div", { class: "figures" },
      h("div", { class: "figure" }, secEl, h("div", { class: "k" }, "section of 7,062")),
      h("div", { class: "figure" }, depthEl, h("div", { class: "k" }, "depth, µm from front"))),
    para("On the right, dive into one section: the lamina, where photoreceptor axons meet the first visual neurons. Keep zooming until you reach membranes, mitochondria and synaptic vesicles."),
    src("Zheng et al., Cell 2018 · FAFB volume, 4 × 4 × 40 nm voxels"),
  );

  // microscope
  const canvas = h("canvas", { "aria-label": "Electron microscope view of the fly lamina" });
  const bar = h("i");
  const barLabel = h("span", {}, "");
  const label = h("div", { class: "scope-label" });
  const zoom = h("input", { type: "range", id: "scope-zoom", min: "0", max: "1000", value: "0", "aria-label": "Zoom level" });
  const segToggle = h("input", { type: "checkbox", id: "scope-seg" });
  const pxRead = h("span", { class: "r" }, "");
  const panel = h("div", { class: "panel-frame" },
    h("div", { class: "panel-head" }, h("span", { class: "t" }, "Microscope · section 3,540"), pxRead),
    h("div", { class: "scope" }, canvas, h("div", { class: "scalebar" }, bar, barLabel), label),
    h("div", { class: "scope-controls" },
      h("label", { for: "scope-zoom" }, "zoom"), zoom,
      h("label", { class: "switch" }, segToggle, h("span", {}, "AI tracing"))),
  );
  side.append(panel);
  side.hidden = false;
  const scope = new Microscope(canvas, app.data.em);
  let auto = true, autoT = 0;
  zoom.addEventListener("input", () => { auto = false; scope.s = zoom.value / 1000; });
  segToggle.addEventListener("change", () => { segTarget = segToggle.checked ? 0.85 : 0; if (segToggle.checked) app.audio.chime(3); });
  let segTarget = 0;

  let t0 = world.time;
  const off = world.onFrame((dt, t) => {
    // sweep: anterior -> posterior and back, 24 s round trip
    const p = 0.5 - 0.5 * Math.cos(((t - t0) / 24) * Math.PI * 2);
    layers.em.setProgress(p);
    layers.em.setOpacity(Math.min(1, (t - t0) / 1.5) * 0.95);
    secEl.textContent = fmt.format(layers.em.section);
    depthEl.textContent = ((layers.em.section - 0) * 0.04).toFixed(1);
    if (auto) {
      autoT += dt;
      scope.s = Math.min(1, Math.max(0, (autoT - 1.2) / 11));
      zoom.value = String(Math.round(scope.s * 1000));
      if (scope.s > 0.82 && segTarget === 0 && !segToggle.dataset.touched) { segToggle.checked = true; segToggle.dataset.touched = "1"; segTarget = 0.85; }
      if (scope.s >= 1) auto = false;
    }
    scope.seg += (segTarget - scope.seg) * Math.min(1, dt * 4);
    const f = scope.draw();
    const sb = niceScale(f);
    bar.style.width = `${(sb.frac * canvas.clientWidth).toFixed(1)}px`;
    barLabel.textContent = sb.label;
    const nmpx = f * 1000 / Math.max(1, canvas.clientWidth);
    pxRead.textContent = `${nmpx < 10 ? nmpx.toFixed(1) : Math.round(nmpx)} nm / px`;
    label.textContent = scope.seg > 0.2 ? "colour = neuron class" : "";
  });
  return () => { off(); layers.em.setOpacity(0); side.hidden = true; };
}

// ---------------------------------------------------------------- 2 · assembly
function assembly(app, card) {
  const { layers, world } = app;
  const N = layers.neurons.n;
  app.stage({ points: { intensity: 0.3, reveal: 0, color: "class" }, neuropils: { k: 0.35, brainOnly: true } });
  app.view({ dir: [0.8, 0.32, 0.95], dist: 1500, shift: "left" });

  const nEl = h("span", { class: "v" }, "0");
  const sEl = h("span", { class: "v" }, "0");
  const growBtn = h("button", { class: "btn btn-ghost", type: "button", disabled: true }, "Grow the wiring");
  const replay = h("button", { class: "chip", type: "button" }, "Replay the assembly");
  card.append(
    kicker(1, "Assembly"),
    h("h2", { html: "33 person-years of <em>proofreading</em>" }),
    para("AI traced every cell through the stack, but in a tangle this dense it made mistakes: two neurons merged into one, or one cut in pieces. A community of <strong>more than 200 scientists, proofreaders and citizen scientists in 50 labs</strong> fixed them one by one."),
    para("Without the AI, the job would have taken an estimated <strong>50,000 person-years</strong>. Each point appearing now is one proofread neuron's cell body, placed where it sits in the brain."),
    h("div", { class: "figures" },
      h("div", { class: "figure" }, nEl, h("div", { class: "k" }, "neurons placed")),
      h("div", { class: "figure" }, sEl, h("div", { class: "k" }, "synapses attached"))),
    h("div", { class: "actions" }, growBtn, replay),
    src("Dorkenwald et al., Nature 2024 · FlyWire Consortium"),
  );

  // sorted reveal values -> fast "how many placed" lookups
  const rv = Float32Array.from(layers.neurons.reveal.array).sort();
  const count = (r) => { let lo = 0, hi = rv.length; while (lo < hi) { const m = (lo + hi) >> 1; if (rv[m] <= r) lo = m + 1; else hi = m; } return lo; };
  const synTotal = app.data.connectome.synapses;
  const run = () => {
    layers.neurons.uniforms.uFlash.value = 1;
    layers.neurons.tween("uReveal", -0.02, 1.06, app.world.reduced ? 0.01 : 9);
    app.layers.forest?.fade(0, 0.5);
    app.audio.chime(0);
  };
  run();
  replay.addEventListener("click", run);
  const off = world.onFrame(() => {
    const r = layers.neurons.uniforms.uReveal.value;
    const c = Math.min(N, count(r));
    nEl.textContent = fmt.format(c);
    sEl.textContent = fmtCompact.format(Math.round(synTotal * c / N));
  });
  app.ready.forest.then(() => { growBtn.disabled = false; });
  growBtn.addEventListener("click", () => {
    if (!app.layers.forest) return;
    app.layers.forest.uniforms.uOpacity.value = 0.55;
    app.layers.forest.grow(7);
    app.audio.chime(2);
    toast(`Growing ${fmt.format(app.data.forest.count)} real neuron skeletons from their cell bodies`);
  });
  return () => { off(); layers.neurons.stopTween("uReveal"); layers.neurons.uniforms.uReveal.value = 2; };
}

// ---------------------------------------------------------------- 3 · census
function census(app, card) {
  const { layers } = app;
  app.stage({ points: { intensity: 0.32, color: "class" }, neuropils: { k: 0.25, brainOnly: true }, forest: 0.16 });
  app.view({ dir: [0.08, 0.22, 1], dist: 1320, shift: "left" });
  const meta = app.data.meta, cols = app.data.cols;

  const legendBox = h("div", {});
  const modes = [["class", "Cell class"], ["nt", "Transmitter"], ["side", "Hemisphere"], ["lineage", "Lineage"]];
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Colour neurons by" });
  let mode = "class";
  const hidden = new Set();
  const render = () => {
    legendBox.innerHTML = "";
    if (mode === "lineage") {
      legendBox.append(para(`Each colour is one of <strong>${meta.lineages.length - 1} hemilineages</strong>: families of neurons born from the same stem cell. Siblings share wiring plans, so lineage is one of the best predictors of what a neuron does.`));
      return;
    }
    const key = { class: "super", nt: "nt", side: "side" }[mode];
    const names = { class: meta.superClasses, nt: meta.nts, side: meta.sides }[mode];
    const order = { class: CLASS_ORDER, nt: NT_ORDER, side: ["left", "right", "center"] }[mode];
    const lut = { class: CLASSES, nt: NTS, side: SIDES }[mode];
    const counts = new Map();
    for (let i = 0; i < cols[key].length; i++) counts.set(cols[key][i], (counts.get(cols[key][i]) || 0) + 1);
    const total = cols[key].length;
    const max = Math.max(...counts.values());
    const list = h("div", { class: "legend" });
    for (const name of order) {
      const code = names.indexOf(name);
      if (code < 0 || !counts.get(code)) continue;
      const v = counts.get(code);
      const info = lut[name];
      const row = h("button", { class: "legend-row", type: "button", "aria-pressed": String(!hidden.has(code)), style: `--c:${info.color}`, title: info.blurb || info.role || "" },
        h("span", { class: "sw" }), h("span", { class: "name" }, info.label),
        h("span", { class: "count" }, `${fmt.format(v)} · ${(100 * v / total).toFixed(v / total < 0.01 ? 1 : 0)}%`),
        h("span", { class: "share", style: `--w:${(100 * v / max).toFixed(1)}%` }, h("i")));
      row.addEventListener("click", () => {
        hidden.has(code) ? hidden.delete(code) : hidden.add(code);
        row.setAttribute("aria-pressed", String(!hidden.has(code)));
        applyMask();
      });
      row.addEventListener("pointerenter", () => {
        const idx = [];
        for (let i = 0; i < cols[key].length; i++) if (cols[key][i] === code) idx.push(i);
        layers.neurons.setHighlight(idx, 0.12);
      });
      row.addEventListener("pointerleave", () => layers.neurons.setHighlight(null));
      list.append(row);
    }
    legendBox.append(list, h("p", { class: "note" }, "Hover a row to isolate it; click to hide or show."));
  };
  const applyMask = () => {
    const key = { class: "super", nt: "nt", side: "side" }[mode];
    if (!hidden.size || !key) { layers.neurons.setVisibility(null); return; }
    const m = new Uint8Array(layers.neurons.n);
    for (let i = 0; i < m.length; i++) m[i] = hidden.has(cols[key][i]) ? 0 : 1;
    layers.neurons.setVisibility(m);
  };
  for (const [k, label] of modes) {
    const b = h("button", { type: "button", "aria-pressed": String(k === mode) }, label);
    b.addEventListener("click", () => {
      mode = k; hidden.clear(); applyMask();
      for (const x of seg.children) x.setAttribute("aria-pressed", String(x === b));
      layers.neurons.setColorMode(k);
      render();
    });
    seg.append(b);
  }
  const optic = cols.super.reduce((a, c) => a + (meta.superClasses[c] === "optic" ? 1 : 0), 0);
  card.append(
    kicker(2, "Census"),
    h("h2", { html: `A census of <em>139,255</em> cells` }),
    para(`More than half of all neurons, <strong>${fmt.format(optic)}</strong>, live in the optic lobes, the two great visual processors on either side of the central brain. The fly is, above all, a seeing machine.`),
    para("Only <strong>1,303 descending neurons</strong> carry the brain's decisions down to the body. Every walk, flight and escape has to squeeze through them."),
    seg,
    legendBox,
    src("Schlegel et al., Nature 2024 · cell classes, transmitters predicted by Eckstein et al. 2024"),
  );
  render();
  return () => { layers.neurons.setVisibility(null); layers.neurons.setHighlight(null); layers.neurons.setColorMode("class"); };
}

// ---------------------------------------------------------------- 4 · territories
function territories(app, card) {
  const { layers } = app;
  app.stage({ points: { intensity: 0.1, color: "class" }, neuropils: { k: 1 } });
  app.view({ dir: [-0.35, 0.5, 1], dist: 1260, shift: "left" });
  const npMeta = app.data.npMeta;
  const cols = app.data.cols, meta = app.data.meta;
  const info = h("div", { class: "char-story" });
  const chips = h("div", { class: "chips" });
  let active = null;
  const describe = (sys) => {
    info.innerHTML = "";
    if (!sys) {
      info.append(para("Hover the glowing shells to name them, or pick a system to light up its neurons."));
      return;
    }
    const members = sys.members.join(", ");
    info.append(h("h3", {}, sys.name), para(escapeHtml(SYSTEM_BLURBS[sys.id] || "")), h("p", { class: "note mono" }, members));
  };
  const select = (sys) => {
    active = active === sys ? null : sys;
    for (const c of chips.children) c.setAttribute("aria-pressed", String(c.dataset.id === active?.id));
    layers.neuropils.highlight(active ? (m) => m.system === active.id : null);
    if (active) {
      const npIdx = new Set(meta.neuropils.map((n, i) => [n.replace(/_(L|R)$/, ""), i]).filter(([a]) => active.members.includes(a)).map(([, i]) => i));
      const idx = [];
      for (let i = 0; i < cols.inNp.length; i++) if (npIdx.has(cols.inNp[i])) idx.push(i);
      layers.neurons.setHighlight(idx, 0.25);
      layers.neurons.uniforms.uIntensity.value = 0.26;
      app.audio.chime(4);
    } else {
      layers.neurons.setHighlight(null);
      layers.neurons.uniforms.uIntensity.value = 0.1;
    }
    describe(active);
  };
  for (const sys of npMeta.systems) {
    const b = h("button", { class: "chip", type: "button", "data-id": sys.id, "aria-pressed": "false", style: `--c:${SYSTEM_COLORS[sys.id]}` }, h("span", { class: "sw" }), sys.name);
    b.addEventListener("click", () => select(sys));
    chips.append(b);
  }
  const flowEl = h("div", {});
  card.append(
    kicker(3, "Territories"),
    h("h2", { html: "78 <em>neighbourhoods</em> of wiring" }),
    para("Neurons connect in dense zones called neuropils, while their cell bodies sit around the edge. Each zone has a job. The antennal lobes sort smells, the mushroom bodies learn, the central complex keeps a compass heading, and the gnathal ganglia run taste and feeding."),
    chips, info, flowEl,
    src("Neuropil meshes: FlyWire · nomenclature: Ito et al., Neuron 2014"),
  );
  describe(null);
  charts.flowMatrix(flowEl, app.data.connectome.systemFlow, npMeta.systems);
  const offHover = app.onHover((ndc, ev) => {
    const m = layers.neuropils.pick(ndc);
    layers.neuropils.highlight(m ? (x) => x.name === m.name || (active && x.system === active.id) : (active ? (x) => x.system === active.id : null));
    if (!m) return false;
    const blurb = REGION_BLURBS[m.abbr] || "";
    showTip(ev.clientX, ev.clientY, `<div class="tt-k">${escapeHtml(m.name.replace("_", " · "))}</div><div class="tt-v">${escapeHtml(m.full)}${m.side !== "center" ? ` (${m.side})` : ""}</div>${blurb ? `<div>${escapeHtml(blurb)}</div>` : ""}<div class="tt-k" style="margin-top:4px">${fmt.format(Math.round(m.volume_um3 / 1000))}k µm³</div>`);
    return true;
  });
  return () => { offHover(); layers.neuropils.highlight(null); layers.neurons.setHighlight(null); };
}

// ---------------------------------------------------------------- 5 · wiring
function wiring(app, card) {
  const { layers } = app;
  app.stage({ points: { intensity: 0.08, color: "nt" }, neuropils: { k: 0.3, brainOnly: true }, arcs: true });
  app.view({ dir: [0.45, 0.25, 1], dist: 1180, shift: "left" });
  const c = app.data.connectome;
  const kinds = { ach: true, gaba: true, glu: true, other: true };
  const chips = h("div", { class: "chips" });
  for (const [k, label, nt] of [["ach", "Acetylcholine", "acetylcholine"], ["gaba", "GABA", "gaba"], ["glu", "Glutamate", "glutamate"], ["other", "Modulators", "dopamine"]]) {
    const b = h("button", { class: "chip", type: "button", "aria-pressed": "true", style: `--c:${NTS[nt].color}` }, h("span", { class: "sw" }), label);
    b.addEventListener("click", () => { kinds[k] = !kinds[k]; b.setAttribute("aria-pressed", String(kinds[k])); layers.arcs.setKinds(kinds); });
    chips.append(b);
  }
  const ntEl = h("div", {}), histEl = h("div", {}), hubEl = h("div", {});
  card.append(
    kicker(4, "Wiring"),
    h("h2", { html: `<em>54.5 million</em> synapses` }),
    para(`Each arc is a real connection between two neurons, one of ${fmt.format(layers.arcs.count)} strong ones sampled from ${fmtCompact.format(c.pairs)} connected pairs. It bends through the neuropil where their synapses sit, and pulses travel from sender to receiver.`),
    para("Colour shows what the sender releases. Acetylcholine excites. GABA and, in flies, mostly glutamate inhibit. Dopamine, serotonin and octopamine tune the rest."),
    chips, ntEl, histEl, hubEl,
    src("Synapses: Buhmann et al. 2021 · transmitters: Eckstein et al. 2024 · FlyWire v783"),
  );
  charts.ntBars(ntEl, c.synByNt);
  charts.synHistogram(histEl, c.synHist);
  charts.hubList(hubEl, c.hubs, (d) => {
    const t = app.data.meta.cellTypes.indexOf(d.type);
    const idx = [];
    for (let i = 0; i < app.data.cols.type.length; i++) if (app.data.cols.type[i] === t) idx.push(i);
    app.focusNeurons(idx, `${d.type}: ${fmt.format(d.in + d.out)} partners`);
  });
  layers.arcs.grow(3.5);
  return () => { layers.neurons.setHighlight(null); };
}

// ---------------------------------------------------------------- 6 · characters
const CHARACTERS = {
  "compass": { tag: "EPG · PEN · Δ7", name: "The compass", story: "Wedge-shaped EPG neurons tile the ellipsoid body like the face of a clock. A single bump of activity circles the ring as the fly turns, tracking its heading even in the dark: a compass needle made of neurons." },
  "giant-fiber": { tag: "DNp01", name: "The escape switch", story: "The Giant Fiber has one of the thickest axons in the fly. When a looming shadow fills the eye it fires and launches a take-off jump within milliseconds, fast enough to dodge a swatter." },
  "looming": { tag: "LC4 · LPLC2", name: "Shadow detectors", story: "LC4 and LPLC2 visual neurons respond to objects that grow fast in view, the signature of an approaching collision. They feed the escape pathways, the Giant Fiber among them." },
  "moonwalker": { tag: "MDN", name: "The moonwalker", story: "Switch on these few descending neurons and the fly walks backwards. They carry a single command from brain to legs: reverse." },
  "steering": { tag: "DNa01 · DNa02", name: "The steering wheel", story: "Descending neurons whose activity comes just before turns. More activity on one side, and the fly veers that way." },
  "memory": { tag: "Kenyon cells · MBONs · APL", name: "The memory centre", story: "Thousands of Kenyon cells each answer to a sparse few odours. Dopamine rewrites their synapses onto mushroom body output neurons, storing memories of reward and punishment. APL, one giant inhibitory neuron, keeps the code sparse." },
  "motion": { tag: "T4 · T5 · CT1", name: "Motion detectors", story: "Every point of the visual field has T4 cells for bright moving edges and T5 cells for dark ones, in four subtypes for four directions. CT1, a single sprawling neuron per side, is the most connected cell in the brain." },
  "lobula-plate": { tag: "HS · VS cells", name: "The horizon keepers", story: "Giant tangential neurons gather motion from across the eye to sense how the fly itself is rotating, keeping its flight and gaze level." },
  "taste": { tag: "sugar GRNs → motor neurons", name: "Sweet tooth", story: "Sugar-sensing neurons from the mouthparts enter the gnathal ganglia, where a short chain of neurons reaches the motor neurons that extend the proboscis to feed. Try it live at the Pulse station." },
  "smell": { tag: "ORN DA1 → PNs", name: "A pheromone line", story: "Olfactory neurons carrying the Or67d receptor detect cVA, a pheromone used in courtship and aggression. All of them converge on one glomerulus, DA1, whose projection neurons carry the message deeper into the brain." },
  "clock": { tag: "LNv · LNd · DN", name: "The clock", story: "A small network of clock neurons keeps circadian time with a molecular feedback loop, telling the fly when to wake and when to rest." },
  "serotonin": { tag: "CSD · modulators", name: "The mood light", story: "A single serotonergic neuron per side, CSD, spreads fine branches across the olfactory centres of both hemispheres, turning the gain of smell up or down. Octopamine neurons, the insect counterpart of noradrenaline, join it here." },
};

function characters(app, card) {
  const { layers } = app;
  app.stage({ points: { intensity: 0.06, color: "class" }, neuropils: { k: 0.3, brainOnly: true } });
  app.view({ dir: [0.1, 0.25, 1], dist: 1300, shift: "left" });
  const gallery = h("div", { class: "gallery" });
  const story = h("div", { class: "char-story" });
  card.append(
    kicker(5, "Characters"),
    h("h2", { html: "Meet the <em>locals</em>" }),
    para("These are real neuron shapes, reconstructed from the microscope images, for some of the most famous cells in neuroscience. Pick one to watch it grow from its cell body."),
    gallery, story,
    src("Skeletons: FlyWire v783 (skeletons_mip_1) · cell types: Schlegel et al. 2024"),
  );
  let current = -1;
  const pick = (gi) => {
    const groups = app.data.featured.groups;
    current = gi;
    for (const b of gallery.children) b.setAttribute("aria-pressed", String(Number(b.dataset.gi) === gi));
    layers.featured.forEach((l, i) => { if (i !== gi) l.fade(0, 0.6); });
    const L = layers.featured[gi];
    L.fade(L.peak ?? 0.6, 0.3);
    L.grow(3.4);
    const g = groups[gi];
    const ch = CHARACTERS[g.id] || { name: g.id, story: "" };
    story.innerHTML = "";
    story.append(h("h3", {}, ch.name), h("p", { class: "note mono" }, `${g.types.slice(0, 6).join(" · ")}${g.types.length > 6 ? " …" : ""} · ${g.count} neuron${g.count === 1 ? "" : "s"}`), para(ch.story));
    layers.neurons.setHighlight(L.neurons, 0.05);
    const c = L.centroid();
    const r = Math.max(80, L.radius(c));
    app.view({ target: c, dir: [0.15, 0.2, 1], dist: Math.min(1500, r * 3.1), shift: "left", duration: 2.4 });
    app.audio.chime(gi);
  };
  app.ready.featured.then(() => {
    if (!card.isConnected) return;
    app.data.featured.groups.forEach((g, gi) => {
      const ch = CHARACTERS[g.id] || { name: g.id };
      const first = g.neurons[0];
      const cls = app.data.meta.superClasses[app.data.cols.super[first]];
      const b = h("button", { class: "char", type: "button", "data-gi": gi, "aria-pressed": "false", style: `--c:${CLASSES[cls]?.color}` },
        h("span", { class: "c-name" }, ch.name), h("span", { class: "c-type" }, ch.tag || g.types.slice(0, 2).join(" · ")));
      b.addEventListener("click", () => pick(gi));
      gallery.append(b);
    });
    setTimeout(() => { if (card.isConnected && current < 0) pick(0); }, 900);
  });
  if (!app.data.featured) story.append(para("Loading neuron shapes…"));
  return () => {
    layers.featured?.forEach((l) => l.fade(0, 0.5));
    layers.neurons.setHighlight(null);
  };
}

// ---------------------------------------------------------------- 7 · pulse
// What each simulated sensation leads to. `r(type)` = peak model firing rate of a cell type.
const OUTCOMES = {
  sugar: (r) => `Sweet taste reaches the feeding motor neurons. MN9, which extends the proboscis, fires at ${r("CB0701")} Hz: the fly would reach out and feed.`,
  bitter: (r) => `Bitter taste takes its own route through interneurons and descending neurons. Not one feeding motor neuron fires (MN9: ${r("CB0701")} Hz).`,
  sugar_bitter: (r) => `Add bitter to sugar and MN9 falls silent (${r("CB0701")} Hz), the same veto real flies show when food tastes bad.`,
  smell: () => "Geosmin, the smell of mould, flows from the antennal lobe's DA2 glomerulus to the lateral horn, where flies' innate aversion to it is wired.",
  light: () => "A spot of light ripples from photoreceptors through the lamina (L1–L3) into the medulla. It stays inside the optic lobe: no command leaves the brain.",
  sound: (r) => `Antennal vibration drives the hearing centres and reaches descending neurons, including the Giant Fiber escape neuron at ${r("DNp01")} Hz.`,
  groom: (r) => `Touching the antenna recruits aBN1 (${r("SAD093")} Hz) and the descending neurons that start antennal grooming, the circuit the original model predicted.`,
  escape: (r) => `Looming detectors drive the Giant Fiber to ${r("DNp01")} Hz: the command for an escape jump.`,
};


function pulse(app, card, side) {
  const { layers, sim } = app;
  app.stage({ points: { intensity: 0.08, color: "class" }, neuropils: { k: 0.3, brainOnly: true } });
  app.view({ dir: [0.05, 0.2, 1], dist: 1350, shift: "both" });
  const grid = h("div", { class: "stimuli" });
  const playBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "Play" });
  const setPlayIcon = (on) => {
    playBtn.innerHTML = on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>';
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
  };
  setPlayIcon(false);
  const clock = h("span", { class: "clock" }, "0.0 ms");
  const scrub = h("input", { type: "range", id: "sim-scrub", min: "0", max: "1000", value: "0", "aria-label": "Simulation time" });
  const speedSeg = h("div", { class: "seg", role: "group", "aria-label": "Playback speed" });
  [["0.025", "¼×"], ["0.075", "1×"], ["0.25", "3×"]].forEach(([v, l]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === "0.075") }, l);
    b.addEventListener("click", () => { sim.speed = Number(v); for (const x of speedSeg.children) x.setAttribute("aria-pressed", String(x === b)); });
    speedSeg.append(b);
  });
  const outcome = h("div", { class: "outcome", hidden: true });
  const tops = h("div", {});
  card.append(
    kicker(6, "Pulse"),
    h("h2", { html: "Watch a <em>thought</em> happen" }),
    para("Here the connectome runs as a simulation. Every neuron is a simple spiking unit wired exactly as in FlyWire, the whole-brain model of Shiu et al. (Nature 2024), re-run on this data. Choose a sensation and watch spikes cascade through the real wiring."),
    grid,
    h("div", { class: "transport" }, playBtn, clock, scrub),
    h("div", { class: "actions" }, speedSeg),
    outcome, tops,
    h("p", { class: "note" }, "A model, not the fly: it ignores hormones, electrical synapses and learning. Its predictions for feeding and grooming circuits were confirmed in real flies. Time is slowed about 13×."),
    src("Model after Shiu et al., Nature 2024 · FlyWire v783 · 1 simulated second per run"),
  );

  // side: raster + pathway
  const rasterCanvas = h("canvas", { class: "raster", "aria-label": "Spike raster of active neurons" });
  const rasterHead = h("span", { class: "r" }, "");
  const pw = h("div", { class: "pathway" });
  side.append(
    h("div", { class: "panel-frame" }, h("div", { class: "panel-head" }, h("span", { class: "t" }, "Spikes · one row per active neuron"), rasterHead), rasterCanvas),
    h("div", { class: "panel-frame" }, h("div", { class: "panel-head" }, h("span", { class: "t" }, "How the signal travelled"), h("span", { class: "r" }, "strongest links")), pw),
  );
  side.hidden = false;
  const raster = new Raster(rasterCanvas, (n) => CHART_CLASS_COLOR[chartClassOf(app.data.meta.superClasses[app.data.cols.super[n]])]);

  const offSim = sim.on((kind) => {
    if (kind === "state") setPlayIcon(sim.playing);
    if (kind === "time" || kind === "select") {
      clock.textContent = `${sim.tMs.toFixed(1)} ms`;
      if (!scrubbing) scrub.value = String(Math.round(1000 * sim.tMs / sim.duration));
      raster.draw(sim.tMs);
    }
  });
  let scrubbing = false;
  scrub.addEventListener("input", () => { scrubbing = true; sim.stop(); sim.seek(scrub.value / 1000 * sim.duration); });
  scrub.addEventListener("change", () => { scrubbing = false; });
  playBtn.addEventListener("click", () => sim.toggle());

  const choose = async (exp, btn) => {
    for (const b of grid.children) b.setAttribute("aria-pressed", String(b === btn));
    outcome.hidden = true;
    const data = await sim.select(exp);
    if (!card.isConnected) return;
    raster.build(data, sim.duration);
    rasterHead.textContent = `${fmt.format(exp.active_neurons)} neurons · ${fmt.format(exp.spikes)} spikes`;
    charts.pathway(pw, exp.pathway, 480);
    const typeCode = (name) => app.data.meta.cellTypes.indexOf(name);
    const r = (name) => {
      const t = typeCode(name);
      let best = 0;
      for (let k = 0; k < data.rateIdx.length; k++) if (app.data.cols.type[data.rateIdx[k]] === t) best = Math.max(best, data.rate[k]);
      return best.toFixed(best < 10 ? 1 : 0);
    };
    outcome.textContent = OUTCOMES[exp.id] ? OUTCOMES[exp.id](r) : "";
    outcome.hidden = !OUTCOMES[exp.id];
    tops.innerHTML = "";
    const outs = (exp.outputs || []).slice(0, 4);
    if (outs.length) {
      tops.append(h("p", { class: "note", html: `Commands leaving the brain: ${outs.map((o) => `<strong>${escapeHtml(o.aka || o.type)}</strong> ${Math.round(o.rate)} Hz`).join(", ")}` }));
    }
    tops.append(h("p", { class: "note" }, exp.stimulus.description));
    if (exp.note) tops.append(h("p", { class: "note" }, `Model caveat: ${exp.note}`));
    const stimIdx = Array.from(data.stim);
    layers.neurons.setHighlight(null);
    const c = layers.neurons.centroid(stimIdx);
    app.view({ target: [c[0] * 0.4, c[1] * 0.4, c[2] * 0.4], dir: [0.05, 0.2, 1], dist: 1250, shift: "both", duration: 1.8 });
    sim.play();
    app.audio.chime(2);
  };
  sim.index().then((idx) => {
    if (!card.isConnected) return;
    idx.experiments.forEach((exp, i) => {
      const b = h("button", { class: "stim", type: "button", "aria-pressed": "false" },
        h("span", { class: "s-name" }, exp.label), h("span", { class: "s-sub" }, `${fmt.format(exp.stimulus.count)} neurons at ${Math.round(exp.stimulus.rate_hz || 150)} Hz`));
      b.addEventListener("click", () => choose(exp, b));
      grid.append(b);
      if (i === 0) setTimeout(() => card.isConnected && choose(exp, b), 700);
    });
  }).catch(() => grid.append(para("The simulation data is still being prepared.")));
  return () => { offSim(); sim.clear(); side.hidden = true; };
}

// ---------------------------------------------------------------- 8 · scale
function scale(app, card) {
  app.stage({ points: { intensity: 0.34, color: "class" }, neuropils: { k: 0.3, brainOnly: true }, forest: 0.2 });
  app.view({ dir: [0.3, 0.3, 1], dist: 3600, shift: "left", duration: 3.4 });
  const tl = h("div", {});
  const go = h("button", { class: "btn btn-primary", type: "button" }, "Explore freely");
  go.addEventListener("click", () => app.go(STATIONS.length - 1));
  card.append(
    kicker(7, "Scale"),
    h("h2", { html: "From 302 to <em>139,255</em>" }),
    para("The whole brain you've just crossed is under a millimetre wide. It is the largest brain ever mapped synapse by synapse, and the first complete map of an adult animal that walks, flies, learns and courts."),
    tl,
    para("A mouse brain has about 500 times more neurons, a human brain about 600,000 times more. The same pipeline of microscopes, AI and human proofreaders is now pointed at them."),
    h("div", { class: "actions" }, go),
    src("White et al. 1986 · Scheffer et al. 2020 · Winding et al. 2023 · Dorkenwald et al. 2024 · MICrONS Consortium 2025"),
  );
  charts.timeline(tl);
  return () => {};
}

export const CHAPTERS = { slice, assembly, census, territories, wiring, characters, pulse, scale };
