#!/usr/bin/env node
// Capture the same moment in two deployments and save them side by side.
//
//   node before-after.cjs http://localhost:8101 http://localhost:8102 OUT_DIR [shot-name,...]
//
// Each shot names a page, a device and a few steps (scroll to an element, scroll
// the page, click, wait). Output: OUT_DIR/<shot>.png with "Before" on the left.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , A, B, OUT = 'before-after', ONLY] = process.argv;
const phone = { ...devices['iPhone 13'], deviceScaleFactor: 2 };
const landscape = { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const laptopSmall = { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 };
const laptop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

// Scroll so that an element sits `offset` px below the top of the viewport.
const at = (sel, offset = 90) => ({ eval: [(a) => { const el = document.querySelector(a.sel); scrollTo(0, el.getBoundingClientRect().top + scrollY - a.offset); }, { sel, offset }] });
// Scroll the lifecycle story to stage n (0-5), in the reading phase.
const stage = n => ({ eval: [(n) => { const h = document.querySelector('.life-hero'); const head = document.querySelector('.site-header').getBoundingClientRect().height; const height = Math.max(innerHeight < 520 && innerWidth > innerHeight ? 280 : 430, innerHeight - head); const morph = Math.max(370, height * .78), step = Math.max(470, height * .86); const start = h.getBoundingClientRect().top + scrollY - head; scrollTo(0, start + morph + step * (n + .3)); }, n] });

const SHOTS = {
  'A1-pressure-heading-phone': { page: '/', dev: phone, steps: [at('#outcomes', 60)] },
  'A1-moments-intro-phone': { page: '/', dev: phone, steps: [at('.moment-heading', 80)] },
  'A3-value-stat-phone': { page: '/', dev: phone, steps: [at('#value-tab-insurance', 240)] },
  'A6-report-facts-phone': { page: '/outage-report/', dev: phone, steps: [at('.report-facts', 240)] },
  'B1-footer-phone': { page: '/', dev: phone, steps: [at('.footer-grid', 80)], outline: '.footer-group>a,.footer-bottom a,.footer-bottom button' },
  'B3-mobile-menu-phone': { page: '/', dev: phone, steps: [{ eval: [() => scrollTo(0, 2600)] }, { click: '.menu-button' }, { wait: 400 }] },
  'B4-value-tab-phone': { page: '/', dev: phone, steps: [at('#value-tab-insurance', 200), { click: '#value-tab-insurance' }, { wait: 900 }] },
  'B6-moment-tabs-phone': { page: '/', dev: phone, steps: [at('.moment-tabs', 260)] },
  'D1-lifecycle-1280x720': { page: '/', dev: laptopSmall, steps: [stage(0), { wait: 900 }] },
  'D1-lifecycle-1440x900': { page: '/', dev: laptop, steps: [stage(5), { wait: 900 }] },
  'D1-lifecycle-phone': { page: '/', dev: phone, steps: [stage(1), { wait: 900 }] },
  'D3-lifecycle-landscape': { page: '/', dev: landscape, steps: [stage(2), { wait: 900 }] },
  'U2-scene-phone-stage1': { page: '/', dev: phone, steps: [stage(0), { wait: 1200 }] },
  'U2-scene-phone-stage4': { page: '/', dev: phone, steps: [stage(3), { wait: 1200 }] },
  'U3-scene-1280x720-stage1': { page: '/', dev: laptopSmall, steps: [stage(0), { wait: 1200 }] },
  'U3-scene-1440x900-stage5': { page: '/', dev: laptop, steps: [stage(4), { wait: 1200 }] },
  'U9-pressure-trace-phone': { page: '/', dev: phone, steps: [at('#pressure-uptime', 80), { eval: [() => document.querySelector('[data-pressure-asset="cooling"]')?.click()] }, { wait: 300 }, { eval: [() => document.querySelector('[data-pressure-action="trace"]')?.click()] }, { wait: 1200 }, at('.pressure-network', 140)] },
  'U9-pressure-chart-phone': { page: '/', dev: phone, steps: [at('.pressure-demand-chart', 160)] },
};

async function capture(browser, base, shot) {
  const ctx = await browser.newContext({ ...shot.dev, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
  await p.goto(base + shot.page, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  for (const s of shot.steps) {
    if (s.eval) { await p.evaluate(...s.eval); await p.waitForTimeout(700); }
    if (s.click) await p.click(s.click);
    if (s.wait) await p.waitForTimeout(s.wait);
  }
  if (shot.outline) await p.addStyleTag({ content: `${shot.outline}{outline:1px solid #e5297a99!important;outline-offset:0!important}` });
  await p.waitForTimeout(300);
  const buf = await p.screenshot();
  await ctx.close();
  return buf;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const names = ONLY ? ONLY.split(',') : Object.keys(SHOTS);
  for (const name of names) {
    const shot = SHOTS[name];
    const [a, b] = [await capture(browser, A, shot), await capture(browser, B, shot)];
    const page = await browser.newPage();
    const png = await page.evaluate(async ({ a, b }) => {
      const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const pad = 24, label = 44, w = ia.width, h = ia.height;
      const c = document.createElement('canvas'); c.width = w * 2 + pad * 3; c.height = h + label + pad;
      const x = c.getContext('2d'); x.fillStyle = '#e9ece4'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#18372c'; x.font = '600 22px Helvetica, Arial, sans-serif';
      x.fillText('Before', pad, 30); x.fillText('After', w + pad * 2, 30);
      x.drawImage(ia, pad, label); x.drawImage(ib, w + pad * 2, label);
      return c.toDataURL('image/png').split(',')[1];
    }, { a: a.toString('base64'), b: b.toString('base64') });
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(png, 'base64'));
    await page.close();
    console.log('saved', name);
  }
  await browser.close();
})();
