// Hand-built SVG charts (d3 for scales). One chart surface: the dark panel.
import * as d3 from "d3";
import { NTS, NT_ORDER, CHART_CLASS_COLOR, chartClassOf, CLASSES } from "./theme.js";
import { h, showTip, hideTip, escapeHtml } from "./ui.js";
import { fmt, fmtCompact } from "./data.js";

const W = 380;

function frame(el, title, height) {
  el.innerHTML = "";
  el.classList.add("chart");
  if (title) el.append(h("div", { class: "chart-title" }, title));
  const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${height}`).attr("role", "img");
  return svg;
}

function tableToggle(el, headers, rows) {
  const btn = h("button", { class: "table-toggle", type: "button", "aria-expanded": "false" }, "Show as table");
  const tbl = h("table", { class: "data-table", hidden: true },
    h("thead", {}, h("tr", {}, headers.map((x, i) => h("th", { class: i ? "n" : "" }, x)))),
    h("tbody", {}, rows.map((r) => h("tr", {}, r.map((c, i) => h("td", { class: i ? "n" : "" }, c))))));
  btn.addEventListener("click", () => {
    tbl.hidden = !tbl.hidden;
    btn.setAttribute("aria-expanded", String(!tbl.hidden));
    btn.textContent = tbl.hidden ? "Show as table" : "Hide table";
  });
  el.append(btn, tbl);
}

// Synapses by transmitter: horizontal bars, direct-labelled.
export function ntBars(el, synByNt) {
  const total = Object.values(synByNt).reduce((a, b) => a + b, 0);
  const rows = NT_ORDER.map((k) => ({ k, v: synByNt[k] || 0 }));
  const rowH = 22, top = 4, labelW = 92, valW = 86;
  const svg = frame(el, "Synapses by transmitter of the sending neuron", top + rows.length * rowH);
  const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.v)]).range([0, W - labelW - valW]);
  const g = svg.selectAll("g.row").data(rows).join("g").attr("class", "row")
    .attr("transform", (d, i) => `translate(0,${top + i * rowH})`);
  g.append("rect").attr("x", 0).attr("y", 0).attr("width", W).attr("height", rowH).attr("fill", "transparent");
  g.append("text").attr("class", "lbl").attr("x", 0).attr("y", 13).text((d) => NTS[d.k].label);
  g.append("rect").attr("x", labelW).attr("y", 5).attr("height", 10).attr("rx", 3)
    .attr("fill", (d) => NTS[d.k].color).attr("width", (d) => Math.max(3, x(d.v)));
  g.append("text").attr("class", "val").attr("x", (d) => labelW + Math.max(3, x(d.v)) + 6).attr("y", 14)
    .text((d) => `${fmtCompact.format(d.v)} · ${(100 * d.v / total).toFixed(d.v / total < 0.02 ? 1 : 0)}%`);
  g.on("pointermove", (ev, d) => showTip(ev.clientX, ev.clientY,
    `<div class="tt-k">${NTS[d.k].role}</div><div class="tt-v"><span class="tt-sw" style="--c:${NTS[d.k].color}"></span>${NTS[d.k].label}</div><div>${fmt.format(d.v)} synapses</div>`))
    .on("pointerleave", hideTip);
  tableToggle(el, ["Transmitter", "Synapses", "Share"], rows.map((r) => [NTS[r.k].label, fmt.format(r.v), `${(100 * r.v / total).toFixed(1)}%`]));
}

// How many synapses link a pair of neurons: log-binned histogram on a log count axis.
export function synHistogram(el, hist) {
  const labels = ["1", "2", "3–4", "5–9", "10–19", "20–49", "50–99", "100–199", "200–499", "500–999", "1000+"];
  const data = hist.counts.map((v, i) => ({ label: labels[i], v }));
  const Hh = 150, left = 34, bottom = 30, top = 8;
  const svg = frame(el, "Connections by number of synapses", Hh + bottom + top);
  const x = d3.scaleBand().domain(data.map((d) => d.label)).range([left, W]).paddingInner(0.18);
  const y = d3.scaleLog().domain([10, 1e7 * 1.2]).range([top + Hh, top]);
  const grid = svg.append("g").attr("class", "grid");
  [10, 1e3, 1e5, 1e7].forEach((t) => {
    grid.append("line").attr("x1", left).attr("x2", W).attr("y1", y(t)).attr("y2", y(t));
    svg.append("text").attr("x", left - 6).attr("y", y(t) + 3).attr("text-anchor", "end").text(fmtCompact.format(t));
  });
  const bars = svg.selectAll("g.b").data(data).join("g").attr("class", "b");
  bars.append("rect").attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
    .attr("y", (d) => y(Math.max(10, d.v))).attr("height", (d) => y(10) - y(Math.max(10, d.v)))
    .attr("rx", 3).attr("fill", (d, i) => (i >= 3 ? "#3987e5" : "#2a5a9c"));
  bars.append("rect").attr("x", (d) => x(d.label) - 2).attr("width", x.bandwidth() + 4).attr("y", top).attr("height", Hh).attr("fill", "transparent")
    .on("pointermove", (ev, d) => showTip(ev.clientX, ev.clientY, `<div class="tt-k">${d.label} synapse${d.label === "1" ? "" : "s"}</div><div class="tt-v">${fmt.format(d.v)} neuron pairs</div>`))
    .on("pointerleave", hideTip);
  svg.selectAll("text.xl").data(data).join("text").attr("class", "xl")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2).attr("y", top + Hh + 12).attr("text-anchor", "middle")
    .text((d, i) => (i % 2 === 0 || i === data.length - 1 ? d.label : ""));
  svg.append("text").attr("x", x("5–9")).attr("y", top + Hh + 25).attr("class", "lbl")
    .text("↑ 5+ synapses: the usual threshold for a confident connection");
  tableToggle(el, ["Synapses per pair", "Pairs"], data.map((d) => [d.label, fmt.format(d.v)]));
}

// Where signals are routed: row-normalised flow between neuropil systems.
export function flowMatrix(el, flow, systems) {
  const names = flow.systems;
  const keep = names.map((_, i) => i).filter((i) => names[i] !== "ocg");
  const M = keep.map((i) => keep.map((j) => flow.flow[i][j]));
  const rowSum = M.map((r) => r.reduce((a, b) => a + b, 0) || 1);
  const short = { optic: "Optic", mb: "MB", cx: "CX", al: "AL", lh: "LH", snp: "SNP", vlnp: "VLNP", lx: "LX", inp: "INP", vmnp: "VMNP", penp: "PENP", gng: "GNG" };
  const full = Object.fromEntries(systems.map((s) => [s.id, s.name]));
  const n = keep.length, left = 50, top = 46, cell = (W - left) / n;
  const svg = frame(el, "Where each region's neurons send their output", top + n * cell + 4);
  const color = d3.scaleSequentialSqrt([0, 0.6], d3.interpolateRgb("#101a34", "#cde2fb")).clamp(true);
  keep.forEach((si, c) => {
    svg.append("text").attr("x", left + c * cell + cell / 2 - 2).attr("y", top - 6).attr("text-anchor", "start")
      .attr("transform", `rotate(-55 ${left + c * cell + cell / 2 - 2} ${top - 6})`).text(short[names[si]]);
  });
  keep.forEach((si, r) => {
    svg.append("text").attr("x", left - 6).attr("y", top + r * cell + cell / 2 + 3).attr("text-anchor", "end").attr("class", "lbl").text(short[names[si]]);
    keep.forEach((sj, c) => {
      const frac = M[r][c] / rowSum[r];
      svg.append("rect").attr("x", left + c * cell + 1).attr("y", top + r * cell + 1).attr("width", cell - 2).attr("height", cell - 2)
        .attr("rx", 2).attr("fill", color(frac))
        .on("pointermove", (ev) => showTip(ev.clientX, ev.clientY,
          `<div class="tt-k">${escapeHtml(full[names[si]])} → ${escapeHtml(full[names[sj]])}</div><div class="tt-v">${(100 * frac).toFixed(1)}% of output</div><div>${fmtCompact.format(M[r][c])} synapses</div>`))
        .on("pointerleave", hideTip);
    });
  });
  tableToggle(el, ["From → to", "Share of output"],
    keep.flatMap((si, r) => keep.map((sj, c) => [`${short[names[si]]} → ${short[names[sj]]}`, `${(100 * M[r][c] / rowSum[r]).toFixed(1)}%`]))
      .filter((row) => parseFloat(row[1]) >= 5));
}

// The history of connectomes on a log scale.
export function timeline(el) {
  const pts = [
    { y: 1986, n: 302, name: "C. elegans", note: "the first connectome", dx: 8, dy: -4 },
    { y: 2020, n: 25000, name: "Hemibrain", note: "part of a fly brain", partial: true, dx: -8, dy: -10, anchor: "end" },
    { y: 2023, n: 3016, name: "Fruit fly larva", note: "whole brain", dx: -8, dy: 14, anchor: "end" },
    { y: 2024, n: 139255, name: "FlyWire", note: "whole adult fly brain", hero: true, dx: -10, dy: -6, anchor: "end" },
    { y: 2025, n: 200000, name: "MICrONS", note: "1 mm³ of mouse cortex, cells", partial: true, dx: -10, dy: -24, anchor: "end" },
  ];
  const refs = [
    { n: 7e7, name: "Mouse brain · ~70 million neurons" },
    { n: 8.6e10, name: "Human brain · ~86 billion neurons" },
  ];
  const Hh = 220, left = 38, right = 12, top = 12, bottom = 22;
  const svg = frame(el, "Neurons in mapped connectomes", Hh + top + bottom);
  const x = d3.scaleLinear().domain([1980, 2028]).range([left, W - right]);
  const y = d3.scaleLog().domain([100, 2e11]).range([top + Hh, top]);
  const grid = svg.append("g").attr("class", "grid");
  [1e2, 1e4, 1e6, 1e8, 1e10].forEach((t) => {
    grid.append("line").attr("x1", left).attr("x2", W - right).attr("y1", y(t)).attr("y2", y(t));
    svg.append("text").attr("x", left - 6).attr("y", y(t) + 3).attr("text-anchor", "end").text(fmtCompact.format(t));
  });
  [1980, 1990, 2000, 2010, 2020].forEach((t) => svg.append("text").attr("x", x(t)).attr("y", top + Hh + 16).attr("text-anchor", "middle").text(t));
  refs.forEach((r) => {
    svg.append("line").attr("x1", left).attr("x2", W - right).attr("y1", y(r.n)).attr("y2", y(r.n))
      .attr("stroke", "#b1adc9").attr("stroke-dasharray", "3 4").attr("stroke-opacity", 0.55);
    svg.append("text").attr("x", left + 4).attr("y", y(r.n) - 5).attr("class", "lbl").text(r.name);
  });
  const g = svg.selectAll("g.p").data(pts).join("g").attr("class", "p").attr("transform", (d) => `translate(${x(d.y)},${y(d.n)})`);
  g.append("circle").attr("r", (d) => (d.hero ? 6 : 4.5)).attr("fill", (d) => (d.hero ? "#a6f4ff" : "#0b0a14"))
    .attr("stroke", (d) => (d.hero ? "#a6f4ff" : "#b1adc9")).attr("stroke-width", 2).attr("stroke-dasharray", (d) => (d.partial ? "2 2" : null));
  g.append("text").attr("x", (d) => d.dx).attr("y", (d) => d.dy).attr("text-anchor", (d) => d.anchor || "start")
    .attr("class", (d) => (d.hero ? "val" : "lbl")).text((d) => `${d.name} · ${fmtCompact.format(d.n)}`);
  g.append("circle").attr("r", 14).attr("fill", "transparent")
    .on("pointermove", (ev, d) => showTip(ev.clientX, ev.clientY, `<div class="tt-k">${d.y}${d.partial ? " · partial" : ""}</div><div class="tt-v">${d.name}</div><div>${fmt.format(d.n)} neurons · ${d.note}</div>`))
    .on("pointerleave", hideTip);
  tableToggle(el, ["Connectome", "Year", "Neurons"], pts.map((p) => [`${p.name}${p.partial ? " (partial)" : ""}`, String(p.y), fmt.format(p.n)]));
}

// Busiest neurons by number of strong partners.
export function hubList(el, hubs, onPick) {
  el.innerHTML = "";
  el.classList.add("chart");
  el.append(h("div", { class: "chart-title" }, "Busiest neurons · partners with 5+ synapses"));
  const seen = new Set();
  const top = hubs.filter((x) => (seen.has(x.type) ? false : seen.add(x.type))).slice(0, 5);
  const max = d3.max(top, (d) => d.in + d.out);
  const list = h("div", { class: "legend" });
  for (const d of top) {
    const c = CLASSES[d.super]?.color || "#777";
    const row = h("button", { class: "legend-row", type: "button", style: `--c:${c}`, title: `Show ${d.type}` },
      h("span", { class: "sw" }), h("span", { class: "name" }, d.type),
      h("span", { class: "count" }, `${fmt.format(d.in + d.out)}`),
      h("span", { class: "share", style: `--w:${(100 * (d.in + d.out) / max).toFixed(1)}%` }, h("i")));
    row.addEventListener("click", () => onPick?.(d));
    list.append(row);
  }
  el.append(list);
}

// Layered diagram of how activity flowed in a simulation.
export function pathway(el, pw, width = 480) {
  el.innerHTML = "";
  if (!pw || !pw.layers?.length) return;
  const L = pw.layers.length;
  const maxN = d3.max(pw.layers, (l) => l.length);
  const nodeH = 20, gap = 8, top = 18, left = 4, right = 4;
  const Hh = top + maxN * (nodeH + gap) + 4;
  const colW = (width - left - right) / L;
  const nodeW = Math.min(120, colW - 18);
  const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${width} ${Hh}`);
  const pos = (li, ni) => {
    const n = pw.layers[li].length;
    const y0 = top + (maxN - n) * (nodeH + gap) / 2;
    return { x: left + li * colW, y: y0 + ni * (nodeH + gap) };
  };
  const maxSyn = d3.max(pw.links || [], (l) => l.synapses) || 1;
  svg.append("g").selectAll("path").data(pw.links || []).join("path")
    .attr("d", (l) => {
      const a = pos(l.from[0], l.from[1]), b = pos(l.to[0], l.to[1]);
      const x0 = a.x + nodeW, y0 = a.y + nodeH / 2, x1 = b.x, y1 = b.y + nodeH / 2, mx = (x0 + x1) / 2;
      return `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    })
    .attr("fill", "none").attr("stroke", "#a6f4ff").attr("stroke-opacity", 0.28)
    .attr("stroke-width", (l) => 0.8 + 4.5 * Math.log1p(l.synapses) / Math.log1p(maxSyn));
  pw.layers.forEach((layer, li) => {
    svg.append("text").attr("x", pos(li, 0).x).attr("y", 10).text(li === 0 ? "stimulus" : `step ${li}`).attr("fill", "#7a7695");
    layer.forEach((node, ni) => {
      const p = pos(li, ni);
      const c = CHART_CLASS_COLOR[chartClassOf(node.super_class)] || "#777";
      const g = svg.append("g").attr("transform", `translate(${p.x},${p.y})`);
      g.append("rect").attr("width", nodeW).attr("height", nodeH).attr("rx", 3).attr("fill", node.aka ? "#1b2a33" : "#0b0a14").attr("stroke", node.aka ? "#a6f4ff" : c).attr("stroke-width", node.aka ? 1.8 : 1.2);
      g.append("rect").attr("width", 3).attr("height", nodeH).attr("rx", 1.5).attr("fill", c);
      const name = node.aka ? node.aka.split(" (")[0] : node.type;
      const label = name.length > 15 ? name.slice(0, 14) + "…" : name;
      g.append("text").attr("x", 8).attr("y", 13.5).text(label).attr("fill", "#eceaf8");
      g.append("rect").attr("width", nodeW).attr("height", nodeH).attr("fill", "transparent")
        .on("pointermove", (ev) => showTip(ev.clientX, ev.clientY,
          `<div class="tt-k">${escapeHtml(CLASSES[node.super_class]?.label || node.super_class)}</div><div class="tt-v">${escapeHtml(node.type)}${node.aka ? ` · ${escapeHtml(node.aka)}` : ""}</div><div>${node.n} neuron${node.n === 1 ? "" : "s"}${node.rate ? ` · ${node.rate.toFixed(0)} Hz` : ""}</div>`))
        .on("pointerleave", hideTip);
    });
  });
}
