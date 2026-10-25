// Build the issued set: render every page module in src/pages into site/, copy the assets,
// and write the deployment files. No dependencies; run with `node build.mjs`.
import { readdir, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { layout } from './src/layout.mjs';
import { SHEETS } from './src/sheets.mjs';
import { ICONS } from './src/kit.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'site');

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });

// One sprite of the line symbols, for markup drawn in the browser.
await writeFile(path.join(OUT, 'assets/img/icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><defs><style>symbol{overflow:visible}</style></defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')}</svg>`);

const files = (await readdir(path.join(SRC, 'pages'))).filter(f => f.endsWith('.mjs')).sort();
const built = new Set();
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(SRC, 'pages', f)).href);
  for (const page of [].concat(mod.default)) {
    const html = layout(page);
    const file = page.route === '/404' ? '404.html' : path.join(page.route, 'index.html');
    await mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
    await writeFile(path.join(OUT, file), html);
    built.add(page.route);
  }
}

const missing = SHEETS.filter(s => !built.has(s.route)).map(s => s.route);
if (missing.length) console.warn('Sheets without a page yet:', missing.join(', '));

// A preview deployment: keep it out of search indexes so it never competes with entangl.com.
await writeFile(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
await writeFile(path.join(OUT, 'vercel.json'), JSON.stringify({
  cleanUrls: true,
  trailingSlash: true,
  headers: [
    { source: '/assets/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Robots-Tag', value: 'noindex' },
    ] },
  ],
}, null, 2) + '\n');
console.log(`Built ${built.size} sheets into ${path.relative(process.cwd(), OUT) || '.'}`);
