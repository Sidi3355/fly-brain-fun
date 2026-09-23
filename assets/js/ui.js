// Small DOM helpers shared by the chapters, charts and explore tools.
export const $ = (sel, root = document) => root.querySelector(sel);

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const tip = () => document.getElementById("tooltip");

export function showTip(x, y, html) {
  const t = tip();
  t.innerHTML = html;
  t.hidden = false;
  const r = t.getBoundingClientRect();
  const nx = x + 14 + r.width > innerWidth ? x - r.width - 18 : x;
  const ny = y + 14 + r.height > innerHeight ? y - r.height - 18 : y;
  t.style.left = `${nx}px`;
  t.style.top = `${ny}px`;
}

export function hideTip() { tip().hidden = true; }

let toastTimer;
export function toast(msg, ms = 2600) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

export function animateNumber(el, to, { from = 0, dur = 1.6, format = (v) => Math.round(v).toLocaleString("en-US") } = {}) {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / (dur * 1000));
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Write text only when it changes, so per-frame counters don't churn layout.
export function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}
