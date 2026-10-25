/* Behaviour shared by every sheet: motion preference, plotting, the sheet index overlay,
   note references, the sign-in dialog. Everything degrades to plain links and text. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const osReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => osReduced.matches || root.classList.contains('reduce-motion');
  window.entangl = { reduced, announce: msg => { const l = $('#live'); if (l) { l.textContent = ''; requestAnimationFrame(() => { l.textContent = msg; }); } } };

  // Motion switch in the sheet foot. The OS setting always wins.
  const motionButtons = $$('[data-motion]');
  const syncMotion = () => motionButtons.forEach(b => { b.setAttribute('aria-pressed', String(root.classList.contains('reduce-motion'))); b.textContent = root.classList.contains('reduce-motion') ? 'Allow motion' : 'Reduce motion'; });
  motionButtons.forEach(b => b.addEventListener('click', () => {
    root.classList.toggle('reduce-motion');
    try { localStorage.setItem('entangl-motion', root.classList.contains('reduce-motion') ? 'off' : 'on'); } catch (e) {}
    syncMotion();
    if (reduced()) $$('[data-plot]').forEach(el => el.classList.add('is-plotted'));
  }));
  syncMotion();

  // Plotting: measure each line, then draw it the first time it comes into view.
  const prepare = el => {
    $$('.plot-line', el).forEach((p, i) => {
      if (typeof p.getTotalLength === 'function') { const len = Math.ceil(p.getTotalLength()) + 2; p.style.setProperty('--len', len); if (!p.style.getPropertyValue('--dur')) p.style.setProperty('--dur', Math.min(1.4, .35 + len / 900) + 's'); }
    });
  };
  const plotted = $$('[data-plot]');
  plotted.forEach(prepare);
  if (reduced() || !('IntersectionObserver' in window)) plotted.forEach(el => el.classList.add('is-plotted'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-plotted'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -4% 0px' });
    plotted.forEach(el => io.observe(el));
  }
  window.entangl.plot = el => { prepare(el); el.classList.remove('is-plotted'); void el.getBoundingClientRect(); requestAnimationFrame(() => el.classList.add('is-plotted')); };

  // Sheet index overlay on small screens.
  const opener = $('[data-index-open]'), tb = $('#sheet-index');
  const setIndex = open => {
    root.classList.toggle('index-open', open);
    opener?.setAttribute('aria-expanded', String(open));
    if (open) { const cur = $('[aria-current=page]', tb) || $('a', tb); setTimeout(() => cur?.focus(), 30); }
    else opener?.focus({ preventScroll: true });
  };
  opener?.addEventListener('click', () => setIndex(true));
  $$('[data-index-close]').forEach(b => b.addEventListener('click', () => setIndex(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('index-open')) setIndex(false); });
  tb?.addEventListener('click', e => { if (e.target.closest('a') && root.classList.contains('index-open')) root.classList.remove('index-open'); });
  matchMedia('(min-width: 1200px)').addEventListener('change', e => { if (e.matches) root.classList.remove('index-open'); });

  // Sign in.
  const dlg = $('#signin');
  $$('[data-signin]').forEach(b => b.addEventListener('click', () => { if (dlg?.showModal) dlg.showModal(); else location.href = 'mailto:info@entangl.com'; }));
  dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  // Note references: the note opens where you are reading; the link still jumps to the list.
  let pop = null, popFor = null;
  const closePop = () => { pop?.remove(); popFor?.classList.remove('is-open'); popFor?.removeAttribute('aria-describedby'); pop = popFor = null; };
  const openPop = a => {
    const note = document.getElementById('n-' + a.dataset.note);
    if (!note || popFor === a) return;
    closePop();
    pop = document.createElement('div');
    pop.className = 'note-pop'; pop.id = 'note-pop'; pop.setAttribute('role', 'tooltip');
    pop.innerHTML = `<span class="note-num">${note.querySelector('.note-num').textContent}</span>${note.querySelector('.note-body').innerHTML}`;
    pop.querySelectorAll('a').forEach(x => x.setAttribute('tabindex', '-1'));
    document.body.append(pop);
    const r = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let left = Math.max(16, Math.min(r.left + scrollX - 20, scrollX + innerWidth - w - 16));
    let top = r.bottom + scrollY + 10;
    if (r.bottom + h + 20 > innerHeight && r.top > h + 20) top = r.top + scrollY - h - 10;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    popFor = a; a.classList.add('is-open'); a.setAttribute('aria-describedby', 'note-pop');
  };
  document.addEventListener('pointerover', e => { const a = e.target.closest?.('.nref'); if (a && e.pointerType === 'mouse') openPop(a); });
  document.addEventListener('pointerout', e => { const a = e.target.closest?.('.nref'); if (a && a === popFor && !a.contains(e.relatedTarget)) closePop(); });
  document.addEventListener('focusin', e => { const a = e.target.closest?.('.nref'); if (a) openPop(a); else if (pop) closePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
  addEventListener('scroll', () => { if (pop && !popFor?.matches(':focus')) closePop(); }, { passive: true });
  document.addEventListener('click', e => {
    const a = e.target.closest('.nref');
    if (!a) return;
    closePop();
    const note = document.getElementById('n-' + a.dataset.note);
    if (note) { setTimeout(() => { note.classList.add('is-flash'); setTimeout(() => note.classList.remove('is-flash'), 1600); }, 300); }
  });

  // Cross-document transitions keep the title block still; skip them when motion is off.
  addEventListener('pageswap', e => { if (reduced()) e.viewTransition?.skipTransition(); });
  addEventListener('pagereveal', e => { if (reduced()) e.viewTransition?.skipTransition(); });
})();
