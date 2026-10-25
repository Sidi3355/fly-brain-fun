/* Small behaviours for individual sheets: the requirement register, the bid comparison,
   the review walkthrough, the RFI log and the printable evaluation outline. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const say = m => window.entangl?.announce(m);

  // L-102 · requirement register
  const reg = $('[data-reg]');
  reg?.addEventListener('click', e => {
    const b = e.target.closest('[data-req]'); if (!b) return;
    $$('[data-req]', reg).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-req-card]', reg).forEach(c => { c.hidden = c.dataset.reqCard !== b.dataset.req; });
  });

  // E-302 · a checklist you can actually tick
  const ck = $('[data-check5]');
  if (ck) {
    const boxes = $$('.check5-box', ck), tally = $('[data-check5-tally]', ck);
    ck.addEventListener('change', () => {
      const n = boxes.filter(b => b.checked).length;
      tally.textContent = n === boxes.length ? `${n} of ${n} settled. Bring this list to the security review.` : `${n} of ${boxes.length} settled.`;
      ck.classList.toggle('is-settled', n === boxes.length);
    });
  }

  // L-103 · facilities services or tenant requirements
  const bids = $('[data-bids]');
  bids?.addEventListener('click', e => {
    const b = e.target.closest('[data-bid-view]'); if (!b) return;
    $$('[data-bid-view]', bids).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-bid-panel]', bids).forEach(p => { p.hidden = p.dataset.bidPanel !== b.dataset.bidView; });
  });

  // R-402 · review walkthrough
  const rx = $('[data-rx]');
  if (rx) {
    const tabs = $$('[role=tab]', rx), panels = $$('[role=tabpanel]', rx);
    const go = (k, focus) => {
      tabs.forEach(t => { const on = t.dataset.rxTab === k; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      panels.forEach(p => { p.hidden = p.id !== 'rx-' + k; });
    };
    rx.addEventListener('click', e => {
      const t = e.target.closest('[data-rx-tab]'), g = e.target.closest('[data-rx-go]'), rec = e.target.closest('[data-rx-record]');
      if (t) go(t.dataset.rxTab);
      if (g) { go(g.dataset.rxGo); $(`#rx-tab-${g.dataset.rxGo}`, rx).focus(); }
      if (rec && !rec.disabled) {
        rec.disabled = true; $('[data-rx-record-label]', rx).textContent = 'Decision recorded';
        $('[data-rx-status]', rx).textContent = 'Example decision recorded. Approval to start is still not granted.';
        $$('[data-rx-decision]', rx).forEach(x => { x.textContent = 'recorded'; });
        say('Example decision recorded. No field approval has been granted.');
      }
    });
    $('[role=tablist]', rx).addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement); if (i < 0) return;
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]; if (n === undefined) return;
      e.preventDefault(); go(tabs[(n + tabs.length) % tabs.length].dataset.rxTab, true);
    });
  }

  // R-403 · RFI log: search reads the question and answer only, never the copy-link button.
  const log = $('[data-rfilog]');
  if (log) {
    const items = $$('.rfi > li', log), input = $('[data-rfi-search]', log), none = $('[data-rfi-none]', log), count = $('[data-rfi-count]', log);
    let cat = 'All';
    const filter = () => {
      const q = (input.value || '').trim().toLowerCase(); let n = 0;
      items.forEach(li => { const show = (cat === 'All' || li.dataset.cat === cat) && li.dataset.text.includes(q); li.hidden = !show; if (show) n++; });
      none.hidden = n !== 0; count.textContent = `${n} of ${items.length} questions shown`;
    };
    input.addEventListener('input', filter);
    log.addEventListener('click', async e => {
      const c = e.target.closest('[data-rfi-cat]');
      if (c) { cat = c.dataset.rfiCat; $$('[data-rfi-cat]', log).forEach(b => b.setAttribute('aria-pressed', String(b === c))); filter(); }
      const cp = e.target.closest('[data-copy]');
      if (cp) {
        const u = new URL(location.href); u.hash = cp.dataset.copy;
        let ok = false; try { await navigator.clipboard.writeText(u.href); ok = true; } catch (err) {}
        history.replaceState(null, '', u.pathname + u.search + u.hash);
        say(ok ? 'Link copied.' : 'Could not copy. The answer link is now in your address bar.');
        const t = cp.lastChild; const prev = t.textContent; t.textContent = ok ? 'Link copied' : 'Link in your address bar'; setTimeout(() => { t.textContent = prev; }, 1800);
      }
    });
    const open = () => { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; } const d = id && document.getElementById(id); if (d?.tagName === 'DETAILS') { cat = 'All'; input.value = ''; $$('[data-rfi-cat]', log).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rfiCat === 'All'))); filter(); d.open = true; requestAnimationFrame(() => d.scrollIntoView({ block: 'start' })); } };
    addEventListener('hashchange', open); open();
  }

  // R-404 · the outline prints with your notes; they never leave the page.
  $$('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
  $$('[data-outline] textarea').forEach(t => t.addEventListener('input', () => { t.style.height = 'auto'; t.style.height = Math.max(72, t.scrollHeight + 2) + 'px'; }));
})();
