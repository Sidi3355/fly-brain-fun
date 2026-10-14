#!/usr/bin/env node
// Scripted interaction checks: menus, dialog, tab switches, anchor jumps.
// Each check prints a measured result so before/after runs can be compared.
//
//   node interactions.cjs http://localhost:8101 [OUT.json]
const { chromium, devices } = require('playwright');
const fs = require('fs');

const [, , BASE, OUT] = process.argv;
const PHONE = { ...devices['iPhone 13'] };
const LAPTOP = { viewport: { width: 1440, height: 900 } };
const results = {};
const log = (k, v) => { results[k] = v; console.log(k.padEnd(44), JSON.stringify(v)); };

async function open(browser, ctxOpts, page = '/') {
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  await p.route(/formsubmit\.co|cdn-cgi\/challenge-platform/, r => r.abort());
  await p.goto(BASE + page, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  return { ctx, p };
}
const headerBottom = p => p.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().bottom);

(async () => {
  const browser = await chromium.launch();

  // 1. Mobile menu: transition, scroll lock, scroll chaining, focus, height.
  {
    const { ctx, p } = await open(browser, PHONE);
    await p.evaluate(() => scrollTo(0, 1500));
    await p.waitForTimeout(300);
    await p.tap('.menu-button');
    await p.waitForTimeout(50);
    const early = await p.evaluate(() => { const n = document.getElementById('main-nav'); return { opacity: getComputedStyle(n).opacity, transition: getComputedStyle(n).transitionDuration }; });
    await p.waitForTimeout(400);
    const st = await p.evaluate(() => {
      const n = document.getElementById('main-nav'), r = n.getBoundingClientRect();
      return { top: Math.round(r.top), height: Math.round(r.height), vh: innerHeight, scrollable: n.scrollHeight > n.clientHeight, bodyOverflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow, overscroll: getComputedStyle(n).overscrollBehaviorY, focusInMenu: n.contains(document.activeElement) };
    });
    const y0 = await p.evaluate(() => scrollY);
    // Wheel over the open menu, well past its end: does the page behind move?
    await p.mouse.move(200, 400);
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 600); await p.waitForTimeout(80); }
    const y1 = await p.evaluate(() => scrollY);
    log('menu.phone.openTransition', early);
    log('menu.phone.state', st);
    log('menu.phone.pageScrolledBehindMenu', { before: y0, after: y1, moved: y1 !== y0 });
    // Open a group: do the other groups close; how tall is it now?
    await p.evaluate(() => document.getElementById('main-nav').scrollTo(0, 0));
    await p.tap('.nav-group:nth-of-type(1) summary');
    await p.waitForTimeout(300);
    log('menu.phone.groupOpen', await p.evaluate(() => { const n = document.getElementById('main-nav'); return { navScrollHeight: n.scrollHeight, navHeight: n.clientHeight, vh: innerHeight }; }));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    log('menu.phone.escapeCloses', await p.evaluate(() => !document.getElementById('main-nav').classList.contains('mobile-open')));
    await ctx.close();
  }

  // 2. Desktop mega-menu: appearance, closes on scroll?, hover affordance.
  {
    const { ctx, p } = await open(browser, LAPTOP);
    await p.click('.nav-group:nth-of-type(1) summary');
    await p.waitForTimeout(30);
    const t = await p.evaluate(() => { const d = document.querySelector('.nav-group[open] .nav-dropdown'); const cs = getComputedStyle(d); return { opacity: cs.opacity, transition: cs.transitionDuration, animation: cs.animationName }; });
    log('dropdown.laptop.openAnimation', t);
    await p.mouse.wheel(0, 500);
    await p.waitForTimeout(400);
    log('dropdown.laptop.stillOpenAfterScroll', await p.evaluate(() => !!document.querySelector('.nav-group[open]')));
    await p.mouse.click(700, 700);
    await p.waitForTimeout(200);
    log('dropdown.laptop.closesOnOutsideClick', await p.evaluate(() => !document.querySelector('.nav-group[open]')));
    await ctx.close();
  }

  // 3. Sign-in dialog: page scroll behind modal, focus.
  for (const [name, opts] of [['phone', PHONE], ['laptop', LAPTOP]]) {
    const { ctx, p } = await open(browser, opts);
    const btn = await p.$('[data-sign-in]:visible') || await p.$('.site-footer [data-sign-in]');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await p.waitForTimeout(400);
    const y0 = await p.evaluate(() => scrollY);
    await p.mouse.move(10, 10);
    await p.mouse.wheel(0, 800);
    await p.waitForTimeout(300);
    const d = await p.evaluate(() => { const g = document.getElementById('signin-dialog'); const r = g.getBoundingClientRect(); return { open: g.open, w: Math.round(r.width), h: Math.round(r.height), focus: document.activeElement?.tagName + '.' + (document.activeElement?.className || ''), anim: getComputedStyle(g).animationName, bodyOverflow: getComputedStyle(document.body).overflow }; });
    log(`dialog.${name}`, { ...d, pageScrolledBehind: (await p.evaluate(() => scrollY)) !== y0 });
    await ctx.close();
  }

  // 4. Tab switches that change height (content below jumps).
  for (const [name, opts] of [['phone', PHONE], ['laptop', LAPTOP]]) {
    const { ctx, p } = await open(browser, opts);
    // Moments
    const moments = await p.$$eval('[data-moment]', b => b.map(x => x.dataset.moment));
    const mh = [];
    for (const m of moments) {
      await p.click(`[data-moment="${m}"]`);
      await p.waitForTimeout(150);
      mh.push(await p.evaluate(() => Math.round(document.getElementById('moment-panel').getBoundingClientRect().height)));
    }
    log(`moments.${name}.panelHeights`, mh);
    // Value tabs: does the changed panel end up on screen?
    const vt = [];
    for (const k of ['scale', 'insurance', 'uptime']) {
      const tab = await p.$(`[data-value-tab="${k}"]`);
      await tab.scrollIntoViewIfNeeded();
      await p.evaluate(k => document.querySelector(`[data-value-tab="${k}"]`).scrollIntoView({ block: 'center' }), k);
      await p.waitForTimeout(200);
      await tab.click();
      await p.waitForTimeout(300);
      vt.push(await p.evaluate(k => { const r = document.getElementById(`value-panel-${k}`).getBoundingClientRect(); return { k, panelTop: Math.round(r.top), visible: r.top < innerHeight - 80, h: Math.round(r.height) }; }, k));
    }
    log(`valueTabs.${name}`, vt);
    await ctx.close();
  }

  // 5. In-page anchors: is the target heading clear of the sticky header?
  for (const [name, opts] of [['phone', PHONE], ['laptop', LAPTOP]]) {
    const { ctx, p } = await open(browser, opts);
    const out = [];
    for (const id of ['pressure-uptime', 'pressure-growth', 'outcomes']) {
      await p.evaluate(id => { const a = document.querySelector(`a[href="#${id}"]`); a.scrollIntoView({ block: 'center' }); a.click(); }, id);
      await p.waitForTimeout(1500);
      const hb = await headerBottom(p);
      out.push(await p.evaluate(({ id, hb }) => { const t = document.getElementById(id); const h = t.querySelector('h2,h3,.pressure-chapter-number') || t; const r = h.getBoundingClientRect(); return { id, headingTop: Math.round(r.top), headerBottom: Math.round(hb), gap: Math.round(r.top - hb) }; }, { id, hb }));
    }
    log(`anchors.${name}`, out);
    await ctx.close();
  }

  // 6. Answers page: deep link opens + lands below header.
  {
    const { ctx, p } = await open(browser, PHONE, '/answers/');
    const id = await p.$eval('.answer-item', d => d.id);
    await p.goto(BASE + '/answers/#' + (await p.$$eval('.answer-item', d => d[4].id)), { waitUntil: 'load' });
    await p.waitForTimeout(1200);
    const hb = await headerBottom(p);
    log('answers.phone.deepLink', await p.evaluate(hb => { const t = document.querySelector(location.hash); const r = t.getBoundingClientRect(); return { open: t.open, top: Math.round(r.top), headerBottom: Math.round(hb), hiddenUnderHeader: r.top < hb }; }, hb));
    await p.fill('#faq-search', 'zzzz');
    await p.waitForTimeout(200);
    log('answers.phone.noResults', await p.evaluate(() => !document.getElementById('no-answers').hidden));
    await ctx.close();
  }

  // 7. Demo form: input sizes, autocomplete, validation feedback.
  {
    const { ctx, p } = await open(browser, PHONE, '/demo/');
    log('demo.phone.fields', await p.$$eval('#demo-form input:not([type=hidden]):not([type=checkbox]), #demo-form select, #demo-form textarea', els => els.filter(e => e.offsetParent).map(e => ({ name: e.name, type: e.type, ac: e.autocomplete || null, fs: getComputedStyle(e).fontSize, h: Math.round(e.getBoundingClientRect().height), req: e.required }))));
    await p.click('#demo-form button[type=submit]');
    await p.waitForTimeout(300);
    log('demo.phone.emptySubmit', await p.evaluate(() => ({ active: document.activeElement?.name, invalid: [...document.querySelectorAll('#demo-form :invalid')].map(e => e.name) })));
    await ctx.close();
  }

  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  await browser.close();
})();
