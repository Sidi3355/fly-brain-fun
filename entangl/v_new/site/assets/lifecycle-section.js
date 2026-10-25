/* One persistent facility, six independent example scenarios. No live operational data. */
(function (scope) {
  'use strict';
  const moments = [
    { id:'launch', name:'Bring it live', era:'Day one', title:'Open with the confidence to operate.', copy:'Turn a finished building into a facility your team is ready to run.', tags:['Commissioning','Readiness','Preventive maintenance'], asset:'switchgear', features:[['Close the document gaps','AI organizes as-builts, manuals and test records, and identifies what is missing.'],['Clear the readiness gates','Prepare procedures and tasks, check the evidence, and resolve the decisions before go-live.'],['Build the maintenance plan','Create preventive schedules from your equipment records and manufacturer requirements.']] },
    { id:'operate', name:'Run the facility', era:'Every day', title:'Give every shift a clear plan.', copy:'Connect the procedure, the person and the part before work starts.', tags:['Procedures','iPad execution','Inventory'], asset:'ups-b', features:[['Generate and review procedures','Create site-specific MOPs, SOPs and EOPs with the source evidence close at hand.'],['Take the work to the floor','Use equipment maps and the iPad app to execute approved work and capture readings, photos and sign-off.'],['Stay ahead of maintenance','Coordinate preventive schedules, inventory, critical spares and vendor work.']] },
    { id:'incident', name:'Handle an incident', era:'When it matters', title:'Turn alarms into a coordinated response.', copy:'Know what changed, what it affects and what your team needs to do next.', tags:['AI telemetry','Alarm triage','Response'], asset:'crah-02', features:[['Find the issue behind the alarms','AI connects telemetry and related alarms to the equipment and the issue that needs attention.'],['Bring the procedure into the response','Attach the relevant response procedure, affected systems and required checks to the issue.'],['Coordinate from anywhere','Assign responders, execute on iPad and keep remote teams and affected customers informed.']] },
    { id:'people', name:'Transfer facility management', era:'The next operator', title:'Keep the knowledge when responsibility changes.', copy:'Give the incoming operator the context to run the same site with confidence.', tags:['Qualifications','Knowledge transfer','Training'], asset:'hall-1', features:[['Expose qualification gaps','See who is ready, which site inductions remain and where coverage needs attention.'],['Transfer the way the site works','Carry over procedures, missing work instructions, equipment history, open work and vendor knowledge.'],['Prepare the incoming team','Train new team members on site-specific procedures and verify readiness before responsibilities transfer.']] },
    { id:'grow', name:'Grow the business', era:'What comes next', title:'See the capacity behind the next opportunity.', copy:'Connect the operating reality of your facility to customer growth.', tags:['Capacity','Contract limits','Customer visibility'], asset:'hall-2', features:[['Understand the constraints','Connect demand, power, cooling and planned expansion to the capacity you can discuss with customers.'],['Grow existing accounts','Compare utilization with contract limits and identify the next upsell conversation.'],['Give customers a clear view','Share agreed operating information, maintenance updates and reports through customer access.']] },
    { id:'prove', name:'Prove & transfer', era:'Through every change', title:'Make your operating history easy to trust.', copy:'Give auditors, insurers and prospective owners evidence they can follow.', tags:['Assurance','Insurance','Acquisitions'], asset:'switchgear', features:[['Support assurance and audits','Connect completed work, approvals, incidents and source documents in a traceable record.'],['Prepare for insurance reviews','Bring the condition, maintenance and incident history of the facility into one evidence set.'],['Carry the history into an acquisition','Give a new owner the operating context, open obligations and knowledge behind the asset.']] }
  ];
  const assets = {
    'switchgear': { name: 'Main switchgear', kind: 'ELECTRICAL DISTRIBUTION', text: 'Incoming power, acceptance tests, switching procedures, and maintenance history.', records: 'SLD-001 · Test pack CX-014' },
    'ups-b': { name: 'UPS-B', kind: 'POWER SYSTEM', text: 'Connected to Hall 02 in this example. Procedures, scheduled work, and service coverage stay with the asset.', records: 'MOP-024 · Work order WO-041' },
    'ups-a': { name: 'UPS-A', kind: 'POWER SYSTEM', text: 'Power equipment serving Hall 01 in the illustrative facility model.', records: 'SLD-001 · Equipment manual' },
    'hall-1': { name: 'Hall 01', kind: 'DATA HALL', text: 'Equipment, shift responsibilities, and work records in one place.', records: '12 rack positions · Site induction' },
    'hall-2': { name: 'Hall 02', kind: 'CUSTOMER CAPACITY', text: 'Link the customer’s deployment to its supporting power, cooling, and contracted capacity.', records: 'Customer A · Capacity allocation' },
    'crah-02': { name: 'Cooling plant', kind: 'COOLING SYSTEM', text: 'Service history, sensor readings, alarms, and response procedures for the cooling equipment.', records: 'TEMP-H02 · MOP-031' },
    'expansion': { name: 'Proposed Hall 03', kind: 'EXPANSION CONCEPT', text: 'A possible extension to the same facility. Capacity and connections would require engineering review.', records: 'Concept only · Not commissioned' }
  };
  const initialState = () => ({ moment: 0, layer: 'overview', launch: false, work: 'ups', workDone: { ups: false, cooling: false }, incident: 1, handover: false, teamView: 'people', demand: 800, expansion: true, audience: 'operator', record: 0, selected: null });
  const num = n => Number(n).toLocaleString('en-GB');
  const metric = (value, label, id = '') => `<div class="life-metric"><strong${id ? ` id="${id}"` : ''}>${value}</strong><span>${label}</span></div>`;
  const row = (label, value, tone = '') => `<div class="life-row"><span>${label}</span><strong class="${tone}">${value}</strong></div>`;
  const primary = (action, label) => `<button class="life-primary" data-life-action="${action}"><span>${label}</span><span aria-hidden="true">→</span></button>`;
  const check = (title, detail, complete) => `<div class="life-check ${complete ? 'complete' : ''}"><span class="life-check-mark" aria-hidden="true">${complete ? '✓' : '○'}</span><div><strong>${title}</strong><span>${detail}</span></div></div>`;
  const recordItems = [
    { when: 'DAY 01', title: 'Accepted into service', text: 'Commissioning checks, approved procedures, and the named operating team.', asset: 'switchgear' },
    { when: 'MONTH 03', title: 'Maintenance completed', text: 'The approved work pack, technician sign-off, and captured readings.', asset: 'ups-b' },
    { when: 'MONTH 08', title: 'Incident reviewed', text: 'Alarm history, response decisions, restoration checks, and follow-up actions.', asset: 'crah-02' },
    { when: 'YEAR 02', title: 'Facility management transferred', text: 'Transferred responsibilities, qualifications, supplier coverage, and open work.', asset: 'hall-1' },
    { when: 'YEAR 04', title: 'Expansion proposed', text: 'The capacity case, customer requirements, engineering reviews, and open decisions.', asset: 'expansion' }
  ];
  const audienceData = {
    operator: ['Operator', 'The full operating record', 'Equipment history, work ownership, open risks, and the source behind each decision.', 'All site records'],
    customer: ['Customer', 'The view for Customer A', 'Relevant maintenance, service-impact notices, agreed procedures, and contract information.', 'Customer A scope'],
    auditor: ['Auditor', 'Evidence behind the control', 'Approved versions, signatures, timestamps, exceptions, and corrective actions.', 'Control evidence'],
    insurer: ['Insurer', 'A record of risk and action', 'Equipment condition, completed maintenance, risk recommendations, and incident evidence.', 'Risk evidence'],
    acquirer: ['Acquirer', 'Know what comes with the site', 'Asset condition, deferred work, service obligations, and the history behind the operating plan.', 'Due diligence scope']
  };
  function demandResult(value, expansion) {
    const demand = Math.max(400, Math.min(1400, Number(value) || 800));
    return { demand, percent: Math.round(demand / 10), over: Math.max(0, demand - 1000), remaining: Math.max(0, 1000 - demand), siteCapacity: expansion ? '4.0' : '2.4', status: demand > 1000 ? 'Above the current contract' : demand >= 900 ? 'A capacity conversation is due' : 'Within the example contract' };
  }
  function panelHTML(s) {
    if (s.moment === 0) return `<div class="life-metrics">${metric(s.launch ? '32 / 32' : '28 / 32', 'readiness checks')}${metric(s.launch ? 'Ready' : '1 open', 'acceptance gate')}</div><div class="life-checklist">${check('Electrical tests', 'Acceptance evidence attached', true)}${check('Cooling failover', s.launch ? 'Witness record accepted' : 'Four checks awaiting a witness', s.launch)}${check('Procedures & shift team', 'Approved pack · coverage confirmed', true)}</div><p class="life-insight">${s.launch ? 'The missing evidence is now part of this facility’s example record.' : 'The equipment is installed. The cooling acceptance record still needs attention.'}</p>${primary('launch', s.launch ? 'Replay readiness scenario' : 'Verify the cooling test')}`;
    if (s.moment === 1) {
      const cool = s.work === 'cooling', done = s.workDone[s.work];
      return `<div class="life-choice-label">FOLLOW A WORK ORDER</div><div class="life-segments" role="group" aria-label="Choose a maintenance task"><button data-life-work="ups" aria-pressed="${!cool}">UPS inspection</button><button data-life-work="cooling" aria-pressed="${cool}">Cooling service</button></div><div class="life-work-order"><div class="life-work-top"><span>${cool ? 'WO-042' : 'WO-041'}</span><span class="life-state-chip ${done ? '' : 'amber'}">${done ? 'Recorded' : 'Work in progress'}</span></div><h4>${cool ? 'Inspect the cooling plant' : 'Inspect UPS-B'}</h4>${row('Assigned to', cool ? 'Cooling specialist' : 'Qualified site technician')}${row('Approved procedure', cool ? 'MOP-031 / Rev B' : 'MOP-024 / Rev C')}${row('Required item', cool ? 'Filter kit · Reserved' : 'Test instrument · In date')}${row('Work evidence', done ? 'Readings & sign-off captured' : 'Awaiting completion', done ? 'lime' : '')}</div><p class="life-insight">${done ? 'The work record stays attached to the equipment for the next shift.' : 'The technician, open equipment, tools, and reserved part are visible in the facility.'}</p>${primary('work', done ? 'Replay this work order' : 'Complete example work order')}`;
    }
    if (s.moment === 2) {
      const active = s.incident === 1, resolved = s.incident === 2;
      const heights = active ? [21,22,23,21,27,33,44,58,74,88,92,89] : resolved ? [22,28,38,66,88,78,55,38,29,23,22,22] : [22,23,21,24,22,23,24,22,23,22,24,23];
      return `<div class="life-telemetry ${active ? 'fault' : ''}"><div><span>HALL 02 / SUPPLY TEMPERATURE</span><strong>${active ? '31.2' : resolved ? '22.6' : '22.4'}<small> °C</small></strong></div><div class="life-spark" role="img" aria-label="Illustrative temperature ${active ? 'rises during the cooling fault' : resolved ? 'returns toward baseline after recovery' : 'remains near baseline'}">${heights.map(h => `<i style="--level:${h}%"></i>`).join('')}</div><span class="life-chart-caption">${active ? 'Fault introduced in this scenario' : resolved ? 'Example recovery trend' : 'Example baseline · no active incident'}</span></div><div class="life-incident-facts">${row('Related signals', active ? '7 alarms → 1 issue' : resolved ? '7 alarms linked to the record' : 'No active issue')}${row('Affected area', active ? 'Hall 02 · Customer A' : resolved ? 'Hall 02 · Recovery verified' : 'Cooling plant ready')}${row('Response', active ? 'Review the linked cooling procedure' : resolved ? 'Review and follow-up recorded' : 'Waiting for a scenario')}</div>${primary('incident', active ? 'Run the recovery scenario' : resolved ? 'Replay the cooling incident' : 'Simulate a cooling fault')}`;
    }
    if (s.moment === 3) {
      const views = { people: ['People & qualifications', 'Incoming facility team', '2 site inductions', 'Qualifications and responsibilities follow the equipment and work.'], vendors: ['Vendors & coverage', 'Approved service partners', '1 escalation handover', 'Supplier scope, response coverage, and open work remain visible.'], parts: ['Parts & readiness', 'Critical spares inventory', '1 stock verification', 'Reserved parts and compatible replacements stay attached to the job.'] };
      const v = views[s.teamView];
      return `<div class="life-team-transfer"><div class="life-team-node"><span>01</span><strong>Outgoing team</strong></div><span class="life-transfer-arrow" aria-hidden="true">→</span><div class="life-team-node ${s.handover ? 'ready' : ''}"><span>02</span><strong>Incoming team</strong></div></div><div class="life-segments" role="group" aria-label="Explore handover responsibilities">${['people', 'vendors', 'parts'].map(id => `<button data-life-team="${id}" aria-pressed="${s.teamView === id}">${id[0].toUpperCase() + id.slice(1)}</button>`).join('')}</div><div class="life-handover-card"><span class="life-choice-label">${v[0]}</span><h4>${v[1]}</h4>${row('Open readiness items', s.handover ? 'None in this example' : v[2], s.handover ? 'lime' : 'amber')}${row('Site history', '248 records retained')}<p>${v[3]}</p></div>${primary('handover', s.handover ? 'Replay the team transition' : 'Complete example handover')}`;
    }
    if (s.moment === 4) {
      const d = demandResult(s.demand, s.expansion);
      return `<div class="life-demand"><label for="life-demand-input">CUSTOMER A / PEAK DEMAND</label><div class="life-demand-number"><output id="life-demand-value" for="life-demand-input">${num(d.demand)}</output><span>kW</span></div><input id="life-demand-input" type="range" min="400" max="1400" step="25" value="${d.demand}" aria-describedby="life-demand-help"><div class="life-range-labels"><span>400 kW</span><span>1,400 kW</span></div><p id="life-demand-help">Drag demand toward the 1,000 kW contract.</p><div class="life-contract-bar"><span id="life-contract-fill" style="width:${d.demand / 14}%"></span><i title="Contract limit"></i></div><div class="life-contract-label"><span>Contract limit</span><strong>1,000 kW</strong></div><div id="life-demand-status" class="life-demand-status ${d.over ? 'over' : ''}">${d.status}</div></div><div class="life-capacity-facts">${row('Contract utilization', `<span id="life-contract-percent">${d.percent}%</span>`)}${row('Facility capacity', `${d.siteCapacity} MW${s.expansion ? ' · proposed' : ' · example'}`)}</div>${primary('expansion', s.expansion ? 'Return to the current facility' : 'Preview a new data hall')}<p class="life-footnote">Expansion does not change the customer’s contract. Engineering and commercial review remain separate decisions.</p>`;
    }
    const a = audienceData[s.audience], r = recordItems[s.record];
    return `<label class="life-choice-label" for="life-audience">VIEW THE RECORD AS</label><select id="life-audience">${Object.entries(audienceData).map(([id, v]) => `<option value="${id}"${id === s.audience ? ' selected' : ''}>${v[0]}</option>`).join('')}</select><div class="life-audience-card"><span class="life-state-chip">${a[3]}</span><h4>${a[1]}</h4><p>${a[2]}</p></div><div class="life-record"><div><span id="life-record-when">${r.when}</span><strong id="life-record-title">${r.title}</strong></div><p id="life-record-text">${r.text}</p><label class="life-choice-label" for="life-record-input">SCRUB THROUGH THE SITE HISTORY</label><input id="life-record-input" type="range" min="0" max="4" step="1" value="${s.record}" aria-valuetext="${r.when}: ${r.title}"><div class="life-range-labels"><span>Day 01</span><span>Year 04</span></div></div><p class="life-footnote">Illustrative audience views. This demo contains no private customer records.</p>`;
  }
  function renderWorld() {
    return `<div class="life-world"><div class="life-world-top"><span>NORTH CAMPUS <b>/ DC-01</b></span><span class="life-world-state" id="life-world-state">Acceptance review</span></div><div class="life-model" id="life-model"><canvas class="life-canvas" tabindex="0" role="img" aria-label="Interactive three dimensional data center. Drag to rotate; arrow keys change the view, plus and minus zoom, Home resets, and Space pauses animation. Select equipment using the labelled markers."></canvas><canvas class="life-effects" aria-hidden="true"></canvas><div class="life-scene-story"><span>INSIDE THE FACILITY</span><p class="life-scene-caption">Commissioning crews are testing the facility.</p></div><div class="life-scene-facts" aria-label="What is happening in the model"></div><div class="life-pins">${[['switchgear', 'Switchgear'], ['ups-b', 'UPS-B'], ['hall-1', 'Hall 01'], ['hall-2', 'Hall 02'], ['crah-02', 'Cooling'], ['expansion', 'Hall 03 · proposed']].map(([id, name]) => `<button class="life-pin" data-life-asset="${id}" aria-label="Inspect ${name}" aria-pressed="false"><span class="life-pin-point"></span><span>${name}</span></button>`).join('')}</div><div class="life-model-loading">Preparing the facility…</div><div class="life-model-fallback" hidden>The 3D view is unavailable in this browser. You can still explore every scenario and equipment record below.</div><div class="life-model-hint">Drag to orbit · Click equipment</div><div class="life-view-controls" role="group" aria-label="Facility camera controls"><button data-life-camera="left" aria-label="Rotate left">↶</button><button data-life-camera="right" aria-label="Rotate right">↷</button><span></span><button data-life-camera="out" aria-label="Zoom out">−</button><button data-life-camera="in" aria-label="Zoom in">+</button><button data-life-camera="reset" aria-label="Reset camera">⌂</button><span></span><button data-life-camera="pause" aria-label="Pause scene animation" aria-pressed="false">Ⅱ</button></div></div><div class="life-world-bottom"><div class="life-layers" role="group" aria-label="Facility layers">${[['overview', 'Overview'], ['power', 'Power'], ['cooling', 'Cooling'], ['people', 'People'], ['evidence', 'Records']].map(([id, name]) => `<button data-life-layer="${id}" aria-pressed="${id === 'overview'}">${name}</button>`).join('')}</div><span class="life-model-number">MODEL 01 / CONTINUOUS</span></div><div class="life-asset-inspector" hidden aria-live="polite"><div><span id="life-asset-kind"></span><strong id="life-asset-name"></strong></div><p id="life-asset-text"></p><small id="life-asset-records"></small><button data-life-action="close-asset" aria-label="Close equipment details">×</button></div></div>`;
  }
  const featureSymbols = {
    document:'M7 3h7l4 4v14H4V3h3m7 0v5h4M8 12h6m-6 4h8',
    check:'M8 3H5v18h14V3h-3M9 2h6v4H9zM8 13l3 3 5-6',
    calendar:'M4 5h16v15H4zM8 2v6m8-6v6M4 10h16m-12 4h2m4 0h2m-8 3h2',
    tablet:'M6 2h12v20H6zM10 18h4M9 7h6m-6 4h6',
    inventory:'M4 8l8-5 8 5v10l-8 4-8-4V8m0 0 8 4 8-4m-8 4v10M8 5l8 5',
    signal:'M2 12h4l3-7 5 14 3-7h5',
    link:'M10 7l2-2a5 5 0 0 1 7 7l-2 2m-3 3-2 2a5 5 0 0 1-7-7l2-2m1 6 8-8',
    team:'M4 21v-3a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v3M6 7a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0m11-2a3 3 0 0 1 0 6m1 3a4 4 0 0 1 3 4v3',
    book:'M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3m3 4 3 1m-3 4 3 1m6-5 3-1m-3 6 3-1',
    capacity:'M4 20V11h4v9m4 0V7h4v13m4 0V3M2 20h20',
    customer:'M3 4h18v13H3zM8 21h8m-4-4v4M7 9h3m-3 4h3m4-4h3m-3 4h3',
    shield:'M12 2l8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3m-4 10 3 3 5-6',
    transfer:'M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4'
  };
  const featureIcon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${featureSymbols[name]||featureSymbols.document}"/></svg>`;
  const featureIconNames=[['document','check','calendar'],['document','tablet','inventory'],['signal','link','team'],['check','book','team'],['capacity','document','customer'],['shield','check','transfer']];
  const panelIndexHTML = index => `<span class="life-panel-chapter">0${index+1}</span><span>${moments[index].name}</span>`;
  function featureHTML(s) {
    return moments[s.moment].features.map(([title,copy],i)=>`<li><span class="life-feature-icon">${featureIcon(featureIconNames[s.moment][i])}</span><div><strong>${title}</strong><p>${copy}</p></div></li>`).join('');
  }
  const demoStatus = (label,ready=false) => `<span class="life-demo-status ${ready?'is-ready':''}"><i aria-hidden="true"></i>${label}</span>`;
  function heroPanelHTML(s) {
    if(s.moment===0) return `<div class="life-demo-line"><div><span class="life-demo-label">Readiness gates</span>${demoStatus(s.launch?'Ready to operate':'4 checks remaining',s.launch)}</div><strong class="life-demo-metric">${s.launch?'32':'28'}<small> / 32</small></strong></div><div class="life-readiness-track" role="progressbar" aria-label="Readiness gates completed" aria-valuemin="0" aria-valuemax="32" aria-valuenow="${s.launch?32:28}">${Array.from({length:32},(_,i)=>`<i class="${s.launch||i<28?'complete':'pending'}"></i>`).join('')}</div><p class="life-demo-note">${s.launch?'Cooling evidence accepted. The first racks are live.':'Cooling acceptance is awaiting its witness record.'}</p>${primary('launch',s.launch?'Replay commissioning':'Verify the cooling test')}`;
    if(s.moment===1) {
      const done=s.workDone[s.work],cool=s.work==='cooling';
      return `<div class="life-segments" role="group" aria-label="Choose a maintenance task"><button data-life-work="ups" aria-pressed="${!cool}">UPS inspection</button><button data-life-work="cooling" aria-pressed="${cool}">Cooling service</button></div><div class="life-demo-work"><span class="life-demo-work-icon">${featureIcon('check')}</span><div><strong>${cool?'Cooling plant':'UPS-B'} <span>· ${cool?'WO-042':'WO-041'}</span></strong><span>${cool?'MOP-031 / Rev B':'MOP-024 / Rev C'} · Approved procedure</span></div></div>${demoStatus(done?'Work recorded':'Technician on site',done)}<p class="life-demo-note">${done?'Equipment restored. Readings and sign-off are on record.':'The procedure, technician and reserved part are ready.'}</p>${primary('work',done?'Replay this work order':'Complete the work order')}`;
    }
    if(s.moment===2) {
      const active=s.incident===1;
      return `<div class="life-response-chain"><div><strong>7</strong><span>Related alarms</span></div><i aria-hidden="true">→</i><div><strong>1</strong><span>Actionable issue</span></div><i aria-hidden="true">→</i><div class="life-response-procedure">${featureIcon('check')}<span>Procedure<br>attached</span></div></div><div class="life-demo-temperature"><span>Hall 02</span>${demoStatus(active?'Responding':'Recovered',!active)}<strong>${active?'31.2':'22.6'}<small> °C</small></strong></div>${primary('incident',active?'Run the recovery scenario':'Replay the cooling incident')}`;
    }
    if(s.moment===3) return `<div class="life-segments" role="group" aria-label="Explore management transfer">${[['people','Team'],['vendors','Vendors'],['parts','Parts']].map(([id,label])=>`<button data-life-team="${id}" aria-pressed="${s.teamView===id}">${label}</button>`).join('')}</div><div class="life-demo-transfer"><span>Outgoing operator</span><i aria-hidden="true">→</i><strong>Incoming operator</strong></div><div class="life-demo-line"><span class="life-demo-label">Site records retained</span><strong>248</strong></div><p class="life-demo-note">${s.handover?'The incoming team is on duty. The site history stays.':s.teamView==='vendors'?'Service scope, contacts and escalation paths move with the site.':s.teamView==='parts'?'Critical spares and reserved parts stay connected to the work.':'Qualifications, procedures and open work carry into the handover.'}</p>${primary('handover',s.handover?'Replay management transfer':'Complete management transfer')}`;
    if(s.moment===4) {
      const d=demandResult(s.demand,s.expansion);
      return `<div class="life-demo-line"><label class="life-demo-label" for="life-demand-input">Customer A demand</label><strong class="life-demo-metric"><output id="life-demand-value" for="life-demand-input">${num(d.demand)}</output><small> kW</small></strong></div><input id="life-demand-input" type="range" min="400" max="1400" step="25" value="${d.demand}" aria-label="Customer demand in kilowatts"><div class="life-contract-bar"><span id="life-contract-fill" style="width:${d.demand/14}%"></span><i title="Contract limit"></i></div><div class="life-demo-line life-demo-small"><span>1,000 kW contract</span><strong id="life-contract-percent">${d.percent}%</strong></div><p id="life-demand-status" class="life-demand-status ${d.over?'over':''}">${d.status}</p>${primary('expansion',s.expansion?'See the current facility':'Preview a new data hall')}`;
    }
    const r=recordItems[s.record];
    return `<div class="life-demo-audience"><label for="life-audience">View as</label><select id="life-audience">${Object.entries(audienceData).map(([id,a])=>`<option value="${id}"${id===s.audience?' selected':''}>${a[0]}</option>`).join('')}</select></div><div class="life-history-summary"><span class="life-history-symbol">${featureIcon('document')}</span><div><span id="life-record-when">${r.when}</span><strong id="life-record-title">${r.title}</strong><p id="life-record-text">${r.text}</p></div></div><label class="life-sr-only" for="life-record-input">Explore the facility history</label><input id="life-record-input" type="range" min="0" max="4" step="1" value="${s.record}" aria-valuetext="${r.when}: ${r.title}"><div class="life-range-labels"><span>Day 01</span><span>Year 04</span></div>`;
  }
  function renderLifecycleHero() {
    const s=initialState(),m=moments[0];
    return `<section id="facility-lifecycle" class="life-section life-hero" data-life-presentation="hero" aria-labelledby="life-title"><div class="life-hero-sticky"><div class="life-hero-inner"><div class="life-hero-heading"><p class="life-eyebrow">AI FOR DATA CENTER ENGINEERING AND OPERATIONS</p><h1 id="life-title">Your site. <em>Understood.</em></h1><p>From bringing it live to everything that comes next.</p></div><div class="life-world-anchor">${renderWorld()}</div><div class="life-tabs life-stage-nav" role="tablist" aria-label="Six stages of the facility lifecycle" aria-orientation="horizontal"><svg class="life-stage-track" aria-hidden="true"><path class="life-stage-track-base"></path><path class="life-stage-track-active"></path></svg>${moments.map((m,i)=>`<button id="life-tab-${m.id}" class="life-stage-button" style="left:${((i+.5)/6*100).toFixed(3)}%;top:calc(100% - 104px)" role="tab" data-life-moment="${i}" aria-selected="${i===0}" aria-controls="life-panel" aria-label="Stage ${i+1}: ${m.name}" tabindex="${i===0?0:-1}"><span class="life-stage-number">0${i+1}</span><span class="life-stage-name">${m.name}</span><span class="life-stage-arrow" aria-hidden="true">→</span><span class="life-stage-tooltip" aria-hidden="true">${m.name}</span></button>`).join('')}</div><div class="life-mobile-stage-name">${m.name}</div><div class="life-panel life-hero-panel" id="life-panel" role="tabpanel" aria-labelledby="life-tab-launch" tabindex="0"><div class="life-hero-copy"><div class="life-panel-heading"><span class="life-panel-index" id="life-panel-index">${panelIndexHTML(0)}</span><h2 id="life-moment-title">${m.title}</h2><p id="life-moment-copy">${m.copy}</p></div><ul class="life-stage-features" id="life-stage-features">${featureHTML(s)}</ul><div class="life-hero-demo"><div class="life-demo-heading"><span class="life-demo-eyebrow">In the facility</span><span class="life-demo-interactive"><i aria-hidden="true"></i>Interactive</span></div><div id="life-interaction">${heroPanelHTML(s)}</div></div><div class="life-topic-tags life-sr-only" id="life-topic-tags">${m.tags.map(t=>`<span>${t}</span>`).join('')}</div></div></div><div class="life-hero-scroll-cue"><span class="life-scroll-mark" aria-hidden="true">↓</span><span>Scroll to explore the life of the facility</span></div><div class="life-journey-footer"><span id="life-counter">01 <i>/ 06</i></span><span class="life-journey-progress"><i></i></span><a href="#outcomes">Continue to operating pressures <span aria-hidden="true">↓</span></a></div><span class="life-hero-disclosure">Illustrative facility and workflows</span></div></div><noscript><div class="life-hero-noscript">${moments.map((m,i)=>`<article><h2>${i+1}. ${m.name}</h2><p>${m.copy}</p><ul>${m.features.map(([title,copy])=>`<li><strong>${title}</strong> ${copy}</li>`).join('')}</ul></article>`).join('')}</div></noscript></section>`;
  }
  function renderLifecycleSection(options = {}) {
    if (options.hero) return renderLifecycleHero();
    const s = initialState(), m = moments[0];
    return `<section id="facility-lifecycle" class="life-section" aria-labelledby="life-title"><div class="life-wrap"><div class="life-heading"><div><span class="life-eyebrow">THE LIFE OF A DATA CENTER</span><h2 id="life-title">One facility.<br><em>A lifetime of decisions.</em></h2></div><div class="life-intro"><p>Walk through six moments.<br>Watch the people, equipment, and work change.</p><span>Interactive concept · Illustrative data</span></div></div><div class="life-tabs" role="tablist" aria-label="Six moments in a facility’s life">${moments.map((m, i) => `<button id="life-tab-${m.id}" role="tab" aria-selected="${i === 0}" aria-controls="life-panel" tabindex="${i === 0 ? '0' : '-1'}" data-life-moment="${i}"><span class="life-tab-top"><span>0${i + 1}</span><span class="life-tab-line"></span></span><strong>${m.name}</strong><small>${m.era}</small></button>`).join('')}</div><div class="life-explorer">${renderWorld()}<div class="life-panel" id="life-panel" role="tabpanel" aria-labelledby="life-tab-launch" tabindex="0"><div class="life-panel-heading"><span class="life-panel-index" id="life-panel-index">01 / ${m.era.toUpperCase()}</span><h3 id="life-moment-title">${m.title}</h3><p id="life-moment-copy">${m.copy}</p></div><div id="life-interaction">${panelHTML(s)}</div><div class="life-topic-tags" id="life-topic-tags">${m.tags.map(t => `<span>${t}</span>`).join('')}</div></div></div><div class="life-footer"><p><span class="life-continuity-mark" aria-hidden="true">∞</span> Same facility. Connected equipment, people, work, and evidence.</p><div><button data-life-action="previous" aria-label="Previous lifecycle moment">←</button><span id="life-counter">01 <i>/ 06</i></span><button data-life-action="next" aria-label="Next lifecycle moment">→</button></div></div><p class="life-disclosure">A demonstration of Entangl’s lifecycle vision. All scenarios and values are illustrative; product scope is agreed for each deployment.</p></div></section>`;
  }
  function init() {
    const root = document.getElementById('facility-lifecycle');
    if (!root) return;
    const $ = sel => root.querySelector(sel), $$ = sel => [...root.querySelectorAll(sel)];
    const state = initialState();
    const hero = root.dataset.lifePresentation === 'hero';
    let model, journey;
    const announce = document.createElement('span'); announce.className = 'life-sr-only'; announce.setAttribute('role', 'status'); root.appendChild(announce);
    const viewState = () => ({ ...state, presentation: hero ? 'hero' : 'section', focusAsset: state.selected || (state.moment === 1 ? (state.work === 'ups' ? 'ups-b' : 'crah-02') : state.moment === 5 ? recordItems[state.record].asset : moments[state.moment].asset) });
    function updateWorld() {
      const labels = [state.launch ? 'Acceptance recorded' : 'Acceptance review', state.workDone[state.work] ? 'Work completed' : 'Maintenance in progress', state.incident === 1 ? 'Cooling incident · Hall 02' : state.incident === 2 ? 'Recovery recorded' : 'Normal operating scenario', state.handover ? 'Management transferred' : 'Management transfer', state.expansion ? 'Expansion concept' : 'Customer demand', audienceData[state.audience][0] + ' perspective'];
      { const ws = $('#life-world-state'); if (ws.textContent !== labels[state.moment]) { ws.textContent = labels[state.moment]; ws.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 320 }); } }
      root.dataset.moment = moments[state.moment].id;
      root.dataset.incident = String(state.incident === 1 && state.moment === 2);
      model?.update(viewState());
    }
    function renderPanel(focusAction) {
      $('#life-interaction').innerHTML = hero ? heroPanelHTML(state) : panelHTML(state);
      if (focusAction) $(`[data-life-action="${focusAction}"]`)?.focus({ preventScroll: true });
      updateWorld();
    }
    // A stage change hands over instead of cutting: the outgoing content lifts away while the new
    // content settles in from the direction of travel, heading first, then the list, then the card.
    function handOver(container, update, dir) {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
      const parent = container?.parentElement;
      if (still || !dir || !parent || !container.getClientRects().length || !container.animate) { update(); return; }
      parent.querySelectorAll(':scope > .life-ghost').forEach(g => g.remove());
      [...container.children].forEach(el => el.getAnimations().forEach(a => a.cancel()));
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      const c = container.getBoundingClientRect(), pr = parent.getBoundingClientRect();
      const ghost = container.cloneNode(true);
      ghost.removeAttribute('id'); ghost.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      ghost.classList.add('life-ghost'); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
      Object.assign(ghost.style, { position: 'absolute', margin: '0', pointerEvents: 'none', left: (c.left - pr.left - parent.clientLeft + parent.scrollLeft) + 'px', top: (c.top - pr.top - parent.clientTop + parent.scrollTop) + 'px', width: c.width + 'px' });
      update();
      parent.append(ghost);
      ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${-12 * dir}px)` }], { duration: 160, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove());
      [...container.children].forEach((el, i) => el.animate([{ opacity: 0, transform: `translateY(${16 * dir}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 130 + i * 55, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
    }
    function setMoment(index, focusTab = false) {
      const previous = state.moment;
      state.moment = (Number(index) + moments.length) % moments.length;
      const m = moments[state.moment], dir = state.moment === previous ? 0 : state.moment > previous ? 1 : -1;
      $$('[data-life-moment]').forEach((b, i) => { b.setAttribute('aria-selected', String(i === state.moment)); b.tabIndex = i === state.moment ? 0 : -1; });
      $('#life-panel').setAttribute('aria-labelledby', 'life-tab-' + m.id);
      $('#life-counter').innerHTML = `<b>0${state.moment + 1}</b> <i>/ 06</i>`;
      if (hero) { const name = $('.life-mobile-stage-name'); if (name.textContent !== m.name) { name.textContent = m.name; if (dir) name.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 320 }); } }
      handOver(hero ? $('.life-hero-copy') : $('#life-panel'), () => {
        if (hero) $('#life-panel-index').innerHTML = panelIndexHTML(state.moment);
        else $('#life-panel-index').textContent = `0${state.moment + 1} / ${m.era.toUpperCase()}`;
        $('#life-moment-title').textContent = m.title;
        $('#life-moment-copy').textContent = m.copy;
        $('#life-topic-tags').innerHTML = m.tags.map(t => `<span>${t}</span>`).join('');
        if (hero) $('#life-stage-features').innerHTML = featureHTML(state);
        renderPanel();
      }, dir);
      if (focusTab) $(`#life-tab-${m.id}`).focus({ preventScroll: true });
      announce.textContent = `Moment ${state.moment + 1}: ${m.name}. ${m.copy}`;
    }
    function selectAsset(id) {
      if (!assets[id]) return;
      const a = assets[id]; state.selected = id;
      $('#life-asset-kind').textContent = a.kind; $('#life-asset-name').textContent = a.name;
      $('#life-asset-text').textContent = a.text; $('#life-asset-records').textContent = a.records;
      $('.life-asset-inspector').hidden = false;
      $$('[data-life-asset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lifeAsset === id)));
      updateWorld();
    }
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lifeMoment !== undefined) { if (journey) journey.select(Number(b.dataset.lifeMoment)); else setMoment(b.dataset.lifeMoment); }
      if (b.dataset.lifeAsset) selectAsset(b.dataset.lifeAsset);
      if (b.dataset.lifeLayer) { state.layer = b.dataset.lifeLayer; $$('[data-life-layer]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); updateWorld(); }
      if (b.dataset.lifeCamera) model?.camera(b.dataset.lifeCamera);
      if (b.dataset.lifeWork) { state.work = b.dataset.lifeWork; state.selected = null; $('.life-asset-inspector').hidden = true; renderPanel(); $(`[data-life-work="${state.work}"]`).focus({ preventScroll: true }); }
      if (b.dataset.lifeTeam) { state.teamView = b.dataset.lifeTeam; renderPanel(); $(`[data-life-team="${state.teamView}"]`).focus({ preventScroll: true }); }
      const action = b.dataset.lifeAction;
      if (action === 'next') setMoment(state.moment + 1);
      else if (action === 'previous') setMoment(state.moment - 1);
      else if (action === 'launch') { state.launch = !state.launch; renderPanel(action); announce.textContent = state.launch ? 'Example cooling acceptance verified. All 32 readiness checks recorded.' : 'Readiness example reset.'; }
      else if (action === 'work') { state.workDone[state.work] = !state.workDone[state.work]; renderPanel(action); announce.textContent = state.workDone[state.work] ? 'Example work completed. Readings and sign-off are attached to the equipment.' : 'Example work order reset.'; }
      else if (action === 'incident') { state.incident = state.incident === 1 ? 2 : 1; state.selected = null; $('.life-asset-inspector').hidden = true; renderPanel(action); announce.textContent = state.incident === 1 ? 'Illustrative cooling fault active. Seven alarms linked to one issue affecting Hall 02 and Customer A.' : state.incident === 2 ? 'Example recovery recorded. Cooling readings return toward baseline.' : 'Incident example reset.'; }
      else if (action === 'handover') { state.handover = !state.handover; renderPanel(action); announce.textContent = state.handover ? 'Example handover complete. Site history retained.' : 'Handover example reset.'; }
      else if (action === 'expansion') { state.expansion = !state.expansion; renderPanel(action); announce.textContent = state.expansion ? 'Proposed Hall 03 shown. Existing customer contract remains unchanged.' : 'Returned to the current facility.'; }
      else if (action === 'close-asset') { const old = state.selected; state.selected = null; $('.life-asset-inspector').hidden = true; $$('[data-life-asset]').forEach(x => x.setAttribute('aria-pressed', 'false')); updateWorld(); $(`[data-life-asset="${old}"]`)?.focus({ preventScroll: true }); }
    });
    $('.life-tabs').addEventListener('keydown', e => {
      const map = { ArrowRight: state.moment + 1, ArrowDown: state.moment + 1, ArrowLeft: state.moment - 1, ArrowUp: state.moment - 1, Home: 0, End: 5 };
      if (map[e.key] !== undefined) { e.preventDefault(); if (journey) journey.select((map[e.key]+6)%6,true); else setMoment(map[e.key], true); }
    });
    root.addEventListener('input', e => {
      if (e.target.id === 'life-demand-input') {
        const d = demandResult(e.target.value, state.expansion); state.demand = d.demand;
        $('#life-demand-value').textContent = num(d.demand); $('#life-contract-percent').textContent = d.percent + '%';
        $('#life-contract-fill').style.width = d.demand / 14 + '%';
        $('#life-demand-status').textContent = d.status; $('#life-demand-status').classList.toggle('over', d.over > 0);
        e.target.setAttribute('aria-valuetext', `${d.demand} kilowatts; ${d.percent} percent of the contract`); updateWorld();
      }
      if (e.target.id === 'life-record-input') {
        state.record = Math.max(0, Math.min(4, Number(e.target.value))); const r = recordItems[state.record];
        $('#life-record-when').textContent = r.when; $('#life-record-title').textContent = r.title; $('#life-record-text').textContent = r.text;
        e.target.setAttribute('aria-valuetext', `${r.when}: ${r.title}`); updateWorld();
      }
    });
    root.addEventListener('change', e => { if (e.target.id === 'life-audience' && audienceData[e.target.value]) { state.audience = e.target.value; renderPanel(); $('#life-audience').focus({ preventScroll: true }); announce.textContent = audienceData[state.audience][1]; } });
    try { model = scope.createEntanglLifecycleModel($('#life-model'), selectAsset); }
    catch (_) { $('.life-model-loading').hidden = true; $('.life-model-fallback').hidden = false; $('.life-pins').classList.add('life-pins-fallback'); }
    updateWorld();
    if (hero && scope.createEntanglLifecycleJourney) journey = scope.createEntanglLifecycleJourney(root, { setMoment, getMoment: () => state.moment });
    scope.EntanglLifecycle = Object.freeze({ snapshot: () => ({ moment: moments[state.moment].id, layer: state.layer, scenario: JSON.parse(JSON.stringify(state)), model: model?.snapshot(), journey: journey?.snapshot() }), moments: moments.map(m => m.name) });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { renderLifecycleSection, initialState, demandResult, moments, panelHTML, heroPanelHTML, featureHTML, renderLifecycleHero, recordItems, audienceData };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
