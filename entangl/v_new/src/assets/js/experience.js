/* L-104 · The connected facility: one fictional event, followed across responsibilities. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const say = m => window.entangl?.announce(m);

  // Engineering sources
  const xs = $('[data-xsrc]');
  if (xs) {
    const tabs = $$('[role=tab]', xs);
    const go = (k, f) => { tabs.forEach(t => { const on = t.dataset.xsrcTab === k; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && f) t.focus(); }); $$('[role=tabpanel]', xs).forEach(p => { p.hidden = p.id !== 'xp-' + k; }); };
    xs.addEventListener('click', e => { const t = e.target.closest('[data-xsrc-tab]'); if (t) go(t.dataset.xsrcTab); });
    $('[role=tablist]', xs).addEventListener('keydown', e => { const i = tabs.indexOf(document.activeElement); if (i < 0) return; const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]; if (n === undefined) return; e.preventDefault(); go(tabs[(n + tabs.length) % tabs.length].dataset.xsrcTab, true); });
  }

  // The event: six stages, one record.
  const ev = $('[data-xev]'), STAGES = window.entanglEventStages || [], LOG = window.entanglEventLog || [];
  const temps = ['22.6', '29.4', '29.4', '29.4', '24.1', '24.1'];
  const states = ['Within sample threshold · H02-INLET-02 · illustrative data', 'Sample threshold crossed · H02-INLET-02', 'Sample threshold crossed · cause not established', 'Field task TSK-014 open', 'New simulated reading · no causal claim', 'Issue ISS-014 closed after operator review'];
  const tab = [['No task assigned', 'Awaiting an approved task. An issue does not become permission to act. Operator approval comes first.'], ['No task assigned', 'Awaiting an approved task. An issue does not become permission to act. Operator approval comes first.'], ['No approved task yet', 'Approval before action. Review the supporting records first.'], ['Assigned / Jordan Lee', 'Same issue. In your hands. Match the asset reference, record the on-site observation, and attach it to ISS-014.'], ['Field record returned.', 'The sample observations are back in the issue record. No equipment was operated.'], ['Field record returned.', 'The sample observations are back in the issue record. No equipment was operated.']];
  const notice = ['No customer update has been published in this demonstration.', 'The provider is reviewing an operational event associated with your suite. Service impact is not established in this demonstration. Further updates will be shared as approved.', 'The provider is reviewing an operational event associated with your suite. Service impact is not established in this demonstration. Further updates will be shared as approved.', 'The provider is reviewing an operational event associated with your suite. Service impact is not established in this demonstration. Further updates will be shared as approved.', 'The provider is reviewing an operational event associated with your suite. Service impact is not established in this demonstration. Further updates will be shared as approved.', 'The provider has closed this sample operational event after reviewing the returned record. This is an illustrative update, not an SLA statement.'];
  const draw = s => {
    ev.dataset.stage = s;
    const st = STAGES[s];
    $('[data-xev-kicker]', ev).textContent = st[0]; $('[data-xev-title]', ev).textContent = st[1]; $('[data-xev-copy]', ev).textContent = st[2];
    $('[data-xev-btn]', ev).textContent = st[3]; $('[data-xev-fine]', ev).textContent = st[4];
    $('[data-xev-temp]', ev).textContent = temps[s]; $('[data-xev-state]', ev).textContent = states[s];
    $('[data-xev-bar]', ev).style.width = (parseFloat(temps[s]) / 40 * 100) + '%';
    $('[data-xev-reset]', ev).hidden = s === 0;
    $$('.xev-flow li', ev).forEach(li => li.classList.toggle('is-done', +li.dataset.step <= s));
    const items = LOG.filter(([k]) => k <= s);
    $('[data-xev-log]', ev).innerHTML = items.length ? items.map(([k, t, who]) => `<li><span class="code">${['', '09:41', '09:43', '09:45', '09:50', '09:53'][k]}</span><b>${t}</b><small>${who}</small></li>`).join('') : '<li class="xev-empty">No threshold crossing introduced.</li>';
    const tt = $('[data-xtab-title]'), tc = $('[data-xtab-copy]'); if (tt) { tt.textContent = tab[s][0]; tc.textContent = tab[s][1]; }
    const n = $('[data-xps-notice]'); if (n) n.textContent = notice[s];
    const a = $('[data-xps-audit]'); if (a) a.textContent = items.length ? `${items.length} event record${items.length > 1 ? 's' : ''} in the chronology so far: ${items.map(i => i[1]).join(' · ')}.` : 'The chronology fills in as the event moves forward above.';
  };
  if (ev && STAGES.length) {
    ev.addEventListener('click', e => {
      if (e.target.closest('[data-xev-reset]')) { draw(0); say('Demo reset. All connected records are back at the beginning.'); return; }
      if (!e.target.closest('[data-xev-next]')) return;
      const s = +ev.dataset.stage;
      if (s === 5) { const b = $('[data-xps-tab="auditor"]'); b?.click(); $('#perspectives')?.scrollIntoView({ behavior: window.entangl?.reduced() ? 'auto' : 'smooth' }); return; }
      draw(s + 1); say(STAGES[s + 1][1] + ' ' + STAGES[s + 1][2]);
    });
    draw(0);
  }

  // Perspectives
  const ps = $('[data-xps]');
  ps?.addEventListener('click', e => {
    const b = e.target.closest('[data-xps-tab]'); if (!b) return;
    $$('[data-xps-tab]', ps).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-xps-panel]', ps).forEach(p => { p.hidden = p.dataset.xpsPanel !== b.dataset.xpsTab; });
  });

  // Capacity explorer
  const cap = $('[data-xcap]');
  cap?.addEventListener('click', e => {
    const b = e.target.closest('[data-xcap-row]'); if (!b) return;
    $$('[data-xcap-row]', cap).forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.closest('tr').classList.toggle('is-sel', x === b); });
    $$('[data-xcap-card]', cap).forEach(c => { c.hidden = c.dataset.xcapCard !== b.dataset.xcapRow; });
  });
})();
