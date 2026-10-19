/* Behaviour refinements layered over the original scripts (see entangl/analysis/AUDIT.md).
   Each block names the finding it fixes. No block changes what the site says or does,
   only how it responds. Motion follows the site's own reduced-motion rules. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
  const behavior = () => (reduced() ? 'auto' : 'smooth');

  // B2 · iOS Safari only applies :active (the pressed state) once a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });

  // B3 · While the mobile menu is open the page beneath rests: no scrolling behind it,
  // and a scrim (refinements.css) that closes the menu when tapped.
  const nav = $('#main-nav');
  const narrow = matchMedia('(max-width: 1000px)');
  if (nav) {
    const sync = () => document.documentElement.classList.toggle('ref-nav-open', narrow.matches && nav.classList.contains('mobile-open'));
    new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ['class'] });
    narrow.addEventListener('change', sync);
  }

  // B4 · Below 650px the value cards stack above their panel, so a tap changes content
  // off-screen. Bring the panel the reader just chose into view.
  const valueRoot = $('#sources-of-value');
  const stacked = matchMedia('(max-width: 650px)');
  valueRoot?.addEventListener('click', e => {
    const tab = e.target.closest('[data-value-tab]');
    if (!tab || !stacked.matches) return;
    requestAnimationFrame(() => {
      const panel = $(`#value-panel-${tab.dataset.valueTab}`);
      if (panel && panel.getBoundingClientRect().top > innerHeight * 0.55) panel.scrollIntoView({ block: 'start', behavior: behavior() });
    });
  });

  // B6 · The moment tabs scroll sideways on phones. Fade whichever edge has more,
  // and keep the chosen tab centred instead of half off the screen.
  const momentTabs = $('.moment-tabs');
  if (momentTabs) {
    const edges = () => {
      const more = momentTabs.scrollWidth - momentTabs.clientWidth;
      momentTabs.classList.toggle('ref-more-start', more > 2 && momentTabs.scrollLeft > 2);
      momentTabs.classList.toggle('ref-more-end', more > 2 && momentTabs.scrollLeft < more - 2);
    };
    const centre = tab => {
      if (momentTabs.scrollWidth <= momentTabs.clientWidth) return;
      const t = momentTabs.getBoundingClientRect(), b = tab.getBoundingClientRect();
      momentTabs.scrollBy({ left: b.left + b.width / 2 - (t.left + t.width / 2), behavior: behavior() });
    };
    momentTabs.addEventListener('scroll', edges, { passive: true });
    addEventListener('resize', edges, { passive: true });
    momentTabs.addEventListener('click', e => { const tab = e.target.closest('[data-moment]'); if (tab) centre(tab); });
    momentTabs.addEventListener('keyup', e => { if (e.target.matches('[data-moment]')) centre(e.target); });
    edges();
  }

  // D1 · The lifecycle reading column scrolls inside the pinned story. When a stage is
  // taller than the column, drop its one-line descriptions (as phones already do) so the
  // interactive card fits; if it still overflows, fade the edge so "more" is visible.
  const panel = $('.life-hero-panel');
  const hero = panel?.closest('.life-hero');
  if (panel && hero) {
    let queued = 0;
    const fit = () => {
      queued = 0;
      if (hero.dataset.lifeMobile === 'false') {
        panel.classList.remove('ref-compact');
        if (panel.scrollHeight > panel.clientHeight + 2) panel.classList.add('ref-compact');
      } else panel.classList.remove('ref-compact');
      panel.classList.toggle('ref-more', panel.scrollHeight - panel.clientHeight - panel.scrollTop > 2);
    };
    const queue = () => { if (!queued) queued = requestAnimationFrame(fit); };
    panel.addEventListener('scroll', () => panel.classList.toggle('ref-more', panel.scrollHeight - panel.clientHeight - panel.scrollTop > 2), { passive: true });
    new MutationObserver(queue).observe(panel, { childList: true, characterData: true, subtree: true });
    new MutationObserver(queue).observe(hero, { attributes: true, attributeFilter: ['data-life-mobile'] });
    new ResizeObserver(queue).observe(panel);
    addEventListener('resize', queue, { passive: true });
    document.fonts?.ready.then(queue);
    queue();
  }

  // ───────────── Round 2 · UI polish (analysis/UI-REVIEW.md) ─────────────
  const ease = 'cubic-bezier(.2,.7,.2,1)';

  // U5 · Accordions open and close with their height instead of jumping. The mobile menu's
  // groups animate too; the desktop mega-menu (an overlay) keeps its own entrance.
  const toggleDetails = (d, open) => {
    for (const a of d.getAnimations()) a.cancel();
    const token = (d.__refToken = {});
    const start = d.getBoundingClientRect().height;
    d.open = open; const end = d.getBoundingClientRect().height; d.open = true;
    d.classList.add('ref-moving');
    const done = () => { if (d.__refToken !== token) return; d.classList.remove('ref-moving'); if (!open) d.open = false; };
    const anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: Math.min(420, 180 + Math.abs(end - start) * .35), easing: ease });
    anim.onfinish = done; anim.oncancel = done;
    if (open) for (const c of d.children) if (c.tagName !== 'SUMMARY') c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 60, easing: ease, fill: 'backwards' });
  };
  document.addEventListener('click', e => {
    const summary = e.target.closest('summary'), d = summary?.parentElement;
    if (!d || d.tagName !== 'DETAILS' || summary !== d.querySelector(':scope > summary') || reduced()) return;
    if (d.classList.contains('nav-group') && !narrow.matches) return;
    e.preventDefault();
    toggleDetails(d, !d.open);
  });

  // U6 · When a panel's content is swapped, the panel eases to its new height instead of
  // jumping (changes caused by a window resize are left alone).
  const smoothHeight = el => {
    let last = el.getBoundingClientRect(), busy = false;
    new ResizeObserver(() => {
      const now = el.getBoundingClientRect();
      if (busy) return;
      const dh = now.height - last.height, sameWidth = Math.abs(now.width - last.width) < 1;
      const from = last.height; last = now;
      if (Math.abs(dh) < 3 || !sameWidth || reduced()) return;
      busy = true; el.style.overflow = 'hidden';
      const anim = el.animate({ height: [from + 'px', now.height + 'px'] }, { duration: Math.min(380, 170 + Math.abs(dh) * .3), easing: ease });
      const done = () => { busy = false; el.style.overflow = ''; last = el.getBoundingClientRect(); };
      anim.onfinish = done; anim.oncancel = done;
    }).observe(el);
  };
  document.querySelectorAll('.value-panels, .review-content, #review-panel, .requirement-detail, #procurement-body, #pp-scene, #pressure-evidence-card, .calculator-result').forEach(smoothHeight);

  // U7 · Sections arrive as they come into view: headings, their kickers and intro lines, and the
  // cards of the pressure index rise and fade in once. Anything on screen at load is left as is.
  if ('IntersectionObserver' in window && !reduced()) {
    const picks = [...document.querySelectorAll('main section h2, main section h2 + p, main .eyebrow, main .pressure-index > a, main .proof-band a, main .pp-section-heading > *')]
      .filter(el => !el.closest('.life-hero, .site-header, .site-footer, dialog, [hidden], .value-panel, #pp-scene'));
    // The arrival is an animation rather than a transition, so it plays whatever the element's own
    // rules say and leaves its hover transitions untouched once it is done.
    const order = new WeakMap();
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      el.classList.remove('ref-reveal');
      if (!reduced()) el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: (order.get(el) || 0) * 70, easing: ease, fill: 'backwards' });
    }), { rootMargin: '0px 0px -6% 0px' });
    const groups = new Map();
    for (const el of picks) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) continue;
      const i = groups.get(el.parentElement) || 0; groups.set(el.parentElement, i + 1);
      order.set(el, Math.min(i, 5));
      el.classList.add('ref-reveal'); io.observe(el);
    }
  }

  // U9 · Pressure lab time bars: a segment too narrow for its label shows the colour alone
  // (the label stays in the segment's title).
  const track = $('#pressure-day-track');
  if (track) {
    const fit = () => track.querySelectorAll('.pressure-time-segment').forEach(seg => seg.classList.toggle('ref-tight', seg.scrollWidth > seg.clientWidth + 1));
    new MutationObserver(fit).observe(track, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    new ResizeObserver(fit).observe(track);
  }

  // U10 · Content swapped in place dissolves from its previous state instead of cutting: a snapshot
  // of what was there fades out over the new content, so parts that did not change stay perfectly
  // still and only what changed visibly moves. Skipped while a slider is dragged or text is typed.
  const dissolve = el => {
    const snap = () => [...el.childNodes].filter(n => !n.classList?.contains('ref-ghost')).map(n => n.cloneNode(true));
    let before = snap(), height = el.offsetHeight;
    const mo = new MutationObserver(() => {
      const prev = before, prevHeight = height;
      before = snap(); height = el.offsetHeight;
      const a = document.activeElement;
      if (reduced() || !el.getClientRects().length || !prevHeight) return;
      if (a?.matches('input[type=range], input[type=number], input[type=text], input[type=search], textarea')) return;
      if (el.closest('.life-section')?.querySelector('.life-ghost')) return;   // a stage handover is already moving
      mo.disconnect();
      el.querySelectorAll(':scope > .ref-ghost').forEach(g => g.remove());
      const ghost = el.cloneNode(false);
      for (const at of ['id', 'role', 'tabindex', 'aria-labelledby', 'aria-live', 'aria-busy', 'aria-label']) ghost.removeAttribute(at);
      ghost.classList.add('ref-ghost'); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
      for (const n of prev) { if (n.nodeType === 1) { n.removeAttribute('id'); n.querySelectorAll('[id]').forEach(x => x.removeAttribute('id')); } ghost.append(n); }
      ghost.style.height = prevHeight + 'px';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.append(ghost);
      watch();
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' })
        .finished.then(() => { mo.disconnect(); ghost.remove(); watch(); }, () => {});
    });
    const watch = () => mo.observe(el, { childList: true, characterData: true, subtree: true });
    watch();
  };
  document.querySelectorAll('#review-panel, #procurement-body, .requirement-detail, #pp-scene, #life-interaction, #pressure-evidence-card, [data-pressure-stage="uptime"], [data-pressure-stage="response"]').forEach(dissolve);
})();
