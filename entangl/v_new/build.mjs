// Build the redesigned site: the original pages with their content untouched, a new design
// layered on top, and the contact forms disconnected. No dependencies; run `node build.mjs`.
//
//   ../v_improved   the original site (same words, pages and interactions, with bug fixes)
//   src/            the redesign: one stylesheet, the typeface and two disconnected form scripts
//   site/           the output, deployed as-is
import { readdir, readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ORIGINAL = path.join(ROOT, '..', 'v_improved');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'site');

await rm(OUT, { recursive: true, force: true });
await cp(ORIGINAL, OUT, { recursive: true });

// The redesign layer and its typeface.
await cp(path.join(SRC, 'redesign.css'), path.join(OUT, 'assets/redesign.css'));
await mkdir(path.join(OUT, 'assets/fonts'), { recursive: true });
for (const f of await readdir(path.join(SRC, 'fonts'))) await cp(path.join(SRC, 'fonts', f), path.join(OUT, 'assets/fonts', f));

// Forms stay disconnected from FormSubmit: nothing is posted anywhere.
await cp(path.join(SRC, 'contact-form.js'), path.join(OUT, 'assets/contact-form.js'));
await cp(path.join(SRC, 'outage-report.js'), path.join(OUT, 'assets/outage-report.js'));

async function* htmlFiles(dir) {
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    if ((await stat(p)).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith('.html')) yield p;
  }
}

const HEAD = '<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/redesign.css">';
let pages = 0;
for await (const file of htmlFiles(OUT)) {
  let html = await readFile(file, 'utf8');
  const isEmail = file.includes(`${path.sep}email-preview${path.sep}`);
  // A preview deployment stays out of search indexes.
  if (!/<meta name="robots"/.test(html)) html = html.replace(/<meta charset="utf-8">/i, m => `${m}<meta name="robots" content="noindex">`);
  // The email preview is an email template with its own inline styles; it keeps them.
  if (!isEmail) html = html.replace('</head>', `${HEAD}</head>`);
  // No form may post off-site, with or without JavaScript.
  html = html.replace(/ action="https:\/\/formsubmit\.co\/[^"]*"/g, ' action="javascript:void(0)"');
  if (/formsubmit\.co/i.test(html)) throw new Error('FormSubmit reference left in ' + path.relative(OUT, file));
  await writeFile(file, html);
  pages++;
}

for (const f of ['assets/contact-form.js', 'assets/outage-report.js']) {
  if (/formsubmit\.co/i.test(await readFile(path.join(OUT, f), 'utf8'))) throw new Error('FormSubmit reference left in ' + f);
}

await writeFile(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const vercel = JSON.parse(await readFile(path.join(ORIGINAL, 'vercel.json'), 'utf8'));
vercel.headers.push({ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] });
vercel.headers.push({ source: '/assets/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] });
await writeFile(path.join(OUT, 'vercel.json'), JSON.stringify(vercel, null, 2) + '\n');

console.log(`Built ${pages} pages into ${path.relative(process.cwd(), OUT) || '.'}`);
