#!/usr/bin/env node
// Compare two deployments of the site page by page: rendered text, failed
// requests, console errors and a full-page pixel diff at several viewports.
//
//   node compare.cjs https://entangl.com http://localhost:8101 OUT_DIR
//
// Needs `playwright` (npm i -D playwright). Form posts and Cloudflare's bot
// script are blocked so a run never sends anything.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , A, B, OUT = 'compare-out'] = process.argv;
const PAGES = (process.env.PAGES || [
  '/', '/platform/', '/platform/site-model/', '/platform/procedures/', '/platform/review/',
  '/platform/fieldwork/', '/platform/telemetry/', '/platform/maintenance/', '/platform/visibility/',
  '/platform/portfolio/', '/lifecycle/', '/lifecycle/design-and-handover/', '/lifecycle/vendors-and-rfps/',
  '/who-its-for/', '/proof/', '/proof/example/', '/answers/', '/enterprise/integrations/',
  '/enterprise/security/', '/enterprise/rollout/', '/pricing/', '/evaluate/', '/about/', '/demo/',
  '/outage-report/', '/outage-report/thank-you/', '/outage-report/email-preview/', '/experience/', '/404',
].join(',')).split(',');
const VIEWPORTS = {
  phone: { ...devices['iPhone 13'] },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

async function capture(browser, base, page, vp) {
  const ctx = await browser.newContext({ ...VIEWPORTS[vp], reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const failed = [], errors = [];
  await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
  p.on('console', m => m.type() === 'error' && !/challenge-platform|ERR_FAILED/.test(m.text()) && errors.push(m.text()));
  p.on('pageerror', e => errors.push(String(e)));
  p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failed.push(`${r.status()} ${r.url().slice(base.length)}`); });
  p.on('requestfailed', r => { if (r.url().startsWith(base) && !/challenge-platform/.test(r.url())) failed.push(`ERR ${r.url().slice(base.length)}`); });
  for (let attempt = 0; ; attempt++) {
    try { await p.goto(base + page, { waitUntil: 'load', timeout: 45000 }); break; }
    catch (e) { if (attempt === 2) throw e; }
  }
  await p.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const text = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  const shot = await p.screenshot({ fullPage: true, animations: 'disabled' });
  await ctx.close();
  return { text, shot, failed: failed.filter(f => !/^404 \/404$/.test(f) || page !== '/404'), errors };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = [];
  const only = process.env.VIEWPORTS ? process.env.VIEWPORTS.split(',') : Object.keys(VIEWPORTS);
  for (const vp of only) {
    for (const page of PAGES) {
      const [a, b] = [await capture(browser, A, page, vp), await capture(browser, B, page, vp)];
      const slug = `${vp}${page.replace(/\//g, '_') || '_'}`;
      fs.writeFileSync(path.join(OUT, `${slug}.a.png`), a.shot);
      fs.writeFileSync(path.join(OUT, `${slug}.b.png`), b.shot);
      const row = { vp, page, sameText: a.text === b.text, failedA: a.failed, failedB: b.failed, errorsA: a.errors, errorsB: b.errors, slug };
      if (!row.sameText) {
        let i = 0; while (a.text[i] === b.text[i]) i++;
        row.textDiff = { a: a.text.slice(Math.max(0, i - 60), i + 80), b: b.text.slice(Math.max(0, i - 60), i + 80) };
      }
      report.push(row);
      console.log(`${vp.padEnd(7)} ${page.padEnd(32)} text:${row.sameText ? 'same' : 'DIFF'} failed:${a.failed.length}/${b.failed.length} errors:${a.errors.length}/${b.errors.length}`);
    }
  }
  fs.writeFileSync(path.join(OUT, `report-${only.join('-')}.json`), JSON.stringify(report, null, 1));
  await browser.close();
})();
