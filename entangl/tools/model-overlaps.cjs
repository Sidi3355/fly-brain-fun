#!/usr/bin/env node
// Collisions inside the homepage's 3D lifecycle scene, where the DOM scan can't see:
// labels drawn on the effects canvas vs. the clickable asset pins, the camera
// controls, the scene legend and the drag hint; plus how much of the drawn model
// sits underneath the controls and legend. Checked in the hero and at all six stages.
//
//   node model-overlaps.cjs http://localhost:8102 [OUT.json]
//
// Env: SCENARIOS=phone,laptop
const { chromium, devices } = require('playwright');
const fs = require('fs');

const [, , BASE, OUT] = process.argv;
const SCENARIOS = {
  phone: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
  'phone-landscape': { viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  'laptop-small': { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
};

// Record the label boxes the effects canvas draws in its latest frame.
const RECORD = () => {
  const P = CanvasRenderingContext2D.prototype;
  const clear = P.clearRect, rr = P.roundRect, rect = P.rect;
  const fxFrame = c => c.classList && c.classList.contains('life-effects');
  P.clearRect = function (...a) { if (fxFrame(this.canvas)) window.__labels = []; return clear.apply(this, a); };
  P.roundRect = function (x, y, w, h, ...r) { if (fxFrame(this.canvas)) (window.__labels ||= []).push({ x, y, w, h }); return rr.call(this, x, y, w, h, ...r); };
  P.rect = function (x, y, w, h) { if (fxFrame(this.canvas)) (window.__labels ||= []).push({ x, y, w, h }); return rect.call(this, x, y, w, h); };
};

const COLLECT = () => {
  const fx = document.querySelector('.life-hero .life-effects');
  if (!fx) return null;
  const c = fx.getBoundingClientRect();
  const box = (el, name) => { const r = el.getBoundingClientRect(); return { name, x: r.left, y: r.top, w: r.width, h: r.height }; };
  const visible = el => el && !el.hidden && el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true }) && el.getBoundingClientRect().width > 0;
  const items = [];
  for (const l of window.__labels || []) items.push({ name: 'canvas-label', x: c.left + l.x, y: c.top + l.y, w: l.w, h: l.h });
  // A pin is what a person sees: its label box, its dot and, when the label sits above or below
  // the dot, the hairline between them.
  document.querySelectorAll('.life-hero .life-pin').forEach(p => {
    if (!visible(p)) return;
    const t = p.textContent.trim(), label = box(p.lastElementChild, `pin "${t}"`); items.push(label);
    const dot = p.querySelector('.life-pin-point'); if (!dot) return;
    const d = box(dot, `dot "${t}"`); items.push(d);
    if (!p.matches('.pin-up, .pin-down')) return;
    const [y0, y1] = label.y > d.y ? [d.y + d.h, label.y] : [label.y + label.h, d.y];
    if (y1 > y0) items.push({ name: `hairline "${t}"`, x: d.x + d.w / 2 - 1, y: y0, w: 2, h: y1 - y0 });
  });
  const ctl = document.querySelector('.life-hero .life-view-controls'); if (visible(ctl)) items.push(box(ctl, 'controls'));
  document.querySelectorAll('.life-hero .life-scene-facts > span').forEach(s => { if (visible(s)) items.push(box(s, `legend "${s.textContent.trim()}"`)); });
  const hint = document.querySelector('.life-hero .life-model-hint'); if (visible(hint)) items.push(box(hint, 'drag-hint'));
  document.querySelectorAll('.life-hero .life-layers button, .life-hero [data-life-layer]').forEach(b => { if (visible(b)) items.push(box(b, `layer "${b.textContent.trim()}"`)); });
  const panel = document.querySelector('.life-hero .life-hero-panel'); if (visible(panel) && getComputedStyle(panel).visibility !== 'hidden') items.push(box(panel, 'reading-panel'));
  const hits = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.name.startsWith('layer') && b.name.startsWith('layer')) continue;
    if (a.name.startsWith('legend') && b.name.startsWith('legend')) continue;
    if (a.name.slice(a.name.indexOf('"')) === b.name.slice(b.name.indexOf('"')) && /^(pin|dot|hairline)/.test(a.name) && /^(pin|dot|hairline)/.test(b.name)) continue; // one pin's own parts
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const thin = /^hairline/.test(a.name) || /^hairline/.test(b.name);   // a 2px line counts as soon as it crosses
    if (ox > (thin ? 0 : 2) && oy > 2) hits.push(`${a.name} × ${b.name} (${Math.round(ox)}×${Math.round(oy)}px)`);
  }
  const under = ['controls', 'legend', 'drag-hint'].flatMap(n => items.filter(i => i.name.startsWith(n)).map(i => ({ name: i.name, x: i.x, y: i.y, w: i.w, h: i.h })));
  return { hits, under, labels: (window.__labels || []).length };
};

// Share of an area that is drawn model (light pixels) rather than the dark backdrop.
async function modelUnder(p, boxes) {
  if (!boxes.length) return [];
  await p.addStyleTag({ content: '.life-hero .life-view-controls,.life-hero .life-scene-facts,.life-hero .life-model-hint{visibility:hidden!important}' });
  await p.waitForTimeout(250);
  const out = [];
  for (const b of boxes) {
    if (b.w < 4 || b.h < 4) continue;
    const buf = await p.screenshot({ clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: b.w, height: b.h } });
    const share = await p.evaluate(async src => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let lit = 0;
      for (let i = 0; i < d.length; i += 4) if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 95) lit++;
      return lit / (d.length / 4);
    }, buf.toString('base64'));
    out.push(`${b.name}: ${Math.round(share * 100)}% over the drawing`);
  }
  await p.addStyleTag({ content: '.life-hero .life-view-controls,.life-hero .life-scene-facts,.life-hero .life-model-hint{visibility:visible!important}' });
  return out;
}

const stageScroll = n => {
  const hero = document.querySelector('.life-hero');
  const head = document.querySelector('.site-header').getBoundingClientRect().height;
  const height = Math.max(innerHeight < 520 && innerWidth > innerHeight ? 280 : 430, innerHeight - head);
  const morph = Math.max(370, height * .78), step = Math.max(470, height * .86);
  const start = hero.getBoundingClientRect().top + scrollY - head;
  scrollTo(0, n < 0 ? 0 : start + morph + step * (n + .4));
};

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const name of (process.env.SCENARIOS || Object.keys(SCENARIOS).join(',')).split(',')) {
    const ctx = await browser.newContext({ ...SCENARIOS[name], reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
    await p.addInitScript(RECORD);
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    for (let s = -1; s < 6; s++) {
      await p.evaluate(stageScroll, s);
      await p.waitForTimeout(1300);
      const r = await p.evaluate(COLLECT);
      const under = await modelUnder(p, r.under);
      const key = `${name} ${s < 0 ? 'hero' : 'stage ' + (s + 1)}`;
      report[key] = { collisions: r.hits, coverage: under };
      console.log(key.padEnd(24), `collisions:${r.hits.length}`, r.hits.slice(0, 4).join(' | '), under.length ? '|| ' + under.join(', ') : '');
    }
    await ctx.close();
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  await browser.close();
})();
