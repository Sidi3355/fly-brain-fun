// Renders public/og.png and the PNG/ICO icons. Run: node scripts/og/render.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const pub = path.resolve(__dirname, '../../public');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(__dirname, 'og.html'));
  await page.waitForSelector('body[data-ready="1"]');
  await page.screenshot({ path: path.join(pub, 'og.png') });

  const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8').replace(/@media \(prefers-color-scheme:dark\)\{[^}]*\}[^}]*\}[^}]*\}[^}]*\}\}/, '');
  for (const [size, name, pad] of [[180, 'apple-touch-icon.png', 18], [192, 'icon-192.png', 16], [512, 'icon-512.png', 44], [32, 'favicon-32.png', 0]]) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<body style="margin:0;background:#f3f0e8;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size - 2 * pad}" height="${size - 2 * pad}" `)}</body>`);
    await p.screenshot({ path: path.join(pub, name), omitBackground: false });
    await p.close();
  }
  await browser.close();
})();
