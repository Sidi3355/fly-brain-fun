// The sheet: frame, title block (which carries the navigation), field and sheet foot.
import { readFileSync } from 'node:fs';
import { SHEETS, GROUPS, ISSUE, STATUS, sheetFor } from './sheets.mjs';
import { esc, icon, chip, sheetRef } from './kit.mjs';

const wordmark = readFileSync(new URL('./assets/img/entangl-wordmark.svg', import.meta.url), 'utf8')
  .replace(/<svg /, '<svg class="wordmark" role="img" aria-label="Entangl" ')
  .replace(/fill="#003939"/g, 'fill="currentColor"');

const zones = (n, kind) => Array.from({ length: n }, (_, i) => `<span>${kind === 'num' ? i + 1 : String.fromCharCode(65 + i)}</span>`).join('');

function sheetIndex(current) {
  return GROUPS.map(g => {
    const list = SHEETS.filter(s => s.group === g.id && !s.hidden);
    const open = list.some(s => s.route === current.route) || (current.hidden && g.id === 'general');
    return `<details class="ix-group"${open ? ' open' : ''}><summary><span>${esc(g.title)}</span><small>${list.length}</small>${icon('pm', 'i ix-mark')}</summary><ol>${list.map(s => `<li><a href="${s.route}"${s.route === current.route ? ' aria-current="page"' : ''}><span class="ix-num">${s.num}</span><span class="ix-title">${esc(s.title)}</span>${s.status ? chip(s.status) : ''}</a></li>`).join('')}</ol></details>`;
  }).join('');
}

function titleBlock(sheet) {
  const st = sheet.status ? STATUS[sheet.status] : null;
  return `<header class="tb" id="sheet-index" aria-label="Title block and sheet index">
  <div class="tb-head">
    <a class="tb-brand" href="/">${wordmark}</a>
    <button class="tb-close" type="button" data-index-close aria-label="Close the sheet index">${icon('close')}</button>
  </div>
  <p class="tb-project">AI for data center engineering and operations</p>
  <nav class="tb-index" aria-label="Sheet index">
    <p class="tb-label">Sheet index</p>
    ${sheetIndex(sheet)}
    <a class="tb-report" href="/outage-report/"><span>New research</span>How data center outages escalate ${icon('arrow')}</a>
  </nav>
  <div class="tb-actions">
    <a class="btn btn-lime btn-block" href="/demo/"><span>Book a site demo</span>${icon('arrow')}</a>
    <button class="tb-signin" type="button" data-signin>Sign in</button>
  </div>
  <dl class="tb-data">
    <div class="tb-cell tb-sheet"><dt>Sheet</dt><dd>${esc(sheet.num)}</dd></div>
    <div class="tb-cell tb-rev"><dt>Rev</dt><dd>${ISSUE.rev}</dd></div>
    <div class="tb-cell tb-wide"><dt>Title</dt><dd>${esc(sheet.title)}</dd></div>
    <div class="tb-cell tb-wide"><dt>Status</dt><dd>${st ? `<span class="status-line status-${sheet.status}"><i aria-hidden="true"></i>${esc(st.label)}</span>` : esc(ISSUE.status)}</dd></div>
    <div class="tb-cell"><dt>Drawn</dt><dd>Entangl</dd></div>
    <div class="tb-cell"><dt>Date</dt><dd>${ISSUE.date}</dd></div>
    <div class="tb-cell tb-wide tb-approved"><dt>Approved for work</dt><dd>By your authorized people. Not by this website.</dd></div>
  </dl>
</header>`;
}

function sheetFoot(page, sheet) {
  const notes = page.notes || [];
  const notesHTML = notes.length ? `<section class="notes" aria-labelledby="notes-title"><h2 class="notes-title" id="notes-title"><span>General notes</span><small>${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · ${esc(sheet.num)}</small></h2><ol class="notes-list">${notes.map((n, i) => `<li id="n-${n.id}" data-note-id="${n.id}"><span class="note-num">${i + 1}</span><div class="note-body"><p>${n.text}</p>${n.href ? `<a class="tlink" href="${esc(n.href)}"${/^https?:/.test(n.href) ? ' target="_blank" rel="noopener noreferrer"' : ''}><span>${esc(n.link || 'Read the source')}</span>${icon(/^https?:/.test(n.href) ? 'diagonal' : 'arrow')}</a>` : ''}</div></li>`).join('')}</ol></section>` : '';
  const related = (page.related || []).map(r => sheetFor(r)).filter(Boolean);
  const relatedHTML = related.length ? `<nav class="refs" aria-labelledby="refs-title"><h2 class="refs-title" id="refs-title">${esc(page.relatedTitle || 'Referenced sheets')}</h2><div class="refs-list">${related.map(s => sheetRef(s)).join('')}</div></nav>` : '';
  return `${notesHTML}${relatedHTML}
<footer class="foot">
  <div class="foot-rev">
    <table class="revtable"><caption>Revisions</caption><thead><tr><th scope="col">Rev</th><th scope="col">Description</th><th scope="col">Date</th></tr></thead>
    <tbody><tr><td>C</td><td>Issued for review. This set.</td><td>${ISSUE.date}</td></tr><tr><td>B</td><td>Refinements to the live site</td><td>Superseded</td></tr><tr><td>A</td><td>First issue, entangl.com</td><td>Superseded</td></tr></tbody></table>
  </div>
  <div class="foot-meta">
    <a class="foot-brand" href="/" aria-label="Entangl, back to the cover sheet">${wordmark}</a>
    <p>AI for data center engineering and operations.<br>San Francisco, CA. Built for the people behind uptime.</p>
    <p class="foot-legal">© 2026 Entangl, Inc.</p>
  </div>
  <ul class="foot-links">
    <li><a href="/demo/">Contact</a></li>
    <li><button type="button" data-signin>Sign in</button></li>
    <li><button type="button" data-motion aria-pressed="false">Reduce motion</button></li>
    <li><a href="#top">Back to top ${icon('up')}</a></li>
  </ul>
</footer>`;
}

const signInDialog = `<dialog class="dlg" id="signin" aria-labelledby="signin-title">
  <form method="dialog" class="dlg-close-form"><button class="dlg-close" aria-label="Close">${icon('close')}</button></form>
  <p class="detail-kicker">Your organization’s workspace</p>
  <h2 id="signin-title">Sign in to your site.</h2>
  <p>Open the Entangl workspace address from your organization’s invitation. Your site team can help you find the correct workspace.</p>
  <p class="dlg-help">Need help with access? <a class="tlink" href="mailto:info@entangl.com?subject=Help%20finding%20my%20Entangl%20workspace"><span>Contact Entangl</span>${icon('arrow')}</a></p>
</dialog>`;

export function layout(page) {
  const sheet = sheetFor(page.route);
  if (!sheet) throw new Error('No sheet registered for ' + page.route);
  const scripts = ['site', ...(page.scripts || [])];
  const body = typeof page.body === 'function' ? page.body(page.ctx) : page.body;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#003939">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/plexmono-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/sheet.css">
<script>try{if(localStorage.getItem('entangl-motion')==='off')document.documentElement.classList.add('reduce-motion')}catch(e){}document.documentElement.classList.add('js')</script>
</head>
<body id="top" data-sheet="${esc(sheet.num)}"${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<div class="frame" aria-hidden="true"><div class="frame-top">${zones(12, 'num')}</div><div class="frame-side">${zones(8, 'alpha')}</div></div>
<div class="topbar">
  <a class="topbar-brand" href="/">${wordmark}</a>
  <p class="topbar-sheet"><span>${esc(sheet.num)}</span> <span class="topbar-title">${esc(sheet.title)}</span></p>
  <button class="topbar-index" type="button" data-index-open aria-controls="sheet-index" aria-expanded="false">${icon('menu')}<span>Index</span></button>
</div>
${titleBlock(sheet)}
<main class="field" id="main" tabindex="-1">
${body}
${sheetFoot(page, sheet)}
</main>
${signInDialog}
<p class="sr-only" id="live" role="status" aria-live="polite" aria-atomic="true"></p>
${scripts.map(s => `<script src="/assets/js/${s}.js" defer></script>`).join('\n')}
</body>
</html>
`;
}
