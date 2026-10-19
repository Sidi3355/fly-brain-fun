#!/usr/bin/env node
// Measure whether a state change cuts or transitions. Records every painted frame
// (Chrome DevTools screencast) while a change happens, then finds how the visual
// change in a region is spread over time:
//   cut         - more than 70% of the change lands in a single frame
//   transition  - the change is spread across frames; reports its duration
//
//   node transitions.cjs http://localhost:8102 [OUT.json]
//
// Env: ONLY=name,name   SAVE=dir (write the frames of each case as a strip image)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , BASE, OUT] = process.argv;
const laptop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const phone = { ...devices['iPhone 13'], deviceScaleFactor: 1 };

// Scroll target for lifecycle stage n (same geometry the page uses).
const stageY = n => {
  const hero = document.querySelector('.life-hero');
  const head = document.querySelector('.site-header').getBoundingClientRect().height;
  const height = Math.max(innerHeight < 520 && innerWidth > innerHeight ? 280 : 430, innerHeight - head);
  const morph = Math.max(370, height * .78), step = Math.max(470, height * .86);
  return hero.getBoundingClientRect().top + scrollY - head + morph + step * n;
};

const CASES = {
  'stage-scroll-laptop': {
    dev: laptop, page: '/', region: '.life-hero-panel',
    setup: async p => { await p.evaluate(y => scrollTo(0, y), await p.evaluate(stageY, 0.55)); },
    act: async p => { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await p.evaluate(stageY, 1.15)); },
  },
  'stage-scroll-phone': {
    dev: phone, page: '/', region: '.life-hero-panel',
    setup: async p => { await p.evaluate(y => scrollTo(0, y), await p.evaluate(stageY, 0.55)); },
    act: async p => { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await p.evaluate(stageY, 1.15)); },
  },
  'stage-rail-click-laptop': {
    dev: laptop, page: '/', region: '.life-hero-panel',
    setup: async p => { await p.evaluate(y => scrollTo(0, y), await p.evaluate(stageY, 0.3)); },
    act: async p => { await p.click('#life-tab-incident'); },
  },
  'camera-rotate-laptop': {
    dev: laptop, page: '/', region: '.life-hero .life-world-anchor',
    setup: async p => { await p.evaluate(y => scrollTo(0, y), await p.evaluate(stageY, 0.3)); await p.click('[data-life-camera="pause"]').catch(() => {}); },
    act: async p => { await p.click('[data-life-camera="left"]'); },
  },
  'moment-tab-laptop': {
    dev: laptop, page: '/', region: '#moment-panel',
    setup: async p => { await p.evaluate(() => document.querySelector('.moment-tabs').scrollIntoView({ block: 'center' })); },
    act: async p => { await p.click('[data-moment="alarm"]'); },
  },
  'value-tab-laptop': {
    dev: laptop, page: '/', region: '.value-panels',
    setup: async p => { await p.evaluate(() => document.querySelector('.value-tabs').scrollIntoView({ block: 'start' })); },
    act: async p => { await p.click('#value-tab-scale'); },
  },
  'faq-open-laptop': {
    dev: laptop, page: '/answers/', region: '#answers-list, .answers-list, main',
    setup: async p => { await p.evaluate(() => scrollTo(0, document.querySelector('.answer-item').getBoundingClientRect().top + scrollY - 160)); },
    act: async p => { await p.click('.answer-item summary'); },
  },
  'platform-path-laptop': {
    dev: laptop, page: '/platform/', region: '.pp-demo-frame',
    setup: async p => { await p.evaluate(() => document.querySelector('.pp-demo-frame').scrollIntoView({ block: 'start' })); },
    act: async p => { await p.click('[data-pp-path="incident"]'); },
  },
  'platform-node-laptop': {
    dev: laptop, page: '/platform/', region: '.pp-demo-frame',
    setup: async p => { await p.evaluate(() => document.querySelector('.pp-demo-frame').scrollIntoView({ block: 'start' })); },
    act: async p => { await p.click('[data-pp-node="telemetry"]'); },
  },
  'review-tab-laptop': {
    dev: laptop, page: '/proof/example/', region: '#review-panel',
    setup: async p => { await p.evaluate(() => document.querySelector('#review-panel')?.scrollIntoView({ block: 'center' })); },
    act: async p => { await p.click('[data-review-tab="source"]'); },
  },
  'lifecycle-page-tab-laptop': {
    dev: laptop, page: '/lifecycle/', region: '#life-panel',
    setup: async p => { await p.evaluate(() => document.querySelector('#life-panel')?.scrollIntoView({ block: 'center' })); },
    act: async p => { await p.click('#life-tab-incident'); },
  },
};

async function run(browser, name, c) {
  const ctx = await browser.newContext({ ...c.dev, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
  await p.goto(BASE + c.page, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  await c.setup(p);
  await p.waitForTimeout(1400);
  const box = await p.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(r.width, innerWidth), h: Math.min(r.height, innerHeight - Math.max(0, r.top)) }; }, c.region);
  if (!box) { await ctx.close(); return { name, error: 'region not found' }; }
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => { frames.push({ t: f.metadata.timestamp * 1000, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  const vp = c.dev.viewport;
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: vp.width, maxHeight: vp.height });
  await p.waitForTimeout(400);
  const t0 = Date.now();
  await c.act(p);
  await p.waitForTimeout(1600);
  await cdp.send('Page.stopScreencast');
  await ctx.close();
  // Diff consecutive frames inside the region.
  const page2 = await browser.newPage();
  const series = await page2.evaluate(async ({ frames, box }) => {
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + src; });
    const c = document.createElement('canvas'); c.width = box.w; c.height = box.h; const x = c.getContext('2d', { willReadFrequently: true });
    let prev = null; const out = [];
    for (const f of frames) {
      const img = await load(f.data);
      x.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      const d = x.getImageData(0, 0, box.w, box.h).data;
      if (prev) { let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]) > 30) n++; out.push({ t: f.t, changed: n / (d.length / 4) }); }
      prev = d;
    }
    return out;
  }, { frames, box });
  if (process.env.SAVE) {
    fs.mkdirSync(process.env.SAVE, { recursive: true });
    const keep = frames.filter((f, i) => i === 0 || (series[i - 1] && series[i - 1].changed > 0.002)).slice(0, 10);
    const strip = await page2.evaluate(async ({ keep, box }) => {
      const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + src; });
      const s = Math.min(1, 360 / box.w), w = Math.round(box.w * s), h = Math.round(box.h * s);
      const c = document.createElement('canvas'); c.width = keep.length * (w + 8); c.height = h + 22; const x = c.getContext('2d');
      x.fillStyle = '#e9ece4'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#18372c'; x.font = '12px Arial';
      for (let i = 0; i < keep.length; i++) { const img = await load(keep[i].data); x.drawImage(img, box.x, box.y, box.w, box.h, i * (w + 8), 20, w, h); x.fillText(`${Math.round(keep[i].t - keep[0].t)} ms`, i * (w + 8) + 4, 14); }
      return c.toDataURL('image/png').split(',')[1];
    }, { keep, box });
    fs.writeFileSync(path.join(process.env.SAVE, `${name}.png`), Buffer.from(strip, 'base64'));
  }
  await page2.close();
  const moving = series.filter(s => s.changed > 0.004);
  const total = series.reduce((a, s) => a + s.changed, 0);
  const peak = Math.max(0, ...series.map(s => s.changed));
  const duration = moving.length ? Math.round(moving[moving.length - 1].t - moving[0].t) : 0;
  const verdict = !moving.length ? 'no visible change' : peak / total > 0.7 ? 'cut' : 'transition';
  return { name, verdict, frames: frames.length, changingFrames: moving.length, durationMs: duration, peakShare: +(peak / (total || 1)).toFixed(2) };
}

(async () => {
  const browser = await chromium.launch();
  const names = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(CASES);
  const results = [];
  for (const n of names) {
    try { const r = await run(browser, n, CASES[n]); results.push(r); console.log(n.padEnd(28), JSON.stringify(r)); }
    catch (e) { console.log(n.padEnd(28), 'ERROR', String(e).slice(0, 160)); results.push({ name: n, error: String(e) }); }
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  await browser.close();
})();
