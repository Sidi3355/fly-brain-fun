/* The lifecycle spine: six moments on one floor plan. State lives in data attributes on the
   component; the stylesheet decides what the plan and panels show for each state. */
(() => {
  'use strict';
  const root = document.querySelector('[data-lf]');
  if (!root) return;
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const say = msg => window.entangl?.announce(msg);
  const reduced = () => window.entangl?.reduced();
  const tabs = $$('[role=tab]'), panels = $$('[role=tabpanel]');
  const records = [
    ['DAY 01', 'Accepted into service', 'Commissioning checks, approved procedures, and the named operating team.'],
    ['MONTH 03', 'Maintenance completed', 'The approved work pack, technician sign-off, and captured readings.'],
    ['MONTH 08', 'Incident reviewed', 'Alarm history, response decisions, restoration checks, and follow-up actions.'],
    ['YEAR 02', 'Facility management transferred', 'Transferred responsibilities, qualifications, supplier coverage, and open work.'],
    ['YEAR 04', 'Expansion proposed', 'The capacity case, customer requirements, engineering reviews, and open decisions.'],
  ];
  const audiences = {
    operator: ['All site records', 'The full operating record', 'Equipment history, work ownership, open risks, and the source behind each decision.'],
    customer: ['Customer A scope', 'The view for Customer A', 'Relevant maintenance, service-impact notices, agreed procedures, and contract information.'],
    auditor: ['Control evidence', 'Evidence behind the control', 'Approved versions, signatures, timestamps, exceptions, and corrective actions.'],
    insurer: ['Risk evidence', 'A record of risk and action', 'Equipment condition, completed maintenance, risk recommendations, and incident evidence.'],
    acquirer: ['Due diligence scope', 'Know what comes with the site', 'Asset condition, deferred work, service obligations, and the history behind the operating plan.'],
  };
  // What the facility is doing, in the words of the original story, for each state.
  const caption = () => {
    const d = root.dataset;
    switch (+d.moment) {
      case 0: return d.launch === 'post' ? 'Tests accepted. The first racks are live.' : 'Commissioning crews are testing the facility.';
      case 1: return d.workdone === 'done' ? 'Work complete. Equipment closed and the area cleared.' : d.work === 'cooling' ? 'Cooling service: a technician changes the filter.' : 'UPS inspection: the panel opens for the technician.';
      case 2: return d.incident === 'fault' ? 'Cooling fault. Responders arrive while Hall 02 heats up.' : 'Recovery verified. Fans restart and the hall cools.';
      case 3: return d.handover === 'post' ? 'The incoming team takes over. The site history stays.' : d.team === 'vendors' ? 'Service partners arrive with the next team.' : d.team === 'parts' ? 'The spares inventory moves into the new team’s care.' : 'Outgoing and incoming teams meet on the same site.';
      case 4: return d.expansion === 'expanded' ? 'The next hall takes shape while the original facility stays live.' : 'Customer demand grows inside the existing data halls.';
      default: { const a = $('#lf-audience')?.value; return a === 'customer' ? 'A customer visits their hall and its operating record.' : a === 'insurer' ? 'An insurer reviews the plant, protection and service history.' : a === 'acquirer' ? 'A new owner tours the facility with its history intact.' : 'An evidence-led site walk connects the records to the equipment.'; }
    }
  };
  const refresh = () => { const c = $('[data-lf-caption]'); if (c) c.textContent = caption(); };
  // On narrow screens the plan scrolls sideways: bring each moment's area into view.
  const focusX = [0, .05, .45, .4, .55, .3];
  const scroller = $('.lf-plan-scroll');
  const pan = m => {
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 4) return;
    scroller.scrollTo({ left: (scroller.scrollWidth - scroller.clientWidth) * focusX[m] * 1.6, behavior: reduced() ? 'auto' : 'smooth' });
  };

  function select(i, focus = false) {
    root.dataset.moment = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    if (focus) tabs[i].focus();
    tabs[i].scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    refresh(); pan(i);
    say(`Moment ${i + 1} of 6: ${tabs[i].querySelector('.lf-tab-name').textContent}. ${caption()}`);
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  root.querySelector('[role=tablist]').addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); select((next + tabs.length) % tabs.length, true);
  });

  const flip = (key, a, b) => { root.dataset[key] = root.dataset[key] === a ? b : a; };
  root.addEventListener('click', e => {
    const act = e.target.closest('[data-lf-act]')?.dataset.lfAct;
    const work = e.target.closest('[data-lf-work]')?.dataset.lfWork;
    const team = e.target.closest('[data-lf-team]')?.dataset.lfTeam;
    if (work) { root.dataset.work = work; root.dataset.workdone = 'open'; $$('[data-lf-work]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lfWork === work))); }
    if (team) { root.dataset.team = team; root.dataset.handover = 'pre'; $$('[data-lf-team]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lfTeam === team))); }
    if (act === 'launch') {
      flip('launch', 'pre', 'post');
      const done = root.dataset.launch === 'post', n = done ? 32 : 28;
      $('[data-lf-gates]').textContent = n;
      $('.lf-track').setAttribute('aria-valuenow', n);
      $$('.lf-track i').forEach((x, k) => x.classList.toggle('is-done', k < n));
    }
    if (act === 'work') flip('workdone', 'open', 'done');
    if (act === 'incident') { flip('incident', 'fault', 'recovered'); $('[data-lf-temp]').textContent = root.dataset.incident === 'fault' ? '31.2' : '22.6'; }
    if (act === 'handover') flip('handover', 'pre', 'post');
    if (act === 'expansion') flip('expansion', 'current', 'expanded');
    if (act || work || team) { refresh(); say(caption()); }
  });

  // Customer demand against the 1,000 kW example contract.
  const demand = $('#lf-demand');
  demand?.addEventListener('input', () => {
    const v = +demand.value, pct = Math.round(v / 10);
    $('#lf-demand-out').textContent = v.toLocaleString('en-US');
    $('.lf-meter i').style.width = (v - 400) / 10 + '%';
    $('[data-lf-pct]').textContent = pct + '%';
    $('[data-lf-status]').textContent = v > 1000 ? 'Above the current contract' : v >= 900 ? 'A capacity conversation is due' : 'Within the example contract';
    root.toggleAttribute('data-over', v > 1000);
    const t = root.querySelector('.pl-demand'); if (t) t.textContent = v.toLocaleString('en-US');
  });
  // The record, by audience and through time.
  const aud = $('#lf-audience');
  aud?.addEventListener('change', () => {
    const a = audiences[aud.value];
    $('[data-lf-aud-scope]').textContent = a[0]; $('[data-lf-aud-title]').textContent = a[1]; $('[data-lf-aud-copy]').textContent = a[2];
    refresh(); say(`${a[1]}. ${a[2]}`);
  });
  const rec = $('#lf-record');
  rec?.addEventListener('input', () => {
    const r = records[+rec.value];
    root.dataset.record = rec.value;
    $('[data-lf-rec-when]').textContent = r[0]; $('[data-lf-rec-title]').textContent = r[1]; $('[data-lf-rec-text]').textContent = r[2];
    rec.setAttribute('aria-valuetext', `${r[0]}: ${r[1]}`);
  });
  // Clicking a numbered stop on the plan scrubs the record to it.
  root.addEventListener('click', e => {
    const stop = e.target.closest('.pl-stop'); if (!stop || !rec) return;
    rec.value = stop.dataset.stop; rec.dispatchEvent(new Event('input'));
  });
})();
