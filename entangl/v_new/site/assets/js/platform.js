/* Platform proofs: state, events, and an in-place redraw that keeps focus, scroll and
   transitions intact. Rendering lives in scenes.js, shared with the build. */
(() => {
  'use strict';
  const S = window.EntanglScenes;
  const frame = document.querySelector('[data-pp-page]');
  if (!S || !frame) return;
  const key = frame.dataset.ppPage, scene = frame.querySelector('[data-scene]');
  const say = m => window.entangl?.announce(m);
  let state = S.clone(S.DEFAULTS[key]);

  // Patch the scene in place instead of replacing it.
  const patch = (cur, next) => {
    for (let i = 0; i < next.childNodes.length; i++) {
      const n = next.childNodes[i], o = cur.childNodes[i];
      if (!o) { cur.append(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { o.replaceWith(n.cloneNode(true)); continue; }
      if (n.nodeType === 3) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; continue; }
      if (n.nodeType !== 1) continue;
      for (const a of [...o.attributes]) if (!n.hasAttribute(a.name)) o.removeAttribute(a.name);
      for (const a of [...n.attributes]) if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(o.nodeName) && o !== document.activeElement) {
        if (o.type === 'checkbox' || o.type === 'radio') { if (o.checked !== n.checked) o.checked = n.checked; }
        else if (o.value !== n.value) o.value = n.value;
      }
      patch(o, n);
    }
    while (cur.childNodes.length > next.childNodes.length) cur.lastChild.remove();
  };
  const draw = (msg) => {
    const fresh = document.createElement('div');
    fresh.innerHTML = S.render(key, state);
    patch(scene, fresh);
    if (msg) say(msg);
  };

  const set = (attr, fn) => frame.addEventListener('click', e => { const b = e.target.closest(`[${attr}]`); if (!b || !scene.contains(b)) return; const m = fn(b.getAttribute(attr)); draw(m); });
  // Overview
  set('data-pp-path', v => { state.path = v; return 'Situation: ' + v; });
  set('data-pp-node', v => { state.node = v; });
  // Site model
  set('data-pp-asset', v => { state.asset = v; });
  set('data-pp-evidence', v => { state.evidence = v; });
  // Procedures
  set('data-pp-type', v => { state.type = v; return 'Procedure type ' + v.toUpperCase(); });
  // Review
  set('data-pp-finding', v => { state.finding = +v; state.accepting = false; state.reason = ''; });
  // Fieldwork
  set('data-pp-mode', v => { state.mode = v; });
  set('data-pp-equipment', v => { state.equipment = v; return v === 'ups-a' ? 'Hold: the equipment does not match.' : 'Equipment matched in the example.'; });
  set('data-pp-observation', v => { state.observation = v; return v === 'issue' ? 'Hold: request the site team’s review.' : 'Example observation attached.'; });
  // Visibility
  set('data-pp-audience', v => { state.audience = v; return v + ' view'; });
  set('data-pp-event', v => { state.point = +v; });
  // Maintenance
  set('data-pp-masset', v => { state.asset = v; state.prepared = false; });
  set('data-pp-day', v => { state.days[state.asset] = +v; state.prepared = false; return S.maintenanceReadiness(state).conflict ? 'Dependency conflict: UPS-A and UPS-B share a work window.' : 'Work windows separated.'; });
  // Portfolio
  set('data-pp-metric', v => { state.metric = v; });
  set('data-pp-site', v => { state.site = v; });

  frame.addEventListener('click', e => {
    const a = e.target.closest('[data-pp-action]'); if (!a || a.disabled) return;
    const k = a.dataset.ppAction; let msg = '';
    if (k === 'reset') { state = S.clone(S.DEFAULTS[key]); msg = 'Example reset.'; }
    if (k === 'request-revision') { state.decisions[state.finding] = 'revision'; state.accepting = false; msg = 'Revision requested.'; }
    if (k === 'accept-finding') { state.accepting = true; setTimeout(() => document.getElementById('pp-reason')?.focus(), 30); }
    if (k === 'save-reason') { state.decisions[state.finding] = 'accepted'; state.reasons[state.finding] = state.reason.trim(); state.accepting = false; state.reason = ''; msg = 'Acceptance recorded with a reason.'; }
    if (k === 'submit-review') { state.submitted = true; msg = S.reviewOutcome(state).revision ? 'Review recorded. A revised procedure is still required.' : 'Review recorded. Authorization remains with the site’s approver.'; }
    if (k === 'field-next') { if (state.step === 3) { state.done = true; msg = 'Rehearsal complete.'; } else { state.step++; msg = 'Checkpoint ' + (state.step + 1) + ' of 4.'; } }
    if (k === 'field-back') { state.step = Math.max(0, state.step - 1); }
    if (k === 'field-reset') { state = S.clone(S.DEFAULTS.fieldwork); state.mode = 'practice'; }
    if (k === 'group-signals') { state.grouped = true; msg = 'Signals connected into one investigation. Cause not confirmed.'; }
    if (k === 'attach-response') { state.response = true; msg = 'Response reference EOP-003 attached.'; }
    if (k === 'prepare-package') { state.prepared = true; msg = 'Example package prepared for the site’s review. Not approval to execute.'; }
    draw(msg);
    if (['field-next', 'field-back', 'field-reset'].includes(k)) scene.querySelector('.tab-task h3, .tab-done h3')?.setAttribute('tabindex', '-1'), scene.querySelector('.tab-task h3, .tab-done h3')?.focus({ preventScroll: true });
  });

  frame.addEventListener('change', e => {
    const el = e.target, sel = el.dataset.ppSelect, ck = el.dataset.ppCheck;
    if (sel === 'site') state.site = el.value;
    if (sel === 'template') state.template = el.value;
    if (ck?.startsWith('source-')) state.sources[ck.slice(7)] = el.checked;
    if (ck === 'drawing-revised') state.revised = el.checked;
    if (ck === 'field-witness') state.witness = el.checked;
    if (ck === 'telemetry-stale') { state.stale = el.checked; state.response = false; }
    if (ck === 'maintenance-parts') { state.parts = el.checked; state.prepared = false; }
    if (ck === 'maintenance-vendor') { state.vendor = el.checked; state.prepared = false; }
    if (sel || ck) draw();
  });

  frame.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.ppText === 'reason') { state.reason = el.value; const b = scene.querySelector('[data-pp-action="save-reason"]'); if (b) b.disabled = !state.reason.trim(); return; }
    if (el.dataset.ppRange === 'time') { state.time = +el.value; if (!S.telemetryData(state).canGroup) { state.grouped = false; state.response = false; } draw(); }
    if (el.dataset.ppRange === 'demand') { state.demands[state.site] = +el.value; draw(); }
  });
})();
