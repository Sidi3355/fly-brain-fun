// Loading of the pipeline's packed binary columns (see pipeline/common.py write_columns).

const TYPES = {
  "|u1": Uint8Array, "|i1": Int8Array,
  "<u2": Uint16Array, "<i2": Int16Array,
  "<u4": Uint32Array, "<i4": Int32Array,
  "<f4": Float32Array, "<u8": BigUint64Array,
};

export const DATA = "data/";

// Some static hosts refuse raw binary files. The site can then be published with each
// .bin wrapped losslessly as an 8-bit greyscale PNG (tools/pack_png.py) and unwrapped here.
const PACKED = typeof window !== "undefined" && !!window.NEURONAUT_PACKED;

export async function fetchBuffer(url, onProgress) {
  if (PACKED && url.endsWith(".bin")) return unpackPng(await fetchRaw(url + ".png", onProgress));
  return fetchRaw(url, onProgress);
}

async function fetchRaw(url, onProgress) {
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

async function unpackPng(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let off = 8, width = 0, height = 0;
  const idat = [];
  while (off < u8.length) {
    const len = dv.getUint32(off);
    const type = String.fromCharCode(u8[off + 4], u8[off + 5], u8[off + 6], u8[off + 7]);
    if (type === "IHDR") { width = dv.getUint32(off + 8); height = dv.getUint32(off + 12); }
    else if (type === "IDAT") idat.push(u8.subarray(off + 8, off + 8 + len));
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const inflated = new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());
  // undo PNG row filters (greyscale, 1 byte per pixel)
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const f = inflated[y * (width + 1)], src = y * (width + 1) + 1, row = y * width, prev = row - width;
    for (let x = 0; x < width; x++) {
      const raw = inflated[src + x];
      const a = x ? out[row + x - 1] : 0, b = y ? out[prev + x] : 0, c = x && y ? out[prev + x - 1] : 0;
      let v;
      if (f === 0) v = raw;
      else if (f === 1) v = raw + a;
      else if (f === 2) v = raw + b;
      else if (f === 3) v = raw + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[row + x] = v & 255;
    }
  }
  const n = new DataView(out.buffer).getUint32(0, true);
  return out.buffer.slice(4, 4 + n);
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
