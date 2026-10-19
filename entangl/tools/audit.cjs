#!/usr/bin/env node
// Measure UX and functional issues on every page in several device scenarios.
//
//   node audit.cjs http://localhost:8101 OUT_DIR
//
// Env: PAGES=/,/platform/  SCENARIOS=phone,laptop  SHOTS=1 (save screenshots)
// Writes OUT_DIR/audit-<scenario>.json and prints a one-line summary per page.
// Form posts and Cloudflare's bot script are blocked so a run never sends anything.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , BASE, OUT = 'audit-out'] = process.argv;
const PAGES = (process.env.PAGES || [
  '/', '/platform/', '/platform/site-model/', '/platform/procedures/', '/platform/review/',
  '/platform/fieldwork/', '/platform/telemetry/', '/platform/maintenance/', '/platform/visibility/',
  '/platform/portfolio/', '/lifecycle/', '/lifecycle/design-and-handover/', '/lifecycle/vendors-and-rfps/',
  '/who-its-for/', '/proof/', '/proof/example/', '/answers/', '/enterprise/integrations/',
  '/enterprise/security/', '/enterprise/rollout/', '/pricing/', '/evaluate/', '/about/', '/demo/',
  '/outage-report/', '/outage-report/thank-you/', '/experience/', '/404',
].join(',')).split(',');

const touch = { isMobile: true, hasTouch: true };
const SCENARIOS = {
  'phone-small': { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, ...touch },
  phone: { ...devices['iPhone 13'] },
  'phone-landscape': { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, ...touch },
  'tablet-portrait': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, ...touch },
  'tablet-landscape': { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, ...touch },
  'laptop-small': { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  wide: { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 },
  // 200% browser zoom on a 1280px laptop lays out like a 640px viewport.
  'zoom-200': { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 },
};

// Runs in the page before any site script: collect layout shifts and long tasks.
const INSTRUMENT = () => {
  window.__ux = { shifts: [], longTasks: [] };
  const sel = n => {
    if (!n || n.nodeType !== 1) return n ? '#text' : '?';
    const id = n.id ? '#' + n.id : '';
    const cls = typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return n.tagName.toLowerCase() + id + cls;
  };
  try {
    new PerformanceObserver(l => l.getEntries().forEach(e => {
      if (e.hadRecentInput) return;
      window.__ux.shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), y: Math.round(scrollY), src: e.sources.map(s => sel(s.node)).slice(0, 3) });
    })).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__ux.longTasks.push(Math.round(e.duration))))
      .observe({ type: 'longtask', buffered: true });
  } catch {}
};

// Runs in the page after load: static measurements of the rendered layout.
const MEASURE = ({ touchDevice }) => {
  // Content waiting to reveal on scroll (v_improved) counts as visible: measure it settled.
  document.querySelectorAll('.ref-reveal').forEach(e => e.classList.remove('ref-reveal'));
  const vw = document.documentElement.clientWidth;
  const out = {};
  const visible = el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0;
  };
  const sel = n => {
    const id = n.id ? '#' + n.id : '';
    const cls = typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return n.tagName.toLowerCase() + id + cls;
  };
  const clipped = el => { // inside a scroller / clipper, so overflow is intended
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (/(hidden|auto|scroll|clip)/.test(o.overflowX)) return true;
    }
    return false;
  };

  // 1. Horizontal overflow
  out.pageScrollWidth = document.documentElement.scrollWidth;
  out.overflowX = document.documentElement.scrollWidth > vw + 1;
  out.overflowEls = [...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width && (r.right > vw + 1 || r.left < -1) && visible(el) && !clipped(el) && getComputedStyle(el).position !== 'fixed';
  }).slice(0, 8).map(el => `${sel(el)} [${Math.round(el.getBoundingClientRect().left)},${Math.round(el.getBoundingClientRect().right)}]`);

  // 2. Tap targets (WCAG 2.5.8 minimum 24px, platform guidance 44px)
  const interactive = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=tab],[role=button],[tabindex]:not([tabindex="-1"])')]
    .filter(el => visible(el) && !el.closest('[hidden],[inert],dialog:not([open])'));
  const inline = el => el.tagName === 'A' && getComputedStyle(el).display === 'inline' && /\S/.test((el.parentElement?.textContent || '').replace(el.textContent, ''));
  const small = interactive.filter(el => !inline(el)).map(el => ({ el, r: el.getBoundingClientRect() }));
  out.tapUnder24 = small.filter(({ r }) => r.width < 24 || r.height < 24).map(({ el, r }) => `${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  out.tapUnder44 = touchDevice ? small.filter(({ r }) => r.width < 44 || r.height < 44).length : null;
  out.tapUnder44Samples = touchDevice ? small.filter(({ r }) => r.width < 44 || r.height < 44).slice(0, 12).map(({ el, r }) => `${sel(el)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`) : null;
  out.interactiveCount = interactive.length;

  // 3. Text: size, contrast, line length
  const parseRGB = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const bgOf = el => {
    const stack = [];
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage)) return null; // gradient: unknown
      const c = parseRGB(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
    return bg;
  };
  const textEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim().length > 1 ? 1 : 2 });
  const seen = new Set();
  while (walker.nextNode()) { const el = walker.currentNode.parentElement; if (el && !seen.has(el) && visible(el) && !el.closest('svg,[aria-hidden=true],.sr-only,.life-sr-only,noscript')) { seen.add(el); textEls.push(el); } }
  out.textEls = textEls.length;
  out.tinyText = textEls.filter(el => parseFloat(getComputedStyle(el).fontSize) < 12).map(el => `${sel(el)} ${getComputedStyle(el).fontSize} "${el.textContent.trim().slice(0, 30)}"`);
  out.tinyTextCount = out.tinyText.length; out.tinyText = out.tinyText.slice(0, 15);
  const lowContrast = [];
  for (const el of textEls) {
    const cs = getComputedStyle(el), fg = parseRGB(cs.color), bg = bgOf(el);
    if (!fg || !bg) continue;
    const f = blend({ ...fg, a: fg.a * (+cs.opacity || 1) }, bg);
    const L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (large ? 3 : 4.5)) lowContrast.push(`${sel(el)} ${ratio.toFixed(2)} ${size}px "${el.textContent.trim().slice(0, 28)}"`);
  }
  out.lowContrastCount = lowContrast.length; out.lowContrast = lowContrast.slice(0, 15);
  out.longLines = [...document.querySelectorAll('p,li,dd,blockquote')].filter(visible).map(el => {
    const cs = getComputedStyle(el), w = el.getBoundingClientRect().width, cpl = w / (parseFloat(cs.fontSize) * .5);
    return { el, cpl };
  }).filter(x => x.cpl > 95 && x.el.textContent.length > 160).slice(0, 8).map(x => `${sel(x.el)} ~${Math.round(x.cpl)}cpl`);

  // 4. Headings that end on a single orphaned word
  out.orphanHeadings = [...document.querySelectorAll('h1,h2,h3,.lede,p.lead')].filter(visible).filter(h => {
    const words = []; const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const re = /\S+/g; let m; while ((m = re.exec(n.textContent))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rect = r.getClientRects()[0]; if (rect) words.push(Math.round(rect.top)); } }
    if (words.length < 4) return false;
    const lines = [...new Set(words)]; if (lines.length < 2) return false;
    return words.filter(t => t === words[words.length - 1]).length === 1;
  }).map(h => `${sel(h)} "${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);

  // 5. Forms
  out.formIssues = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(visible).flatMap(i => {
    const issues = [];
    const fs = parseFloat(getComputedStyle(i).fontSize);
    if (touchDevice && fs < 16) issues.push(`font ${fs}px (iOS zooms on focus)`);
    if (/name|email|company|phone|tel/.test(i.name) && !i.autocomplete) issues.push('no autocomplete');
    if (!(i.labels?.length || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'))) issues.push('no label');
    return issues.length ? [`${sel(i)}[name=${i.name}] ${issues.join(', ')}`] : [];
  });

  // 6. Images
  out.imgNoDims = [...document.images].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => i.src.split('/').pop());
  out.imgNoAlt = [...document.images].filter(i => !i.hasAttribute('alt')).map(i => i.src.split('/').pop());

  // 7. Sticky / fixed chrome: how much of the viewport it takes
  const header = document.querySelector('.site-header');
  out.headerHeight = header ? Math.round(header.getBoundingClientRect().height) : null;
  out.headerShare = header ? +(header.getBoundingClientRect().height / innerHeight).toFixed(2) : null;
  out.headerPosition = header ? getComputedStyle(header).position : null;

  // 8. Running infinite animations (should be none under reduced motion)
  out.infiniteAnimations = document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity && a.playState === 'running')
    .map(a => `${a.animationName || a.constructor.name} on ${a.effect?.target ? sel(a.effect.target) : '?'}`).slice(0, 10);
  out.pageHeight = document.documentElement.scrollHeight;
  return out;
};

async function scrollThrough(p) {
  // Scroll like a reader (wheel steps) and record dropped frames.
  await p.evaluate(() => {
    window.__frames = []; let last = performance.now();
    const tick = t => { window.__frames.push(t - last); last = t; if (!window.__stopFrames) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  const vh = await p.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += Math.round(vh * .6)) {
    await p.mouse.wheel(0, Math.round(vh * .6)).catch(() => p.evaluate(dy => scrollBy(0, dy), Math.round(vh * .6)));
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(400);
  return p.evaluate(() => {
    window.__stopFrames = true;
    const f = window.__frames.slice(2);
    return { frames: f.length, over50: f.filter(x => x > 50).length, over100: f.filter(x => x > 100).length, worst: Math.round(Math.max(0, ...f)) };
  });
}

async function focusAudit(p) {
  // Tab through the page; flag focus stops without a visible indicator.
  return p.evaluate(async () => {
    const bad = [];
    const els = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && !el.closest('[hidden],dialog:not([open]),[inert]'); }).slice(0, 80);
    for (const el of els) {
      el.focus({ focusVisible: true });
      if (document.activeElement !== el) continue;
      if (!el.matches(':focus-visible')) continue;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
      if (!ring) bad.push((el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ` "${(el.textContent || el.value || '').trim().slice(0, 20)}"`);
    }
    document.activeElement?.blur();
    return { checked: els.length, noVisibleFocus: bad.length, samples: [...new Set(bad)].slice(0, 10) };
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const only = process.env.SCENARIOS ? process.env.SCENARIOS.split(',') : Object.keys(SCENARIOS);
  for (const name of only) {
    const sc = SCENARIOS[name], rows = [];
    for (const page of PAGES) {
      const ctx = await browser.newContext({ ...sc });
      const p = await ctx.newPage();
      const errors = [], failed = [];
      await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
      await p.addInitScript(INSTRUMENT);
      p.on('pageerror', e => errors.push(String(e).slice(0, 200)));
      p.on('console', m => m.type() === 'error' && !/ERR_FAILED|challenge/.test(m.text()) && errors.push(m.text().slice(0, 200)));
      p.on('response', r => r.status() >= 400 && r.url().startsWith(BASE) && !(page === '/404' && r.url().endsWith('/404')) && failed.push(`${r.status()} ${r.url().slice(BASE.length)}`));
      try {
        await p.goto(BASE + page, { waitUntil: 'load', timeout: 45000 });
        await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(1500);
        const loadShifts = await p.evaluate(() => window.__ux.shifts.slice());
        const m = await p.evaluate(MEASURE, { touchDevice: !!sc.hasTouch });
        if (process.env.SHOTS) {
          fs.mkdirSync(path.join(OUT, 'shots', name), { recursive: true });
          await p.screenshot({ path: path.join(OUT, 'shots', name, (page.replace(/\//g, '_') || '_') + '.png'), fullPage: true });
        }
        const scroll = await scrollThrough(p);
        const allShifts = await p.evaluate(() => window.__ux.shifts.slice());
        const scrollShifts = allShifts.slice(loadShifts.length);
        const focus = sc.hasTouch ? null : await focusAudit(p);
        const longTasks = await p.evaluate(() => window.__ux.longTasks);
        const row = {
          page, ...m,
          clsLoad: +loadShifts.reduce((s, x) => s + x.v, 0).toFixed(4),
          clsScroll: +scrollShifts.reduce((s, x) => s + x.v, 0).toFixed(4),
          shiftSamples: allShifts.filter(x => x.v > 0.005).slice(0, 8),
          scroll, focus, longTasks: { count: longTasks.length, total: longTasks.reduce((a, b) => a + b, 0), max: Math.max(0, ...longTasks) },
          errors, failed,
        };
        rows.push(row);
        console.log(`${name.padEnd(16)} ${page.padEnd(30)} ovf:${row.overflowX ? 'YES' : 'no '} cls:${row.clsLoad}/${row.clsScroll} tap<24:${row.tapUnder24.length} tap<44:${row.tapUnder44 ?? '-'} tiny:${row.tinyTextCount} lowC:${row.lowContrastCount} orphan:${row.orphanHeadings.length} form:${row.formIssues.length} jank:${scroll.over50}/${scroll.frames} focus:${focus ? focus.noVisibleFocus : '-'} err:${errors.length} 404:${failed.length}`);
      } catch (e) {
        console.log(`${name.padEnd(16)} ${page.padEnd(30)} FAILED ${String(e).slice(0, 120)}`);
        rows.push({ page, failedRun: String(e) });
      }
      await ctx.close();
    }
    fs.writeFileSync(path.join(OUT, `audit-${name}.json`), JSON.stringify(rows, null, 1));
  }
  await browser.close();
})();
