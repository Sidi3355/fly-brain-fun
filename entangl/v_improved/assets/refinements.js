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
})();
