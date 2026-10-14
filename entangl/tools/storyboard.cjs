#!/usr/bin/env node
// Capture what a reader sees while scrolling a page, as a contact sheet.
//
//   node storyboard.cjs http://localhost:8101 OUT_DIR
//
// Env: PAGES=/,/demo/  SCENARIOS=phone,laptop  COLS=4  STEP=0.85 (viewports per frame)
// Needs Pillow-free output: frames are composed in the browser on a canvas.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , BASE, OUT = 'story-out'] = process.argv;
const PAGES = (process.env.PAGES || '/').split(',');
const SCENARIOS = {
  'phone-small': { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  'phone-landscape': { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
  'tablet-portrait': { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
  'tablet-landscape': { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true },
  'laptop-small': { viewport: { width: 1280, height: 720 } },
  laptop: { viewport: { width: 1440, height: 900 } },
  desktop: { viewport: { width: 1920, height: 1080 } },
  wide: { viewport: { width: 2560, height: 1440 } },
};
const COLS = +(process.env.COLS || 4), STEP = +(process.env.STEP || 0.85), MAX = +(process.env.MAX || 40);

(async () => {
  const browser = await chromium.launch();
  for (const name of (process.env.SCENARIOS || 'phone,laptop').split(',')) {
    for (const page of PAGES) {
      const ctx = await browser.newContext({ ...SCENARIOS[name], deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
      await p.goto(BASE + page, { waitUntil: 'load' });
      await p.waitForTimeout(1500);
      const dir = path.join(OUT, name, page.replace(/\//g, '_') || '_');
      fs.mkdirSync(dir, { recursive: true });
      const vh = SCENARIOS[name].viewport.height;
      const frames = [];
      for (let i = 0; i < MAX; i++) {
        const buf = await p.screenshot();
        const f = path.join(dir, String(i).padStart(2, '0') + '.png');
        fs.writeFileSync(f, buf);
        frames.push(buf.toString('base64'));
        const before = await p.evaluate(() => scrollY);
        await p.mouse.wheel(0, Math.round(vh * STEP));
        await p.waitForTimeout(700);
        if ((await p.evaluate(() => scrollY)) === before) break;
      }
      // Compose contact sheets of COLS x 2 frames each, in the page itself.
      const per = COLS * 2;
      for (let s = 0; s * per < frames.length; s++) {
        const chunk = frames.slice(s * per, (s + 1) * per);
        const png = await p.evaluate(async ({ chunk, COLS }) => {
          const imgs = await Promise.all(chunk.map(b => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; })));
          const w = imgs[0].width, h = imgs[0].height, gap = 12, rows = Math.ceil(imgs.length / COLS);
          const c = document.createElement('canvas');
          c.width = COLS * w + (COLS - 1) * gap; c.height = rows * h + (rows - 1) * gap;
          const x = c.getContext('2d'); x.fillStyle = '#e5297a'; x.fillRect(0, 0, c.width, c.height);
          imgs.forEach((im, i) => x.drawImage(im, (i % COLS) * (w + gap), Math.floor(i / COLS) * (h + gap)));
          return c.toDataURL('image/png').split(',')[1];
        }, { chunk, COLS });
        fs.writeFileSync(path.join(dir, `sheet-${s}.png`), Buffer.from(png, 'base64'));
      }
      console.log(name, page, frames.length, 'frames');
      await ctx.close();
    }
  }
  await browser.close();
})();
