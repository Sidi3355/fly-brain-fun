/* Six pressures, worked: tabs, stepper inputs, and the six worked examples. The arithmetic
   is shown, never hidden, and nothing here predicts a saving. */
(() => {
  'use strict';
  const set = document.querySelector('[data-pz]');
  if (!set) return;
  const $ = (s, r = set) => r.querySelector(s), $$ = (s, r = set) => [...r.querySelectorAll(s)];
  const say = m => window.entangl?.announce(m);
  const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const time = m => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Tabs, with deep links (#pressure-scale) opening the right one.
  const tabs = $$('[role=tab]'), panels = $$('[role=tabpanel]');
  const select = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    if (focus) tabs[i].focus();
    tabs[i].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => { select(i); history.replaceState(null, '', '#' + panels[i].id); }));
  $('[role=tablist]').addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return; e.preventDefault(); select((next + tabs.length) % tabs.length, true);
  });
  const fromHash = () => { const i = panels.findIndex(p => '#' + p.id === location.hash); if (i >= 0) { select(i); set.scrollIntoView({ block: 'start' }); } };
  addEventListener('hashchange', fromHash); fromHash();

  // Steppers beside every "given".
  set.addEventListener('click', e => {
    const b = e.target.closest('.step'); if (!b) return;
    const input = document.getElementById(b.dataset.for), step = +input.step || 1;
    input.value = clamp((+input.value || 0) + step * +b.dataset.step, +input.min, +input.max);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const val = (k) => { const i = document.getElementById('pz-' + k); const v = clamp(+i.value, +i.min, +i.max); return Number.isFinite(v) ? v : +i.min; };
  const out = (calc, key, text) => { const el = $(`[data-o="${key}"]`, calc); if (el) el.textContent = text; };

  // 3.1 Trace a dependency.
  const tr = $('[data-pz-trace]');
  if (tr) {
    const names = { a: 'UPS-A', b: 'UPS-B', cooling: 'CRAH-02' };
    const draw = () => {
      const a = tr.dataset.asset, on = tr.dataset.traced === 'true', hall = a === 'a' ? 'Hall 01' : 'Hall 02';
      $('[data-trace-n]', tr).textContent = on ? '1' : '?';
      $('[data-trace-title]', tr).textContent = on ? `${hall} is connected.` : `What depends on ${names[a]}?`;
      $('[data-trace-sub]', tr).textContent = on ? 'Current operating state still needs verification.' : 'Trace the documented connection to find out.';
      $('[data-trace-btn]', tr).textContent = on ? 'Hide the traced connection' : 'Trace the connection';
      $('[data-pz-act=trace]', tr).setAttribute('aria-pressed', String(on));
      $$('[data-asset]', tr).forEach(b => b.matches('button') && b.setAttribute('aria-pressed', String(b.dataset.asset === a)));
    };
    tr.addEventListener('click', e => {
      const b = e.target.closest('button[data-asset]');
      if (b) { tr.dataset.asset = b.dataset.asset; tr.dataset.traced = 'false'; draw(); }
      if (e.target.closest('[data-pz-act=trace]')) { tr.dataset.traced = String(tr.dataset.traced !== 'true'); draw(); if (tr.dataset.traced === 'true') say($('[data-trace-title]', tr).textContent + ' ' + $('[data-trace-sub]', tr).textContent); }
    });
  }

  // 3.2 Workload.
  const sc = $('[data-pz-calc=scale]');
  const drawScale = () => {
    const s = val('sites'), p = val('procedures'), h = val('hours'), reviews = s * p, total = reviews * h;
    out(sc, 'sites', s); out(sc, 'procedures', p); out(sc, 'hours', num(h)); out(sc, 'total', num(total)); out(sc, 'reviews', num(reviews)); out(sc, 'days', num(total / 8));
    $('[data-o=tiles]', sc).innerHTML = Array.from({ length: s }, (_, i) => `<span style="--h:${p / 40 * 100}%"><i></i><small>${String(i + 1).padStart(2, '0')}</small></span>`).join('');
  };
  if (sc) { sc.addEventListener('input', drawScale); drawScale(); }

  // 3.3 Signals into one issue.
  const sg = $('[data-pz-signals]');
  sg?.addEventListener('click', e => {
    if (!e.target.closest('[data-pz-act=group]')) return;
    const g = sg.dataset.grouped !== 'true'; sg.dataset.grouped = String(g);
    $('[data-sig-tag]', sg).textContent = g ? 'Context attached' : 'Awaiting context';
    $('[data-sig-n]', sg).textContent = g ? '1' : '?';
    $('[data-sig-ref]', sg).textContent = g ? 'ISS-014 · OPERATOR REVIEW' : 'READINGS RECEIVED · NO RESPONSE ORGANIZED';
    $('[data-sig-title]', sg).textContent = g ? 'One issue. Three readings attached.' : 'Who is picking this up?';
    $('[data-sig-copy]', sg).textContent = g ? 'CRAH-02 · source records attached · field inspection awaiting approval' : 'The numbers arrived. The asset records, review, and field task still need to come together.';
    $('[data-sig-btn]', sg).textContent = g ? 'Separate the signals again' : 'Bring the context together';
    $('[data-sig-note]', sg).textContent = g ? 'Cause unconfirmed. Your operator decides the next step.' : 'Same sample signals. Watch the context change.';
    e.target.closest('[data-pz-act]').setAttribute('aria-pressed', String(g));
    say(g ? 'One issue, three readings attached. Cause unconfirmed.' : 'Signals separated.');
  });

  // 3.4 Waiting.
  const ef = $('[data-pz-calc=efficiency]');
  const drawEff = () => {
    const r = val('reviewWait'), f = val('fieldWait'), wait = r + f, total = 90 + wait, pct = Math.round(wait / total * 100);
    out(ef, 'review', r); out(ef, 'field', f); out(ef, 'elapsed', time(total)); out(ef, 'wait', time(wait)); out(ef, 'pct', pct);
    const segs = [['Prepare', 45, 'work'], ['Wait for review', r, 'wait'], ['Review', 15, 'work'], ['Wait for field', f, 'wait'], ['Record', 30, 'work']].filter(s => s[1] > 0);
    const g = $('[data-o=gantt]', ef);
    g.innerHTML = segs.map(([n, m, k]) => `<span class="${k}" style="flex:${m}" title="${n}: ${time(m)}"><b>${m / total >= .14 ? time(m) : ''}</b></span>`).join('');
    g.setAttribute('aria-label', `Timeline: 90 minutes of work and ${wait} minutes of waiting, ${pct} percent of the elapsed time.`);
  };
  if (ef) { ef.addEventListener('input', drawEff); drawEff(); }

  // 3.5 The record, through time and by audience.
  const ch = $('[data-pz-chron]');
  if (ch) {
    const ev = [...ch.querySelectorAll('.chron-list li')].map(li => li);
    const E = window.entanglEvents || [
      ['09:41', 'Issue created', 'Telemetry workflow', 'ISS-014', 'Hall 02 inlet temperature crossed the sample threshold.'],
      ['09:43', 'Response reviewed', 'Demo operator', 'Review R-014', 'The operator reviewed the linked signal and asset context. The cause remained unconfirmed.'],
      ['09:45', 'Field task approved', 'Demo operator', 'Approval A-014', 'A non-invasive inspection was approved and assigned to the fictional field engineer.'],
      ['09:50', 'Observations returned', 'Demo field engineer', 'Task TSK-014', 'The field observations were attached to the issue for operator review.'],
      ['09:53', 'Issue closed after review', 'Demo operator', 'Closure C-014', 'The operator reviewed the returned record and closed the sample issue.'],
      ['09:55', 'Customer update published', 'Demo operator', 'Notice N-014', 'An approved closure update was made available in the customer view.'],
    ];
    const range = $('#pz-at', ch);
    const draw = () => {
      const i = +ch.dataset.at, e = E[i], cust = ch.dataset.audience === 'customer';
      $$('[data-at]', ch).forEach(b => b.matches('button') && b.setAttribute('aria-pressed', String(+b.dataset.at === i)));
      ev.forEach((li, k) => li.classList.toggle('is-past', k <= i));
      range.value = i; range.setAttribute('aria-valuetext', `${e[0]}, ${e[1]}`);
      $('[data-view=auditor]', ch).hidden = cust; $('[data-view=customer]', ch).hidden = !cust;
      $('[data-c-count]', ch).textContent = `${i + 1} of 6 records available`;
      $('[data-c-time]', ch).textContent = e[0]; $('[data-c-title]', ch).textContent = e[1]; $('[data-c-copy]', ch).textContent = e[4];
      $('[data-c-owner]', ch).textContent = e[2]; $('[data-c-ref]', ch).textContent = e[3];
      const pub = i === 5;
      $('[data-cu-title]', ch).textContent = pub ? 'Your service update is available.' : 'No update published yet.';
      $('[data-cu-copy]', ch).textContent = pub ? 'The provider has closed this sample event after reviewing the returned field record.' : 'The internal work record exists. A customer notice becomes visible only after publication at 09:55 in this example.';
      $('[data-cu-notice]', ch).textContent = pub ? 'N-014 · 09:55' : 'None published';
      $$('[data-aud]', ch).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.aud === ch.dataset.audience)));
    };
    ch.addEventListener('click', e => {
      const at = e.target.closest('button[data-at]'), aud = e.target.closest('[data-aud]');
      if (at) ch.dataset.at = at.dataset.at;
      if (aud) ch.dataset.audience = aud.dataset.aud;
      if (at || aud) draw();
    });
    range.addEventListener('input', () => { ch.dataset.at = range.value; draw(); });
    draw();
  }

  // 3.6 Demand against a contract.
  const gr = $('[data-pz-calc=growth]');
  const drawGrowth = () => {
    const load = val('load'), pct = load / 5, head = 500 - load, level = load > 500 ? 'over' : load >= 450 ? 'near' : 'room';
    out(gr, 'load', load); out(gr, 'pct', num(pct));
    out(gr, 'head', head >= 0 ? `${num(head)} kW below` : `${num(-head)} kW above`);
    out(gr, 'status', level === 'over' ? 'Above the contracted limit' : level === 'near' ? 'A capacity conversation is worth starting' : 'Room below the contracted limit');
    gr.dataset.level = level;
    const pts = [.62, .67, .64, .73, .76, .72, .83, .88, .9, 1].map((f, i) => [45 + i * 56, 220 - load * f / 500 * 150]);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    $('[data-o=line]', gr).setAttribute('d', line);
    $('[data-o=area]', gr).setAttribute('d', `${line} L549 220 L45 220Z`);
    const end = $('[data-o=end]', gr); end.setAttribute('cx', 549); end.setAttribute('cy', pts[9][1].toFixed(1));
    $$('[data-load]', gr).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.load === load)));
  };
  if (gr) {
    gr.addEventListener('input', drawGrowth);
    gr.addEventListener('click', e => { const b = e.target.closest('[data-load]'); if (!b) return; document.getElementById('pz-load').value = b.dataset.load; drawGrowth(); });
    drawGrowth();
  }
})();
