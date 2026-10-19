#!/usr/bin/env node
// Find visible elements that collide: text over text, icons over text, controls
// over labels, and text clipped by an overflow:hidden box. Each page is checked at
// a series of scroll positions (so sticky and pinned layers are seen as a reader
// sees them), and the homepage lifecycle story is checked at each of its six stages.
//
//   node overlaps.cjs http://localhost:8102 OUT_DIR
//
// Env: PAGES=/,/demo/  SCENARIOS=phone,laptop
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , BASE, OUT = 'overlaps-out'] = process.argv;
const PAGES = (process.env.PAGES || [
  '/', '/platform/', '/platform/site-model/', '/platform/procedures/', '/platform/review/',
  '/platform/fieldwork/', '/platform/telemetry/', '/platform/maintenance/', '/platform/visibility/',
  '/platform/portfolio/', '/lifecycle/', '/lifecycle/design-and-handover/', '/lifecycle/vendors-and-rfps/',
  '/who-its-for/', '/proof/', '/proof/example/', '/answers/', '/enterprise/integrations/',
  '/enterprise/security/', '/enterprise/rollout/', '/pricing/', '/evaluate/', '/about/', '/demo/',
  '/outage-report/', '/404',
].join(',')).split(',');
const SCENARIOS = {
  'phone-small': { viewport: { width: 320, height: 568 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  phone: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
  'phone-landscape': { viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  'laptop-small': { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
};

// In-page: collect atoms in the viewport and report colliding pairs.
const SCAN = () => {
  const vw = innerWidth, vh = innerHeight;
  const sel = n => {
    const id = n.id ? '#' + n.id : '';
    const cls = typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : (n.className?.baseVal ? '.' + n.className.baseVal.split(/\s+/)[0] : '');
    return n.tagName.toLowerCase() + id + cls;
  };
  const shown = el => {
    // Closed <details> content and content-visibility subtrees keep stale boxes; ask the browser.
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05 || e.hidden) return false;
      if (e.matches('.site-header,dialog:not([open]),[inert],.sr-only,.life-sr-only,noscript')) return false;
    }
    return true;
  };
  const clipCache = new Map();
  const clipBox = el => { // the visible box after every overflow-clipping ancestor
    if (clipCache.has(el)) return clipCache.get(el);
    let box = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const r = p.getBoundingClientRect();
        box = { l: Math.max(box.l, r.left), t: Math.max(box.t, r.top), r: Math.min(box.r, r.right), b: Math.min(box.b, r.bottom) };
      }
    }
    clipCache.set(el, box); return box;
  };
  const clipTo = (el, b) => {
    const c = clipBox(el), l = Math.max(b.left, c.l), t = Math.max(b.top, c.t), r = Math.min(b.right, c.r), bt = Math.min(b.bottom, c.b);
    return r - l >= 2 && bt - t >= 2 ? { x: l, y: t, w: r - l, h: bt - t } : null;
  };
  const atoms = [];
  // Text: one atom per text node, using the glyph boxes rather than the element box.
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? 1 : 2 });
  const seenParents = new Map();
  while (tw.nextNode()) {
    const n = tw.currentNode, el = n.parentElement;
    if (!el || el.closest('svg,script,style,noscript')) continue;
    if (!seenParents.has(el)) seenParents.set(el, shown(el));
    if (!seenParents.get(el)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) {
      if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > vh || b.right < 0 || b.left > vw) continue;
      const c = clipTo(el, b); if (!c) continue;
      atoms.push({ kind: 'text', el, ...c, label: n.textContent.trim().slice(0, 32) });
    }
  }
  // Icons and controls.
  for (const el of document.querySelectorAll('svg:not(svg svg), img, input:not([type=hidden]), select, textarea, .life-pin-point, [class*=dot], [class*=point]')) {
    if (el.closest('.site-header')) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 3 || b.height < 3 || b.width > vw * 0.6 || b.bottom < 0 || b.top > vh) continue;
    if (!shown(el)) continue;
    const c = clipTo(el.parentElement || el, b); if (!c) continue;
    atoms.push({ kind: el.tagName.toLowerCase() === 'svg' || el.tagName === 'IMG' ? 'icon' : 'control', el, ...c, label: (el.getAttribute('aria-label') || el.value || '').slice(0, 24) });
  }
  const related = (a, b) => a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el);
  const hits = [];
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    const a = atoms[i], b = atoms[j];
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox < 3 || oy < 3) continue;
    if (related(a, b) && !(a.kind !== b.kind)) continue;
    if (a.kind === 'text' && b.kind === 'text' && a.el === b.el) continue;
    // Only report a meaningful share of the smaller atom.
    const share = (ox * oy) / Math.min(a.w * a.h, b.w * b.h);
    if (share < 0.12) continue;
    hits.push({ a: `${a.kind}:${sel(a.el)}${a.label ? ` "${a.label}"` : ''}`, b: `${b.kind}:${sel(b.el)}${b.label ? ` "${b.label}"` : ''}`, share: +share.toFixed(2), at: [Math.round(Math.max(a.x, b.x)), Math.round(Math.max(a.y, b.y))] });
  }
  // Text cut by an overflow:hidden/clip ancestor.
  const clipped = [];
  for (const a of atoms.filter(t => t.kind === 'text')) {
    for (let p = a.el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (!/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) continue;
      const r = p.getBoundingClientRect();
      const vx = Math.min(a.x + a.w, r.right) - Math.max(a.x, r.left), vy = Math.min(a.y + a.h, r.bottom) - Math.max(a.y, r.top);
      const vis = Math.max(0, vx) * Math.max(0, vy) / (a.w * a.h);
      if (vis > 0.05 && vis < 0.9) clipped.push({ text: `${sel(a.el)} "${a.label}"`, by: sel(p), visible: +vis.toFixed(2) });
      break;
    }
  }
  return { hits, clipped };
};

const stageScroll = n => {
  const hero = document.querySelector('.life-hero'); if (!hero) return false;
  const head = document.querySelector('.site-header').getBoundingClientRect().height;
  const height = Math.max(innerHeight < 520 && innerWidth > innerHeight ? 280 : 430, innerHeight - head);
  const morph = Math.max(370, height * .78), step = Math.max(470, height * .86);
  const start = hero.getBoundingClientRect().top + scrollY - head;
  scrollTo(0, n < 0 ? 0 : start + morph + step * (n + .4));
  return true;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const names = (process.env.SCENARIOS || 'phone,laptop').split(',');
  const report = {};
  for (const name of names) {
    for (const page of PAGES) {
      const ctx = await browser.newContext({ ...SCENARIOS[name], reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
      await p.goto(BASE + page, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(900);
      const found = new Map(), cut = new Map();
      const take = async where => {
        const { hits, clipped } = await p.evaluate(SCAN);
        for (const h of hits) { const k = [h.a, h.b].sort().join(' × '); if (!found.has(k)) found.set(k, { ...h, where }); }
        for (const c of clipped) { const k = c.text + c.by; if (!cut.has(k)) cut.set(k, { ...c, where }); }
      };
      if (page === '/') {
        for (let s = -1; s < 6; s++) { await p.evaluate(stageScroll, s); await p.waitForTimeout(700); await take(s < 0 ? 'hero' : `stage ${s + 1}`); }
      }
      const total = await p.evaluate(() => document.documentElement.scrollHeight), vh = SCENARIOS[name].viewport.height;
      const startY = page === '/' ? await p.evaluate(() => { const h = document.querySelector('.life-hero'); return h.getBoundingClientRect().bottom + scrollY; }) : 0;
      for (let y = startY; y < total; y += Math.round(vh * 0.7)) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); await take(`y=${y}`); }
      report[`${name} ${page}`] = { overlaps: [...found.values()], clipped: [...cut.values()] };
      console.log(`${name.padEnd(15)} ${page.padEnd(32)} overlaps:${found.size} clipped:${cut.size}`);
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(OUT, 'overlaps.json'), JSON.stringify(report, null, 1));
  await browser.close();
})();
