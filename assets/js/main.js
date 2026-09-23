// Neuronaut: boot, loading, stations and shared interactions.
import * as THREE from "three";
import { World } from "./world.js";
import { DATA, fetchJSON, loadColumns, fmt } from "./data.js";
import { NeuronLayer } from "./layers/neurons.js";
import { NeuropilLayer } from "./layers/neuropils.js";
import { ArcLayer } from "./layers/arcs.js";
import { SkeletonLayer } from "./layers/skeletons.js";
import { EMSweep } from "./layers/em.js";
import { SimPlayer } from "./sim.js";
import { Audio } from "./audio.js";
import { STATIONS, CHAPTERS } from "./chapters.js";
import { Explorer } from "./explore.js";
import { NeuronCard } from "./neuroncard.js";
import { $, h, showTip, hideTip, escapeHtml, toast, setText } from "./ui.js";
import { CLASSES, NTS } from "./theme.js";

const world = new World($("#world"));
world.start();
const audio = new Audio();

const app = {
  world, audio,
  data: {}, layers: {},
  station: -1,
  ready: {},
  hoverHandlers: new Set(),
  visitId: 0,
  alive(v) { return app.visitId === v; }, // is the station visit that scheduled work still current?
};
window.neuronaut = app; // handy for curious visitors in the console

// ------------------------------------------------------------------ loading
const loadList = $("#load-list");
function loadItem(label, detail) {
  const bar = h("span", { class: "bar" }, h("i"));
  const li = h("li", {}, h("span", {}, label), bar, h("span", { class: "d" }, detail));
  loadList.append(li);
  return {
    progress: (p) => bar.style.setProperty("--p", p.toFixed(3)),
    done: (text) => { bar.style.setProperty("--p", "1"); li.classList.add("done"); if (text) li.lastChild.textContent = text; },
    fail: () => { li.lastChild.textContent = "unavailable"; },
  };
}

function defer() { let resolve, reject; const p = new Promise((a, b) => { resolve = a; reject = b; }); p.resolve = resolve; p.reject = reject; return p; }
app.ready.forest = defer();
app.ready.featured = defer();

async function boot() {
  const iNeurons = loadItem("neurons", "cell bodies");
  const iRegions = loadItem("brain regions", "78 neuropils");
  const iWiring = loadItem("wiring", "connections");
  const iEM = loadItem("microscopy", "FAFB sections");
  const iShapes = loadItem("neuron shapes", "skeletons");

  const [meta, cols] = await Promise.all([fetchJSON(DATA + "neurons.json"), loadColumns(DATA + "neurons.bin", iNeurons.progress)]);
  app.data.meta = meta; app.data.cols = cols;
  app.layers.neurons = new NeuronLayer(world, cols, meta);
  iNeurons.done(`${fmt.format(meta.count)} cells`);
  // the brain condenses out of the void while everything else loads
  app.layers.neurons.uniforms.uReveal.value = -0.05;
  app.layers.neurons.uniforms.uFlash.value = 0.6;
  app.layers.neurons.tween("uReveal", -0.05, 1.06, world.reduced ? 0.01 : 6);

  const regions = Promise.all([fetchJSON(DATA + "neuropils.json"), loadColumns(DATA + "neuropils.bin", iRegions.progress)]).then(([npMeta, npCols]) => {
    app.data.npMeta = npMeta;
    app.layers.neuropils = new NeuropilLayer(world, npCols, npMeta);
    app.layers.neuropils.setOpacity(0.3, { brainOnly: true });
    app.layers.neuropils.show(true);
    iRegions.done();
  });
  const connectome = fetchJSON(DATA + "connectome.json").then((c) => { app.data.connectome = c; });
  const arcs = Promise.all([regions, loadColumns(DATA + "arcs.bin", iWiring.progress)]).then(([, a]) => {
    app.layers.arcs = new ArcLayer(world, a, app.layers.neurons, app.layers.neuropils, meta);
    iWiring.done(`${fmt.format(a.pre.length)} strong connections`);
  });
  const em = fetchJSON(DATA + "em/meta.json").then((m) => {
    app.data.em = m;
    app.layers.em = new EMSweep(world, m);
    iEM.done(`${m.images.length} images`);
  });
  await Promise.all([regions, connectome, arcs, em]);

  app.sim = new SimPlayer(world, app.layers.neurons, audio);
  app.explorer = new Explorer(app, $("#explore"));
  app.card = new NeuronCard(app, $("#neuron-card"));

  // shapes stream in after the voyage can begin
  let shapesDone = 0;
  const shapeTick = () => { shapesDone++; if (shapesDone === 2) iShapes.done(`${fmt.format((app.data.forest?.count || 0) + (app.data.featuredCount || 0))} skeletons`); };
  Promise.all([fetchJSON(DATA + "forest.json"), loadColumns(DATA + "forest.bin", (p) => iShapes.progress(p * 0.7))]).then(([fm, fc]) => {
    app.data.forest = fm;
    app.layers.forest = new SkeletonLayer(world, fc, meta, cols, { opacity: 0.012, maxGain: 2.5 });
    app.ready.forest.resolve();
    shapeTick();
  }).catch((e) => { console.warn(e); iShapes.fail(); });
  Promise.all([fetchJSON(DATA + "featured.json"), loadColumns(DATA + "featured.bin")]).then(([fm, fc]) => {
    app.data.featured = fm;
    app.data.featuredCount = fc.nIndex.length;
    // each character gets its own spectrum so individual cells stay distinguishable in the tangle
    app.layers.featured = fm.groups.map((g, gi) => {
      const base = (0.02 + gi * 0.137) % 1;
      const colorFor = (m) => {
        const k = g.count > 1 ? (m - g.start) / (g.count - 1) : 0.5;
        const c = new THREE.Color().setHSL((base + (k - 0.5) * 0.42 + 1) % 1, 0.9, 0.62);
        return [c.r, c.g, c.b];
      };
      const layer = new SkeletonLayer(world, fc, meta, cols, { range: [g.start, g.start + g.count], opacity: 0, colorFor });
      layer.peak = Math.min(0.9, Math.max(0.2, 1.7 / Math.sqrt(g.count)));
      return layer;
    });
    app.ready.featured.resolve();
    shapeTick();
  }).catch((e) => { console.warn(e); iShapes.fail(); });

  $("#begin-sound").disabled = false;
  $("#begin-quiet").disabled = false;
  $("#begin-sound").focus({ preventScroll: true });
}

boot().catch((err) => {
  console.error(err);
  loadList.append(h("li", {}, `Something went wrong while loading: ${err.message}. Try reloading the page.`));
});

// ------------------------------------------------------------------ stage & camera
let stageTweens = [];
app.stage = function stage({ points = {}, neuropils = null, em = false, arcs = false, forest = 0 } = {}) {
  const L = app.layers;
  const n = L.neurons;
  stageTweens.forEach((off) => off());
  stageTweens = [];
  if (points.color) n.setColorMode(points.color);
  const target = points.intensity ?? 0.3;
  n.tween("uIntensity", n.uniforms.uIntensity.value, target, 1.2);
  n.stopTween("uReveal");
  n.uniforms.uReveal.value = points.reveal ?? 2;
  n.uniforms.uFlash.value = points.reveal === 0 ? 1 : 0;
  if (neuropils) L.neuropils.fadeTo(neuropils.k, 1.2, { brainOnly: !!neuropils.brainOnly });
  else L.neuropils.fadeTo(0, 0.8);
  if (!em) L.em.setOpacity(0);
  if (arcs) L.arcs.show(true); else L.arcs.show(false);
  if (L.forest) {
    if (forest > 0) { L.forest.uniforms.uGrow.value = 1.02; L.forest.fade(forest, 1.5); }
    else L.forest.fade(0, 0.8);
  }
  L.featured?.forEach((f) => f.fade(0, 0.5));
  n.setHighlight(null);
};

function layout() {
  const W = innerWidth, H = innerHeight;
  const mobile = W <= 860;
  const stage = $("#stage"), side = $("#side-panel"), explore = $("#explore");
  const leftPanel = !stage.hidden ? stage : (!explore.hidden ? explore : null);
  const cardR = !leftPanel || mobile ? 0 : leftPanel.getBoundingClientRect().right;
  const sideW = side.hidden || mobile ? 0 : W - side.getBoundingClientRect().left;
  const cardTop = mobile && leftPanel ? (leftPanel === stage ? $("#card") : explore).getBoundingClientRect().top : H;
  return { W, H, mobile, cardR, sideW, cardTop };
}

app.view = async function view({ dir = [0, 0.2, 1], dist = 1400, target = [0, 0, 0], shift = "left", duration = 2.8 } = {}) {
  // wait a frame so the panels that frame the brain have their final layout
  await new Promise((r) => requestAnimationFrame(r));
  const { W, H, mobile, cardR, sideW, cardTop } = layout();
  // narrow portrait screens need to stand further back to fit the brain's width
  dist *= Math.min(2.2, Math.max(1, 0.8 / (W / H)));
  const d = new THREE.Vector3(...dir).normalize();
  const t = new THREE.Vector3(...target);
  const p = t.clone().addScaledVector(d, dist);
  const fov = THREE.MathUtils.degToRad(world.camera.fov);
  const visH = 2 * dist * Math.tan(fov / 2), visW = visH * (W / H);
  const fwd = t.clone().sub(p).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
  let sx = 0, sy = 0;
  if (!mobile) {
    const left = shift === "none" ? 0 : cardR;
    const rightPad = shift === "both" ? sideW : 0;
    sx = (left - rightPad) / 2 / W * visW;
  } else if (shift !== "none") {
    sy = ((H - cardTop) / 2) / H * visH * 0.92;
  }
  const off = right.clone().multiplyScalar(-sx).add(up.clone().multiplyScalar(-sy));
  return world.flyTo({ position: p.add(off).toArray(), target: t.add(off).toArray(), duration });
};

app.focusNeurons = function focusNeurons(idx, message) {
  if (!idx.length) return;
  app.layers.neurons.setHighlight(idx, 0.06);
  const c = app.layers.neurons.centroid(idx);
  let r = 0;
  for (const i of idx) { const p = app.layers.neurons.worldPos(i); r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2])); }
  app.view({ target: c, dir: [0.2, 0.25, 1], dist: Math.max(300, Math.min(1500, r * 3.2)), shift: "left", duration: 2 });
  if (message) toast(message);
};

// ------------------------------------------------------------------ stations
const card = $("#card"), side = $("#side-panel"), stageEl = $("#stage");
let cleanup = null;
const rail = $("#rail");
STATIONS.forEach((s, i) => {
  const b = h("button", { type: "button", "aria-label": `${String(i + 1).padStart(2, "0")} ${s.rail}` },
    h("span", { class: "rail-label" }, `${String(i + 1).padStart(2, "0")} ${s.rail}`), h("span", { class: "rail-tick" }));
  b.addEventListener("click", () => app.go(i));
  rail.append(b);
});

app.go = function go(i) {
  i = Math.max(0, Math.min(STATIONS.length - 1, i));
  if (i === app.station) return;
  cleanup?.();
  cleanup = null;
  hideTip();
  app.station = i;
  app.visitId++;
  const s = STATIONS[i];
  [...rail.children].forEach((b, k) => { if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  $("#topbar-station").textContent = `${String(i + 1).padStart(2, "0")} / ${String(STATIONS.length).padStart(2, "0")} · ${s.title}`;
  $("#explore-btn").setAttribute("aria-pressed", String(s.id === "explore"));
  try { history.replaceState(null, "", `#${s.id}`); } catch {}
  card.innerHTML = "";
  side.innerHTML = "";
  side.hidden = true;
  document.body.classList.remove("has-side");
  audio.chime(i);
  if (s.id === "explore") {
    stageEl.hidden = true;
    app.explorer.open();
    cleanup = () => app.explorer.close();
    return;
  }
  stageEl.hidden = false;
  card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
  const chapterCleanup = CHAPTERS[s.id](app, card, side);
  // phones: the side panel's instruments flow inside the card instead of covering the brain
  if (innerWidth <= 860 && !side.hidden) {
    card.append(...side.children);
    side.hidden = true;
  }
  document.body.classList.toggle("has-side", !side.hidden);
  card.append(navRow(i));
  card.scrollTop = 0;
  cleanup = chapterCleanup;
};

function navRow(i) {
  const prev = h("button", { class: "btn btn-ghost", type: "button", disabled: i === 0 }, "← Back");
  const next = h("button", { class: "btn btn-primary", type: "button" }, i === STATIONS.length - 2 ? "Explore freely →" : `${STATIONS[i + 1].rail} →`);
  prev.addEventListener("click", () => app.go(i - 1));
  next.addEventListener("click", () => app.go(i + 1));
  return h("div", { class: "card-nav" }, prev, h("span", { class: "step-count" }, `${i + 1} / ${STATIONS.length}`), next);
}

// ------------------------------------------------------------------ begin
function begin(withSound) {
  $("#arrival").classList.add("gone");
  ["#topbar", "#rail", "#stage", "#hud"].forEach((s) => { $(s).hidden = false; });
  if (withSound) { audio.setEnabled(true); $("#sound-btn").setAttribute("aria-pressed", "true"); $("#sound-btn").setAttribute("aria-label", "Sound on"); }
  const fromHash = STATIONS.findIndex((s) => `#${s.id}` === location.hash);
  app.go(fromHash >= 0 ? fromHash : 0);
}
$("#begin-sound").addEventListener("click", () => begin(true));
$("#begin-quiet").addEventListener("click", () => begin(false));
$("#sound-btn").addEventListener("click", () => {
  const on = !audio.enabled;
  audio.setEnabled(on);
  $("#sound-btn").setAttribute("aria-pressed", String(on));
  $("#sound-btn").setAttribute("aria-label", on ? "Sound on" : "Sound off");
});
$("#brand").addEventListener("click", () => app.go(0));
let lastStory = 0;
$("#explore-btn").addEventListener("click", () => {
  const ex = STATIONS.length - 1;
  if (app.station === ex) app.go(lastStory);
  else { lastStory = Math.max(0, app.station); app.go(ex); }
});
const about = $("#about");
$("#about-btn").addEventListener("click", () => about.showModal());
$("#about-close").addEventListener("click", () => about.close());
about.addEventListener("click", (e) => { if (e.target === about) about.close(); });

addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea, select, dialog")) return;
  if (!$("#arrival").classList.contains("gone")) return;
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); app.go(app.station + 1); }
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); app.go(app.station - 1); }
  if (e.key === "Escape") app.card?.close();
});

// ------------------------------------------------------------------ pointer: hover & pick
const canvas = $("#world");
let down = null, pending = null;
app.onHover = (fn) => { app.hoverHandlers.add(fn); return () => app.hoverHandlers.delete(fn); };
function ndcOf(ev) {
  const r = canvas.getBoundingClientRect();
  return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
}
canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener("pointerleave", () => hideTip());
canvas.addEventListener("pointermove", (e) => {
  if (e.buttons || !app.layers.neurons || e.pointerType === "touch") return;
  if (pending) { pending = e; return; }
  pending = e;
  requestAnimationFrame(() => {
    const ev = pending; pending = null;
    const ndc = ndcOf(ev);
    for (const fn of app.hoverHandlers) if (fn(ndc, ev)) { canvas.style.cursor = "pointer"; return; }
    const i = app.layers.neurons.pick(ndc.x, ndc.y);
    if (i < 0) { hideTip(); canvas.style.cursor = ""; return; }
    canvas.style.cursor = "pointer";
    showTip(ev.clientX, ev.clientY, neuronTip(i));
  });
});
canvas.addEventListener("pointerup", (e) => {
  if (!down || !app.layers.neurons || !app.card) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  if (moved > 6 || performance.now() - down.t > 600) return;
  if (document.body.classList.contains("has-side")) return; // instruments occupy the right side
  const ndc = ndcOf(e);
  const i = app.layers.neurons.pick(ndc.x, ndc.y, e.pointerType === "touch" ? 18 : 9);
  if (i >= 0) { hideTip(); app.card.show(i); }
});

function neuronTip(i) {
  const m = app.data.meta, c = app.data.cols;
  const cls = m.superClasses[c.super[i]], nt = m.nts[c.nt[i]], type = m.cellTypes[c.type[i]] || "untyped";
  return `<div class="tt-k">${escapeHtml(CLASSES[cls]?.label || cls)} · ${escapeHtml(m.sides[c.side[i]] || "")}</div>
    <div class="tt-v"><span class="tt-sw" style="--c:${CLASSES[cls]?.color}"></span>${escapeHtml(type)}</div>
    <div>${escapeHtml(NTS[nt]?.label || "Unknown transmitter")}${document.body.classList.contains("has-side") ? "" : " · click for its partners"}</div>`;
}

// ------------------------------------------------------------------ HUD
const hudPos = $("#hud-pos"), hudCount = $("#hud-count"), hudMode = $("#hud-mode");
setInterval(() => {
  if ($("#hud").hidden) return;
  const p = world.camera.position, t = world.controls.target;
  const d = p.distanceTo(t);
  // rounded to 10 µm so the slow auto-orbit doesn't make the readout flicker
  const r10 = (v) => Math.round(v / 10) * 10;
  setText(hudPos, `cam ${r10(-p.x)} ${r10(p.y)} ${r10(p.z)} µm · range ${r10(d)} µm`);
  setText(hudCount, `${fmt.format(app.data.meta?.count || 0)} neurons`);
  setText(hudMode, app.sim?.playing ? `simulating · ${Math.round(app.sim.tMs / 10) * 10} ms` : "FlyWire v783");
}, 500);
