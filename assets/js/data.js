// Loading of the pipeline's packed binary columns (see pipeline/common.py write_columns).

const TYPES = {
  "|u1": Uint8Array, "|i1": Int8Array,
  "<u2": Uint16Array, "<i2": Int16Array,
  "<u4": Uint32Array, "<i4": Int32Array,
  "<f4": Float32Array, "<u8": BigUint64Array,
};

export const DATA = "data/";

export async function fetchBuffer(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !onProgress || !total) {
    const buf = await res.arrayBuffer();
    onProgress?.(1);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  onProgress(1);
  return out.buffer;
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

export function readColumns(buf) {
  const dv = new DataView(buf);
  const hl = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
  const base = 4 + hl;
  const out = {};
  for (const [key, e] of Object.entries(header)) {
    const T = TYPES[e.dtype];
    if (!T) throw new Error(`Unsupported dtype ${e.dtype} for ${key}`);
    const n = e.shape.reduce((a, b) => a * b, 1);
    const arr = new T(buf, base + e.offset, n);
    arr.shape = e.shape;
    out[key] = arr;
  }
  return out;
}

export async function loadColumns(url, onProgress) {
  return readColumns(await fetchBuffer(url, onProgress));
}

// Convert int16 site coordinates (QUANT units per micrometre) to float micrometres.
export function dequantize(int16, quant = 20) {
  const out = new Float32Array(int16.length);
  const s = 1 / quant;
  for (let i = 0; i < int16.length; i++) out[i] = int16[i] * s;
  return out;
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

export const fmt = new Intl.NumberFormat("en-US");
export const fmtCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
