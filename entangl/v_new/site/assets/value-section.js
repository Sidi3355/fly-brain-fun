(() => {
  'use strict';

  const icon = name => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"></use></svg>`;
  const number = n => Number(n).toLocaleString('en-US', {maximumFractionDigits: 1});
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const defaults = {minutes: 30, rate: 5000, sites: 8, procedures: 12, current: 4, target: 1.5, premium: 1000000, reduction: 0};
  const state = {...defaults};
  const sources = {
    uptime: 'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2026.AnnualOutageAnalysis.pdf#page=2',
    staffing: 'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf#page=25',
    insurance: 'https://www.fm.com/solutions/industries/data-centers'
  };
  const limits = {
    minutes: [0, 120, 5], rate: [0, 1000000, 100], sites: [1, 40, 1],
    procedures: [1, 200, 1], current: [0, 40, 0.5], target: [0, 40, 0.5],
    premium: [0, 100000000, 10000], reduction: [0, 10, 0.5]
  };

  function calculate(s) {
    const jobs = s.sites * s.procedures;
    const baseline = jobs * s.current, target = jobs * s.target;
    return {
      exposure: s.minutes * s.rate,
      jobs, baseline, target, recovered: baseline - target,
      days: (baseline - target) / 8,
      saving: s.premium * s.reduction / 100,
      remaining: s.premium * (1 - s.reduction / 100)
    };
  }

  const features = {
    uptime: [
      ['file', 'Catch issues before work starts.', 'Generate and review procedures against your facility’s drawings, equipment, operating rules, and design.', '/platform/review', 'Procedure generation & review'],
      ['tablet', 'Bring the checks into the field.', 'Explore guided iPad execution, equipment verification, and evidence captured as each step is completed.', '/platform/fieldwork', 'Fieldwork & iPad · explore scope'],
      ['clock', 'Keep maintenance ahead of failures.', 'Plan preventive schedules around asset requirements, service intervals, and the work your site needs.', '/platform/maintenance', 'Maintenance planning · planned']
    ],
    scale: [
      ['file', 'Give engineers their time back.', 'Use site knowledge to prepare and review procedures, reducing repeated document searches and first-draft work.', '/platform/procedures', 'Procedure authoring'],
      ['wave', 'Connect the signal to the response.', 'Explore live monitoring and alarm triage that bring related signals, equipment context, and response work together.', '/platform/telemetry', 'AI telemetry · explore scope'],
      ['people', 'Make site knowledge easier to use.', 'Bring instructions and site context to the team in the field, and carry that knowledge into training and handovers.', '/platform/fieldwork', 'Fieldwork & training · explore scope']
    ],
    insurance: [
      ['shield', 'Show how you control operational risk.', 'Bring approved procedures, maintenance records, and corrective actions into the evidence used at renewal.', '/platform/visibility', 'Customer & audit visibility · explore scope'],
      ['eye', 'Make service commitments visible.', 'Give customers a clear record of planned work, approvals, incident updates, and the response behind an SLA discussion.', '/platform/visibility', 'Customer assurance · explore scope'],
      ['link', 'Build a stronger renewal conversation.', 'Use a documented operating history to support the insurer’s risk assessment and a discussion of coverage and pricing.', '/platform/visibility', 'Insurance evidence · potential extension']
    ]
  };

  function featureList(key) {
    return `<ul class="value-features">${features[key].map(([i, title, copy, href, label]) => `<li><span class="value-feature-icon">${icon(i)}</span><div><h4>${title}</h4><p>${copy}</p><a href="${href}">${label}${icon('diagonal')}</a></div></li>`).join('')}</ul>`;
  }
  function input(key, label, unit) {
    const [min, max, step] = limits[key];
    return `<label class="value-input-label" for="value-${key}"><span>${label}</span><span class="value-number-input"><input id="value-${key}" data-value-input="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${state[key]}" inputmode="decimal"><span aria-hidden="true">${unit}</span></span></label>`;
  }
  function range(key, label, from, to, unit) {
    const [min, max, step] = limits[key];
    return `<div class="value-range"><div class="value-range-heading"><label for="value-${key}">${label}</label><output for="value-${key}" data-value-output="${key}">${number(state[key])} ${unit}</output></div><input type="range" id="value-${key}" data-value-input="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}" aria-valuetext="${number(state[key])} ${unit}" style="--value-fill:${(state[key] - min) / (max - min) * 100}%"><div class="value-range-ends"><span>${from}</span><span>${to}</span></div></div>`;
  }
  function modelTop(label, key) {
    return `<div class="value-model-top"><span>${label}</span><button type="button" data-value-reset="${key}" aria-label="Reset ${key === 'uptime' ? 'outage' : key === 'scale' ? 'workload' : 'insurance'} example">${icon('reset')}Reset</button></div>`;
  }
  function outageModel() {
    return `${modelTop('ILLUSTRATIVE COST EXPOSURE', 'uptime')}<div class="value-result"><output id="value-exposure" for="value-minutes value-rate">${money(calculate(state).exposure)}</output><p>exposure over <span id="value-duration">30</span> minutes of disruption</p></div>
      <div class="value-outage-visual" role="img" aria-label="30 minutes out of a 120-minute illustration" id="value-outage-visual"><div class="value-minute-bars" aria-hidden="true">${Array.from({length: 48}, (_, i) => `<i class="${i < 12 ? 'is-filled' : ''}"></i>`).join('')}</div><div class="value-chart-labels" aria-hidden="true"><span>0 min</span><span>60 min</span><span>120 min</span></div></div>
      ${range('minutes', 'Minutes of disruption', '0 minutes', '120 minutes', 'min')}
      ${input('rate', 'Your estimated cost per minute', '$ / min')}
      <p class="value-equation" id="value-outage-equation">30 minutes × $5,000 per minute = $150,000</p>
      <p class="value-model-note">Use a cost estimate for your operation. This models exposure for one event; it does not predict an outage or a reduction in risk.</p>`;
  }
  function scaleModel() {
    const d = calculate(state);
    return `${modelTop('SET A TARGET FOR YOUR EVALUATION', 'scale')}<div class="value-result"><div><output id="value-recovered" for="value-sites value-procedures value-current value-target">${number(d.recovered)}</output><span class="value-result-unit">h / month</span></div><p id="value-recovered-label">potential capacity recovered at your target</p></div>
      <div class="value-workload-chart" role="img" id="value-workload-chart" aria-label="Current preparation and review effort: 384 hours per month. Target: 144 hours per month."><div class="value-bar-row"><span>Current effort</span><strong id="value-baseline">384 h</strong><div><i id="value-bar-baseline" style="width:100%"></i></div></div><div class="value-bar-row value-bar-target"><span>Your target</span><strong id="value-target-total">144 h</strong><div><i id="value-bar-target" style="width:37.5%"></i></div></div></div>
      ${range('sites', 'Sites in your portfolio', '1 site', '40 sites', 'sites')}
      <div class="value-three-inputs">${input('procedures', 'Procedures / site / month', 'jobs')}${input('current', 'Current effort / procedure', 'hours')}${input('target', 'Target effort / procedure', 'hours')}</div>
      <p class="value-equation" id="value-scale-equation">8 sites × 12 procedures × 2.5 hours recovered = 240 hours / month</p>
      <p class="value-model-note">Current and target hours include preparation and review. Validate the target in an evaluation. Recovered capacity does not determine safe staffing levels.</p>`;
  }
  function insuranceModel() {
    return `${modelTop('HYPOTHETICAL PREMIUM SENSITIVITY', 'insurance')}<div class="value-result"><output id="value-premium-saving" for="value-premium value-reduction">$0</output><p>annual premium reduction in this scenario</p></div>
      <div class="value-renewal-visual"><div><span>Current annual premium</span><strong id="value-premium-current">$1,000,000</strong></div><div class="value-premium-track" role="img" id="value-premium-chart" aria-label="No reduction assumed. Scenario annual premium: 1,000,000 dollars."><span id="value-premium-retained" style="width:100%"></span><i id="value-premium-reduced" style="width:0%"></i></div><div><span>Scenario annual premium</span><strong id="value-premium-next">$1,000,000</strong></div></div>
      ${range('reduction', 'Hypothetical premium reduction', '0% · no reduction assumed', '10%', '%')}
      ${input('premium', 'Your annual insurance premium', '$ / year')}
      <p class="value-equation" id="value-insurance-equation">$1,000,000 annual premium × 0% = $0 / year</p>
      <p class="value-model-note">The starting scenario assumes no saving. An insurer must agree any change; pricing also depends on coverage, claims, market conditions, and other risks. Entangl has no verified premium-reduction benchmark.</p>`;
  }
  const tabs = [
    {key: 'uptime', n: '01', icon: 'shield', title: 'Protect uptime.', stat: '57<span>%</span>', note: 'of respondents put their latest major outage cost above <b>$100,000.</b>', source: 'Industry research · Uptime Institute 2026 [1]', cta: 'Explore the cost of disruption'},
    {key: 'scale', n: '02', icon: 'people', title: 'Scale operations.', stat: '46<span>%</span>', note: 'of surveyed operators struggle to find <b>qualified candidates.</b>', source: 'Industry research · Uptime Institute 2025 [2]', cta: 'Explore your team’s capacity'},
    {key: 'insurance', n: '03', icon: 'eye', title: 'Improve insurance economics.', stat: '<span>$</span>10<span class="value-stat-suffix">k</span>', note: 'for each <b>1% premium change</b> on an illustrative $1m annual policy.', source: 'Illustrative calculation · no saving assumed [3]', cta: 'Explore the renewal opportunity'}
  ];
  function renderValueSection() {
    return `<section class="value-section" id="sources-of-value" aria-labelledby="value-title"><div class="wrap value-wrap"><header class="value-heading"><div><span class="value-eyebrow">SOURCES OF VALUE</span><h2 id="value-title">Better operations.<br><em>Measurable value.</em></h2></div><p>Keep the facility available. Give your experts time back. Turn operational discipline into evidence that customers and insurers can trust.</p></header>
      <div class="value-tabs" role="tablist" aria-label="Explore three sources of value">${tabs.map((t, i) => `<button type="button" class="value-tab" id="value-tab-${t.key}" data-value-tab="${t.key}" role="tab" aria-selected="${i === 0}" aria-controls="value-panel-${t.key}" tabindex="${i === 0 ? '0' : '-1'}"><span class="value-tab-heading"><span>${t.n} / ${t.title}</span>${icon(t.icon)}</span><span class="value-stat">${t.stat}</span><span class="value-stat-copy">${t.note}</span><span class="value-stat-source">${t.source}</span><span class="value-tab-action">${t.cta}${icon('arrow')}</span></button>`).join('')}</div>
      <div class="value-panels">
        <div class="value-panel" role="tabpanel" id="value-panel-uptime" aria-labelledby="value-tab-uptime" tabindex="0"><div class="value-story"><span class="value-eyebrow">01 / MORE RELIABLE OPERATIONS</span><h3>Protect the minutes<br>that matter.</h3><p class="value-story-intro">The value starts before an incident: better procedures, clearer field checks, and maintenance that stays on schedule.</p>${featureList('uptime')}</div><div class="value-model" data-value-model="uptime">${outageModel()}</div></div>
        <div class="value-panel" role="tabpanel" id="value-panel-scale" aria-labelledby="value-tab-scale" tabindex="0" hidden><div class="value-story"><span class="value-eyebrow">02 / MORE CAPACITY IN YOUR TEAM</span><h3>More capacity.<br>From the team you have.</h3><p class="value-story-intro">Scale your portfolio without matching headcount growth. Give your experts more time by reducing manual preparation, searching, and coordination.</p>${featureList('scale')}</div><div class="value-model" data-value-model="scale">${scaleModel()}</div></div>
        <div class="value-panel" role="tabpanel" id="value-panel-insurance" aria-labelledby="value-tab-insurance" tabindex="0" hidden><div class="value-story"><span class="value-eyebrow">03 / A STRONGER CASE AT RENEWAL</span><h3>Make reliability<br>visible to your insurer.</h3><p class="value-story-intro">Fewer service failures are the goal. A traceable operating record helps you demonstrate the controls behind it—and discuss the economics with your insurer.</p>${featureList('insurance')}</div><div class="value-model" data-value-model="insurance">${insuranceModel()}</div></div>
      </div>
      <footer class="value-footer"><details class="value-sources" id="value-sources"><summary>Sources &amp; calculation notes${icon('plus')}</summary><div class="value-source-grid"><div><strong>[1] The cost of outages</strong><p>Uptime Institute’s <em>Annual outage analysis 2026</em> reports the 57% finding from its 2025 annual survey. Costs are self-reported for respondents’ most recent major outage.</p><a href="${sources.uptime}" target="_blank" rel="noopener noreferrer">Read the 2026 report${icon('diagonal')}</a></div><div><strong>[2] The staffing challenge</strong><p><em>Global Data Center Survey 2025</em>, Figure 15: 46% reported difficulty finding qualified candidates. This question had 650 respondents.</p><a href="${sources.staffing}" target="_blank" rel="noopener noreferrer">Read the 2025 survey${icon('diagonal')}</a></div><div><strong>[3] Insurance economics</strong><p>$1,000,000 × 1% = $10,000 per year. This is arithmetic, not a quoted discount. FM describes engineering-led risk assessment for data centers; it does not verify an Entangl premium benefit.</p><a href="${sources.insurance}" target="_blank" rel="noopener noreferrer">Read the insurer’s perspective${icon('diagonal')}</a></div></div><p class="value-source-note">Industry research describes the problem. The calculators use illustrative, editable assumptions and are not measured Entangl outcomes. Outage exposure, team capacity, and premium sensitivity are separate measures and are not added into a single ROI figure.</p></details><a href="#outcomes" class="value-next">Find the pressure behind the value${icon('down')}</a></footer>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true" id="value-live"></p>
    </div></section>`;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = {renderValueSection, calculate, defaults, limits};
    return;
  }
  const root = document.getElementById('sources-of-value');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const text = (id, value) => { $(id).textContent = value; };
  let active = 'uptime', announceTimer;
  const units = {minutes: 'min', sites: 'sites', reduction: '%'};
  const groups = {uptime: ['minutes', 'rate'], scale: ['sites', 'procedures', 'current', 'target'], insurance: ['premium', 'reduction']};
  const stackedTabs = window.matchMedia('(max-width: 650px)');
  const orientTabs = () => $('.value-tabs').setAttribute('aria-orientation', stackedTabs.matches ? 'vertical' : 'horizontal');
  stackedTabs.addEventListener('change', orientTabs);
  orientTabs();

  function selectTab(key, focus) {
    active = key;
    $$('[data-value-tab]').forEach(button => {
      const selected = button.dataset.valueTab === key;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus({preventScroll: true});
    });
    $$('.value-panel').forEach(panel => { panel.hidden = panel.id !== `value-panel-${key}`; });
  }
  function syncControls() {
    $$('[data-value-input]').forEach(el => {
      const key = el.dataset.valueInput;
      if (document.activeElement !== el) el.value = state[key];
      if (el.type === 'range') {
        el.style.setProperty('--value-fill', `${(state[key] - limits[key][0]) / (limits[key][1] - limits[key][0]) * 100}%`);
        el.setAttribute('aria-valuetext', `${number(state[key])} ${units[key]}`);
        text(`[data-value-output="${key}"]`, `${number(state[key])} ${units[key]}`);
      }
    });
  }
  function update(announce = true) {
    const d = calculate(state);
    syncControls();
    text('#value-exposure', money(d.exposure));
    text('#value-duration', number(state.minutes));
    $$('.value-minute-bars i').forEach((bar, i) => bar.classList.toggle('is-filled', i < state.minutes / 2.5));
    $('#value-outage-visual').setAttribute('aria-label', `${state.minutes} minutes out of a 120-minute illustration`);
    text('#value-outage-equation', `${number(state.minutes)} minutes × ${money(state.rate)} per minute = ${money(d.exposure)}`);
    text('#value-recovered', number(Math.abs(d.recovered)));
    text('#value-recovered-label', d.recovered < 0 ? 'additional effort required at your target' : 'potential capacity recovered at your target');
    text('#value-baseline', `${number(d.baseline)} h`);
    text('#value-target-total', `${number(d.target)} h`);
    const max = Math.max(d.baseline, d.target, 1);
    $('#value-bar-baseline').style.width = `${d.baseline / max * 100}%`;
    $('#value-bar-target').style.width = `${d.target / max * 100}%`;
    $('#value-workload-chart').setAttribute('aria-label', `Current preparation and review effort: ${number(d.baseline)} hours per month. Target: ${number(d.target)} hours per month.`);
    text('#value-scale-equation', `${number(state.sites)} sites × ${number(state.procedures)} procedures × ${number(Math.abs(state.current - state.target))} hours ${d.recovered < 0 ? 'added' : 'recovered'} = ${number(Math.abs(d.recovered))} hours / month`);
    text('#value-premium-saving', money(d.saving));
    text('#value-premium-current', money(state.premium));
    text('#value-premium-next', money(d.remaining));
    $('#value-premium-retained').style.width = `${100 - state.reduction}%`;
    $('#value-premium-reduced').style.width = `${state.reduction}%`;
    $('#value-premium-chart').setAttribute('aria-label', `${number(state.reduction)} percent hypothetical reduction. Scenario annual premium: ${money(d.remaining)}.`);
    text('#value-insurance-equation', `${money(state.premium)} annual premium × ${number(state.reduction)}% = ${money(d.saving)} / year`);
    if (announce) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => text('#value-live', active === 'uptime' ? `${money(d.exposure)} exposure over ${state.minutes} minutes.` : active === 'scale' ? `${number(Math.abs(d.recovered))} hours per month ${d.recovered < 0 ? 'of additional effort' : 'potentially recovered'}.` : `${money(d.saving)} hypothetical annual premium reduction.`), 250);
    }
  }
  root.addEventListener('click', event => {
    const tab = event.target.closest('[data-value-tab]');
    if (tab) selectTab(tab.dataset.valueTab, false);
    const reset = event.target.closest('[data-value-reset]');
    if (reset) {
      groups[reset.dataset.valueReset].forEach(key => { state[key] = defaults[key]; });
      update();
    }
  });
  root.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-value-tab]');
    if (!tab || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const keys = tabs.map(t => t.key), index = keys.indexOf(tab.dataset.valueTab);
    selectTab(keys[event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + keys.length) % keys.length], true);
  });
  root.addEventListener('input', event => {
    const el = event.target, key = el.dataset.valueInput;
    if (!key || el.value.trim() === '' || !Number.isFinite(Number(el.value))) return;
    const [min, max] = limits[key];
    const value = Number(el.value);
    if (value < min || value > max) { el.setAttribute('aria-invalid', 'true'); return; }
    el.removeAttribute('aria-invalid');
    state[key] = ['sites', 'procedures'].includes(key) ? Math.round(value) : value;
    update();
  });
  root.addEventListener('change', event => {
    const el = event.target, key = el.dataset.valueInput;
    if (!key) return;
    const raw = el.value.trim() === '' ? state[key] : Number(el.value);
    const [min, max] = limits[key];
    const value = Number.isFinite(raw) ? Math.max(min, Math.min(max, raw)) : state[key];
    state[key] = ['sites', 'procedures'].includes(key) ? Math.round(value) : value;
    el.value = state[key];
    el.removeAttribute('aria-invalid');
    update();
  });
  update(false);
})();
