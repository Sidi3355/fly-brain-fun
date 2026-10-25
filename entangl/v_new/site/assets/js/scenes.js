/* Platform proofs: one scripted example per workflow, drawn in the language of the set.
   Shared by the build (for the first, static render) and the browser (for every change).
   All facility records, tasks, measurements and decisions are fictional. */
(function (root) {
  'use strict';
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = n => `<svg class="i" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#i-${n}"></use></svg>`;
  const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const clone = x => JSON.parse(JSON.stringify(x));
  const STATUS = { core: 'Core', scoped: 'Scoped', planned: 'Planned' };
  const chip = s => `<span class="chip chip-${s}"><i aria-hidden="true"></i>${STATUS[s]}</span>`;
  const seg = (label, attr, items, current, cls = '') => `<div class="seg seg-sm ${cls}" role="group" aria-label="${esc(label)}">${items.map(([k, t]) => `<button type="button" ${attr}="${esc(k)}" aria-pressed="${String(k) === String(current)}">${t}</button>`).join('')}</div>`;
  const act = (k, t, disabled = false, cls = 'lf-act') => `<button type="button" class="${cls}" data-pp-action="${k}"${disabled ? ' disabled' : ''}><span>${t}</span>${icon('arrow')}</button>`;
  const check = (k, label, on) => `<label class="tick"><input type="checkbox" data-pp-check="${k}"${on ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  const hint = (title, copy, tone = '') => `<div class="hint ${tone}">${icon(tone === 'warn' ? 'bell' : 'check')}<div><b>${esc(title)}</b><p>${esc(copy)}</p></div></div>`;
  const link = (href, t) => `<a class="tlink" href="${esc(href)}"><span>${esc(t)}</span>${icon('arrow')}</a>`;
  const stamp = (t, tone = '') => `<span class="stamp flat ${tone}">${esc(t)}</span>`;

  const MODULES = [
    ['site-model', 'grid', 'Site model', 'The equipment and the sources behind the work.', 'core'],
    ['procedures', 'file', 'Write procedures', 'A draft grounded in the site and task.', 'core'],
    ['review', 'eye', 'Review & approvals', 'Findings, evidence, and an engineer’s decision.', 'core'],
    ['fieldwork', 'tablet', 'Fieldwork & training', 'The procedure and evidence at the point of work.', 'scoped'],
    ['telemetry', 'wave', 'AI telemetry', 'Signals connected to a useful investigation.', 'scoped'],
    ['maintenance', 'clock', 'Maintenance planning', 'Tasks, dependencies, and work readiness.', 'planned'],
    ['visibility', 'shield', 'Customer & audit visibility', 'The relevant record for the right audience.', 'scoped'],
    ['portfolio', 'capacity', 'Portfolio performance', 'Attention and opportunity across sites.', 'planned'],
  ];
  const route = k => '/platform/' + k + '/';

  const DEFAULTS = {
    overview: { path: 'planned', node: 'review' },
    procedures: { type: 'mop', site: 'north', template: 'operations', sources: { drawing: true, manual: true, rules: true } },
    review: { finding: 0, decisions: ['', '', ''], reasons: ['', '', ''], accepting: false, reason: '', submitted: false },
    'site-model': { asset: 'ups-b', evidence: 'drawing', revised: false },
    fieldwork: { step: 0, equipment: '', observation: '', witness: false, mode: 'practice', done: false },
    telemetry: { time: 3, grouped: false, stale: false, response: false },
    visibility: { audience: 'operator', point: 2 },
    maintenance: { asset: 'ups-b', days: { 'ups-a': 0, 'ups-b': 0, cooling: 2 }, parts: false, vendor: true, prepared: false },
    portfolio: { metric: 'review', site: 'north', demands: { north: 465, east: 340, south: 410, west: null } },
  };

  /* ── Overview: one site context, eight workflows ── */
  const PATHS = {
    planned: { name: 'Planned maintenance', nodes: ['site-model', 'procedures', 'review', 'fieldwork', 'maintenance', 'visibility'], record: 'MOP-024 / UPS-B inspection', decision: 'What must be checked before the work starts?', trace: ['SLD-001 · Rev C', 'MOP-024 · Draft', 'Engineer review · Open'] },
    incident: { name: 'An incident', nodes: ['site-model', 'telemetry', 'procedures', 'fieldwork', 'visibility', 'portfolio'], record: 'INC-017 / Hall 02 cooling', decision: 'Which signals belong together, and who owns the response?', trace: ['CRAH-02 · Signals', 'INC-017 · Investigation', 'EOP-003 · Response reference'] },
    customer: { name: 'A customer review', nodes: ['site-model', 'review', 'fieldwork', 'visibility', 'portfolio'], record: 'CUSTOMER A / Hall 02', decision: 'What has been reviewed, approved, and shared?', trace: ['Procedure · Rev 4', 'Approval · Recorded', 'Customer update · Published'] },
  };
  function overview(s) {
    const p = PATHS[s.path], sel = MODULES.find(m => m[0] === s.node);
    const node = ([k, ic, n, , st], i) => `<button type="button" class="ov-node ${p.nodes.includes(k) ? 'is-on' : ''} ${k === s.node ? 'is-sel' : ''}" data-status="${st}" data-pp-node="${k}" aria-pressed="${k === s.node}"><span class="ov-n">${icon(ic)}<small class="code">0${i + 1}</small></span><b>${esc(n)}</b><span class="ov-in">${p.nodes.includes(k) ? 'In this workflow' : 'Explore the connection'}</span>${chip(st)}</button>`;
    return `${seg('Choose an operating situation', 'data-pp-path', Object.entries(PATHS).map(([k, v]) => [k, esc(v.name)]), s.path, 'seg-tabs')}
    <div class="sc-two">
      <div class="ov">
        <div class="ov-row">${MODULES.slice(0, 4).map((m, i) => node(m, i)).join('')}</div>
        <div class="ov-core"><span class="code">NORTH CAMPUS / DC-01</span><b>One shared site context</b><span class="code ov-count">08 workflows</span></div>
        <div class="ov-row ov-low">${MODULES.slice(4).map((m, i) => node(m, i + 4)).join('')}</div>
      </div>
      <aside class="sc-panel"><p class="label">Follow the connection</p><h3 class="sc-h">${esc(sel[2])}</h3><p>${esc(sel[3])}</p>
        <p class="sc-ref">${icon('file')}<span class="code">${esc(p.record)}</span></p>
        <h4 class="sc-q">${esc(p.decision)}</h4>
        <ol class="sc-trail">${p.trace.map(t => `<li class="code">${esc(t)}</li>`).join('')}</ol>
        ${link(route(s.node), 'Explore ' + sel[2].toLowerCase())}
        <p class="fine">This example connects the proposed workflow. Module availability is defined in the scope below.</p></aside>
    </div>`;
  }

  /* ── Site model: one asset and what it touches ── */
  const ASSETS = {
    'ups-a': { name: 'UPS-A', area: 'Hall 01', pdu: 'PDU-A', line: 'a', source: 'SLD-001 / Rev C / Power path A' },
    'ups-b': { name: 'UPS-B', area: 'Hall 02', pdu: 'PDU-B', line: 'b', source: 'SLD-001 / Rev C / Power path B' },
    cooling: { name: 'CRAH-02', area: 'Hall 02', pdu: 'Cooling service', line: 'cooling', source: 'MECH-002 / Rev B / Cooling service' },
  };
  const sldMap = (line, revised) => `<svg class="sld" viewBox="0 0 640 300" aria-hidden="true">
    <g class="sld-route" data-route="a"><path class="sld-hl" d="M150 60H500"/><path class="sld-wire" d="M150 60H250M370 60H480"/><rect x="20" y="32" width="130" height="56"/><text x="85" y="66">UPS-A</text><rect x="250" y="32" width="120" height="56"/><text x="310" y="66">PDU-A</text><rect x="480" y="32" width="140" height="56"/><text x="550" y="66">HALL 01</text></g>
    <g class="sld-route" data-route="b"><path class="sld-hl" d="M150 150H500"/><path class="sld-wire" d="M150 150H250M370 150H480"/><rect x="20" y="122" width="130" height="56"/><text x="85" y="156">UPS-B</text><rect x="250" y="122" width="120" height="56"/><text x="310" y="156">PDU-B</text><rect x="480" y="122" width="140" height="56"/><text x="550" y="156">HALL 02</text></g>
    <g class="sld-route" data-route="cooling"><path class="sld-hl" d="M150 240H440Q460 240 460 220V196Q460 178 480 172"/><path class="sld-wire sld-dash" d="M150 240H440Q460 240 460 220V196Q460 178 480 172"/><rect x="20" y="212" width="130" height="56"/><text x="85" y="246">CRAH-02</text><text class="sld-note" x="300" y="262">COOLING SERVICE</text></g>
  </svg>`;
  function siteModel(s) {
    const a = ASSETS[s.asset];
    const ev = {
      drawing: ['Documented relationship', `${a.name} ${s.asset === 'cooling' ? 'serves' : 'connects through ' + a.pdu + ' to'} ${a.area}. The drawing does not verify the present operating state.`, a.source],
      field: ['Field observation', `An example field note confirms the label “${a.name}.” The note is one observation, not a continuous measurement.`, 'FIELD-NOTE-018 / Example observation / 09:10'],
      telemetry: ['Integration not connected', 'No sensor feed is connected to this website example. Live state would require verified point mapping and a current timestamp.', 'No current measurement available'],
    }[s.evidence];
    return `<div class="sc-two">
      <div class="sm">
        <div class="sm-sheet${s.revised ? ' is-revised' : ''}"><p class="sm-head"><span class="label">Simplified site relationships</span><span class="sm-rev code">${s.revised ? 'Incoming Rev D / unvalidated' : 'Revision C / example'}</span></p>
          <div class="trace" data-asset="${a.line}" data-traced="true" role="img" aria-label="UPS-A connects through PDU-A to Hall 01. UPS-B connects through PDU-B to Hall 02. CRAH-02 serves Hall 02. ${esc(a.name)} is selected.">${sldMap(a.line, s.revised)}</div>
          ${s.revised ? '<span class="sm-cloud" aria-hidden="true"></span><span class="sm-delta" aria-hidden="true">D</span>' : ''}</div>
        ${seg('Trace an equipment connection', 'data-pp-asset', Object.entries(ASSETS).map(([k, v]) => [k, esc(v.name)]), s.asset)}
        <div class="sc-row">${check('drawing-revised', 'Introduce a new drawing revision', s.revised)}</div>
        ${s.revised ? hint('2 procedure references need another look', 'MOP-024 and EOP-003 cite Rev C. The diagram retains that revision until the new drawing is validated.', 'warn') : hint('The source stays connected to the asset', `${a.name} → ${a.pdu} → ${a.area}. Select a different asset to follow its documented relationship.`)}
      </div>
      <aside class="sc-panel"><p class="label">Equipment context</p><h3 class="sc-h">${esc(a.name)}</h3><p>${esc(a.area)} / ${s.asset === 'cooling' ? 'Cooling' : 'Electrical distribution'}</p>
        <p class="label sc-gap">What does this source establish?</p>
        ${seg('Choose evidence provenance', 'data-pp-evidence', [['drawing', 'Drawing'], ['field', 'Field check'], ['telemetry', 'Telemetry']], s.evidence)}
        <div class="prov prov-${s.evidence}"><p class="label">${esc(ev[0])}</p><p>${esc(ev[1])}</p><p class="code">${esc(ev[2])}</p></div>
        <p class="sc-ref">${icon('file')}<span>Linked work <b class="code">MOP-024 · EOP-003</b></span></p>
        <p class="fine">A drawing records an arrangement; a field check records an observation; telemetry records a measurement with a timestamp. Select a source to see what it can, and cannot, establish.</p></aside>
    </div>`;
  }

  /* ── Write procedures: change the brief, watch the draft ── */
  const TYPES = {
    mop: { name: 'MOP', task: 'Planned UPS inspection', parts: ['Scope & equipment', 'Prerequisites & authorizations', 'Inspection record', 'Closeout & recovery references'] },
    sop: { name: 'SOP', task: 'Shift handover', parts: ['Shift & responsibilities', 'Current site conditions', 'Open work & exceptions', 'Incoming-team acknowledgement'] },
    eop: { name: 'EOP', task: 'Cooling alert response', parts: ['Trigger & affected systems', 'Initial verification', 'Response coordination', 'Recovery evidence & escalation'] },
  };
  function procedures(s) {
    const t = TYPES[s.type], north = s.site === 'north', asset = s.type === 'sop' ? 'Site operations' : s.type === 'eop' ? (north ? 'CRAH-02' : 'CRAH-07') : (north ? 'UPS-B' : 'UPS-04');
    const available = Object.values(s.sources).filter(Boolean).length;
    const missing = Object.entries(s.sources).filter(([, v]) => !v).map(([k]) => ({ drawing: 'site drawing', manual: 'equipment manual', rules: 'site rules' }[k]));
    const text = [
      `The task is scoped to ${asset} at ${north ? 'North Campus / DC-01' : 'South Campus / DC-04'}. Confirm the equipment and the boundary with the site team.`,
      s.sources.rules ? `${s.template === 'vendor' ? 'Vendor induction, named site contact, and approved work window' : 'Site responsibilities, required reviews, and approved work window'} are referenced for engineer confirmation.` : 'Site requirements are missing. The reviewer needs the applicable approvals, constraints, and escalation requirements.',
      s.sources.manual ? `Include the applicable ${s.type === 'sop' ? 'shift record and open work' : s.type === 'eop' ? 'measurement history and incident record' : 'equipment guidance and observation record'} for ${asset}. This preview contains no live-work instructions.` : 'The applicable equipment guidance is missing. Identify the required source before completing the task detail.',
      s.template === 'vendor' ? 'Retain the vendor report, site acceptance, open exceptions, and the approved closeout record.' : 'Record observations, unresolved questions, the responsible reviewer, and the approved follow-up references.',
    ];
    const gap = [false, !s.sources.rules, !s.sources.manual, false];
    return `<div class="sc-brief">
      <aside class="brief"><p class="label">Your brief</p><h3 class="sc-h">Make it specific.</h3>
        <p class="field-l">Procedure type</p>${seg('Procedure type', 'data-pp-type', Object.entries(TYPES).map(([k, v]) => [k, v.name]), s.type)}
        <label class="field-l" for="pp-site">Facility</label><select id="pp-site" data-pp-select="site"><option value="north"${north ? ' selected' : ''}>North Campus / DC-01</option><option value="south"${!north ? ' selected' : ''}>South Campus / DC-04</option></select>
        <label class="field-l" for="pp-template">Document template</label><select id="pp-template" data-pp-select="template"><option value="operations"${s.template === 'operations' ? ' selected' : ''}>Operations template</option><option value="vendor"${s.template === 'vendor' ? ' selected' : ''}>Vendor work package</option></select>
        <p class="field-l">Sources available to the draft</p>${check('source-drawing', 'Current site drawing', s.sources.drawing)}${check('source-manual', 'Equipment manual', s.sources.manual)}${check('source-rules', 'Site rules & requirements', s.sources.rules)}
        <p class="brief-count"><b class="code">${available}<span>/ 3</span></b><span>example sources included</span></p></aside>
      <article class="draft"><header class="draft-head"><span class="code">${t.name} / EXAMPLE DRAFT</span>${stamp('Engineer review required', 'amber')}</header>
        <h3 class="draft-title">${esc(t.task)}</h3>
        <p class="draft-meta"><span>${north ? 'North Campus' : 'South Campus'}</span><span>${esc(asset)}</span><span>${s.template === 'operations' ? 'Operations template' : 'Vendor work package'}</span></p>
        <ol class="draft-secs">${t.parts.map((part, i) => `<li class="${gap[i] ? 'is-gap' : ''}"><span class="code">0${i + 1}</span><div><h4>${esc(part)}</h4><p>${esc(text[i])}</p>${i === 0 && s.sources.drawing ? `<span class="srcchip">${icon('drawing')}<span class="code">SLD-${north ? '001' : '004'} / Rev ${north ? 'C' : 'B'}</span></span>` : ''}${i === 0 && !s.sources.drawing ? '<span class="srcchip is-missing code">No drawing reference</span>' : ''}</div></li>`).join('')}</ol>
        ${missing.length ? hint('Information still needed', `Missing: ${missing.join(', ')}. The draft leaves those questions open.`, 'warn') : hint('Context included. Review still required.', 'The site, source set, and template change with your brief. Your engineer assesses the resulting draft.')}
      </article></div>`;
  }

  /* ── Review & approvals: a finding is the start of a decision ── */
  const FINDINGS = [
    { title: 'Drawing revision mismatch', type: 'Source reference', location: 'Section 02 / Supporting documents', draft: 'Reference: SLD-001, Revision B.', source: 'The current example site register lists SLD-001, Revision C.', why: 'The reviewer needs to check which changes in the current drawing affect the task.', evidence: 'SLD-001 / Site drawing register / Rev C' },
    { title: 'Equipment scope is incomplete', type: 'Equipment context', location: 'Section 01 / Equipment in scope', draft: 'Equipment: UPS-B. Dependent distribution is not identified.', source: 'The example drawing connects UPS-B to PDU-B and Hall 02.', why: 'The work boundary needs the dependent equipment and affected area, or a recorded reason for excluding them.', evidence: 'SLD-001 / UPS-B → PDU-B → Hall 02' },
    { title: 'Witness requirement is unassigned', type: 'Site requirement', location: 'Section 03 / Pre-work checks', draft: 'Witness: to be confirmed.', source: 'The example site rule requires a named witness before this work package is accepted.', why: 'An open responsibility can delay acceptance. Confirm the person or resolve the requirement before the next approval.', evidence: 'OPS-RULE-07 / Example witness requirement' },
  ];
  const reviewOutcome = s => { const count = s.decisions.filter(Boolean).length; return { count, ready: count === FINDINGS.length, revision: s.decisions.some(d => d === 'revision') }; };
  function review(s) {
    const f = FINDINGS[s.finding], o = reviewOutcome(s), d = s.decisions[s.finding];
    return `<div class="sc-review">
      <aside class="findings"><p class="findings-head"><span class="code">MOP-024 / REV 4</span><b>3 findings to assess</b></p>
        <div role="group" aria-label="Choose a finding">${FINDINGS.map((x, i) => `<button type="button" data-pp-finding="${i}" aria-pressed="${s.finding === i}"><span class="delta">${i + 1}</span><span><b>${esc(x.title)}</b><small>${s.decisions[i] === 'revision' ? 'Revision requested' : s.decisions[i] === 'accepted' ? 'Accepted with reason' : esc(x.type)}</small></span>${s.decisions[i] ? icon('check') : ''}</button>`).join('')}</div>
        <p class="brief-count"><b class="code">${o.count}<span>/ 3</span></b><span>reviewer decisions recorded</span></p></aside>
      <div class="fdetail"><p class="fdetail-top">${stamp(f.type, 'amber')}<span class="code">${esc(f.location)}</span></p>
        <h3 class="sc-h">${esc(f.title)}</h3>
        <div class="cmp"><div><p class="label">In the procedure</p><p>${esc(f.draft)}</p></div><div><p class="label">In the site record</p><p>${esc(f.source)}</p></div></div>
        <p class="sc-ref">${icon('file')}<span class="code">${esc(f.evidence)}</span></p>
        <p class="fdetail-why">${esc(f.why)}</p>
        ${d ? hint(d === 'revision' ? 'Revision requested' : 'Accepted with a reason', d === 'revision' ? 'This issue remains for the author to resolve in a revised procedure.' : s.reasons[s.finding], d === 'revision' ? 'warn' : '') : ''}
        ${s.accepting ? `<div class="reason"><label for="pp-reason">Record the reviewer’s reason</label><textarea id="pp-reason" data-pp-text="reason" maxlength="400" rows="2" placeholder="What evidence supports this decision?">${esc(s.reason)}</textarea>${act('save-reason', 'Record acceptance', !s.reason.trim())}</div>`
          : `<div class="sc-acts">${act('request-revision', 'Request revision', false, 'btn-mini')}${act('accept-finding', 'Accept with a reason', false, 'btn-mini')}</div>`}
        <div class="fsubmit">${act('submit-review', s.submitted ? 'Review recorded' : 'Record this review', !o.ready || s.submitted)}<p class="fine">${s.submitted ? (o.revision ? 'Review recorded. A revised procedure is still required.' : 'Review recorded. Authorization remains with the site’s approver.') : 'Record a decision on all three findings. Completing this review does not authorize field work.'}</p></div>
      </div></div>`;
  }

  /* ── Fieldwork & training: rehearse the checks before the real job ── */
  const STEPS = ['Confirm equipment', 'Record an observation', 'Witness checkpoint', 'Handoff the record'];
  const POINT = ['H', '', 'W', ''];
  const fieldReady = s => s.step === 0 ? s.equipment === 'ups-b' : s.step === 1 ? s.observation === 'clear' : s.step === 2 ? s.witness : true;
  function fieldwork(s) {
    let body;
    if (s.done) body = `<div class="tab-done">${icon('check')}<p class="label">Rehearsal complete</p><h3 class="sc-h">The checks have a record.</h3><p>Equipment identity, observation, and witness acknowledgement are attached to this fictional rehearsal.</p>${stamp('4 / 4 checkpoints recorded')}${act('field-reset', 'Run it again')}</div>`;
    else {
      const panels = [
        `<p>Match the equipment label in this example with the work package.</p><div class="eqid"><span class="label">Expected equipment</span><b class="code">UPS-B</b><small>North Campus / Hall 02</small></div><p class="field-l">Which equipment label did you find?</p>${seg('Observed equipment label', 'data-pp-equipment', [['ups-a', 'UPS-A'], ['ups-b', 'UPS-B']], s.equipment)}${s.equipment === 'ups-a' ? hint('Hold: the equipment does not match', 'Confirm the correct asset with the site team before continuing.', 'warn') : s.equipment === 'ups-b' ? hint('Equipment matched in the example', 'Continue to record the observation.') : ''}`,
        `<p>Capture the condition you observed for the example task.</p>${seg('Choose an observation', 'data-pp-observation', [['clear', 'No issue observed'], ['issue', 'An issue needs review']], s.observation, 'seg-stack')}${s.observation === 'issue' ? hint('Hold: request the site team’s review', 'The observation remains attached to the task. Do not advance while the issue is unresolved.', 'warn') : s.observation === 'clear' ? hint('Example observation attached', 'The recorded observation will travel with this rehearsal.') : ''}`,
        `<p>This example work package requires a witness checkpoint before handoff.</p><div class="eqid">${icon('people')}<div><b>Witness acknowledgement</b><small>Required by the example site rule</small></div></div>${check('field-witness', 'Record the sample witness acknowledgement', s.witness)}${s.witness ? hint('Witness checkpoint recorded', 'The rehearsal can move to the handoff.') : hint('Waiting for the checkpoint', 'The next step stays unavailable until the acknowledgement is recorded.', 'warn')}`,
        `<p>Review the example record before completing the rehearsal.</p><ul class="donelist"><li>${icon('check')}UPS-B identity confirmed</li><li>${icon('check')}Observation recorded</li><li>${icon('check')}Witness acknowledgement attached</li></ul>${hint('Ready to complete this rehearsal', 'In live work, the site’s authorization and exception process govern completion.')}`,
      ];
      body = `<div class="tab-task"><p class="label">Checkpoint 0${s.step + 1} / 04${POINT[s.step] ? ` · ${POINT[s.step] === 'H' ? 'Hold point' : 'Witness point'}` : ''}</p><h3 class="sc-h">${STEPS[s.step]}</h3>${panels[s.step]}<div class="tab-bottom">${s.step ? '<button type="button" class="btn-quiet" data-pp-action="field-back">Previous checkpoint</button>' : '<span></span>'}${act('field-next', s.step === 3 ? 'Complete rehearsal' : 'Record & continue', !fieldReady(s), 'btn-mini btn-mini-ink')}</div></div>`;
    }
    return `<div class="sc-field">
      <aside class="sc-panel"><p class="label">Tablet workflow</p><h3 class="sc-h">Keep the next check clear.</h3><p>Try the mismatch and exception paths. The example pauses at the point that needs attention.</p>
        ${seg('Choose preview mode', 'data-pp-mode', [['practice', 'Training dry run'], ['execution', 'Execution preview']], s.mode, 'seg-stack')}
        <ol class="itp">${STEPS.map((n, i) => `<li class="${s.done || i < s.step ? 'is-done' : i === s.step ? 'is-active' : ''}"><span class="code">${s.done || i < s.step ? '✓' : '0' + (i + 1)}</span>${n}${POINT[i] ? `<em class="itp-pt" title="${POINT[i] === 'H' ? 'Hold point' : 'Witness point'}">${POINT[i]}</em>` : ''}</li>`).join('')}</ol>
        <p class="fine">${s.mode === 'practice' ? 'Practice record only. No live-work authorization or equipment connection.' : 'A scripted execution preview. An approved procedure and site authorization are required for live work.'}</p>
        <p class="fine"><b>H</b> hold point: work stops until the check passes. <b>W</b> witness point: a named person must see it.</p></aside>
      <div class="tablet"><p class="tablet-top"><span>${icon('tablet')} entangl</span><span class="code">${s.mode === 'practice' ? 'TRAINING DRY RUN' : 'EXECUTION PREVIEW'}</span></p>
        <div class="tablet-job"><div><b>UPS-B / Inspection record</b><small class="code">MOP-024 · Rev 4 · Fictional procedure</small></div>${stamp(s.done ? 'Complete' : `Step ${s.step + 1} of 4`)}</div>
        <div class="tablet-prog" aria-label="${s.done ? 4 : s.step} of 4 checkpoints completed">${STEPS.map((_, i) => `<i class="${s.done || i < s.step ? 'is-done' : ''}"></i>`).join('')}</div>${body}</div>
    </div>`;
  }

  /* ── AI telemetry: three signals, a connected investigation ── */
  const SIGNALS = [{ asset: 'CRAH-02', label: 'Fan status', value: 'Stopped', time: '09:41', ic: 'wave' }, { asset: 'Hall 02', label: 'Airflow alarm', value: 'Low airflow', time: '09:42', ic: 'bell' }, { asset: 'Rack inlet', label: 'Temperature', value: '30.8 °C', time: '09:43', ic: 'wave' }];
  const telemetryData = s => { const count = Math.min(3, Math.max(0, s.time)), fresh = count - (s.stale && count === 3 ? 1 : 0); return { count, fresh, canGroup: fresh >= 2 }; };
  function telemetry(s) {
    const d = telemetryData(s), grouped = s.grouped && d.canGroup, pts = [[30, 128], [156, 126], [282, 86], [408, 30]], vis = pts.slice(0, s.time + 1), line = vis.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    return `<div class="sc-two">
      <div class="tel"><p class="sm-head"><span class="label">North Campus / Hall 02</span><span class="code">Recorded example</span></p>
        <ol class="tel-log">${SIGNALS.map((a, i) => `<li class="${i < d.count ? 'is-in' : ''}"><span class="code">${i < d.count ? a.time : '—:—'}</span>${icon(a.ic)}<span><b>${a.label}</b><small>${a.asset}</small></span><span class="code tel-v">${i < d.count ? (i === 2 && s.stale ? 'Stale' : a.value) : 'Not yet reported'}</span></li>`).join('')}</ol>
        <div class="tel-chart"><p><span class="label">Rack inlet temperature</span><b class="code">${s.stale && d.count === 3 ? 'Stale reading' : [23, 23.2, 26.3, 30.8][s.time] + ' °C'}</b></p>
          <svg viewBox="0 0 440 160" role="img" aria-label="Illustrative temperature history from 23 to 30.8 degrees Celsius between 09:40 and 09:43.${s.stale ? ' Latest point is stale.' : ''}"><path class="tel-grid" d="M30 30H420M30 80H420M30 130H420"/><path class="tel-line${s.stale ? ' is-stale' : ''}" d="${line}"/><circle cx="${vis.at(-1)[0]}" cy="${vis.at(-1)[1]}" r="5" class="tel-dot${s.stale && d.count === 3 ? ' is-stale' : ''}"/><text x="30" y="152">09:40</text><text x="420" y="152" text-anchor="end">09:43</text></svg></div>
        <div class="tel-range"><label for="pp-time">Move through the incident</label><output class="code" for="pp-time">${s.time} min</output></div><input id="pp-time" data-pp-range="time" type="range" min="0" max="3" step="1" value="${s.time}" aria-valuetext="${s.time} minutes">
        ${check('telemetry-stale', 'Treat the latest temperature reading as stale', s.stale)}</div>
      <aside class="sc-panel"><p class="tel-count"><b class="code">${grouped ? '1' : d.count}</b><span>${grouped ? 'connected issue' : 'signals to investigate'}</span></p>
        <h3 class="sc-h">${grouped ? 'Cooling interruption?' : 'What belongs together?'}</h3>
        <p>${grouped ? (d.count < 3 ? 'Fan and airflow signals suggest a cooling interruption. The temperature alert has not arrived; verify the cause with the available evidence.' : s.stale ? 'Fan and airflow evidence suggest a cooling interruption. The temperature reading needs verification.' : 'Related fan, airflow, and temperature signals suggest a cooling interruption. The operator still needs to verify the cause.') : 'Bring the equipment and timing into the same investigation before deciding what to do next.'}</p>
        ${grouped ? `<dl class="lf-rows"><div><dt>Equipment</dt><dd class="code">CRAH-02</dd></div><div><dt>Affected area</dt><dd>Hall 02</dd></div><div><dt>Assessment</dt><dd>Suggested cause</dd></div><div><dt>Fresh signals</dt><dd class="code">${d.fresh} of ${d.count}</dd></div></dl>${s.stale ? hint('Data quality needs attention', 'Verify the stale point before relying on the temperature trend.', 'warn') : ''}${s.response ? `<div class="resp"><p class="label">Response reference attached</p><h4 class="code">EOP-003 / Cooling investigation</h4><p>Verify measurements, confirm affected systems, and coordinate the authorized response.</p><p class="fine">Owner: example control-room role</p>${link('/platform/fieldwork/', 'Explore the field handoff')}</div>` : act('attach-response', 'Attach a response reference')}` : act('group-signals', 'Connect the signals', !d.canGroup)}
        <p class="fine">${d.canGroup ? 'No equipment is controlled by this example.' : 'At least two fresh signals are needed to connect an investigation.'}</p></aside>
    </div>`;
  }

  /* ── Customer & audit visibility: one event, the right view for each audience ── */
  const VEVENTS = ['Draft prepared', 'Review completed', 'Approval recorded', 'Work completed', 'Update published'];
  const VRECORDS = [
    { step: 0, title: 'Source drawing', ref: 'SLD-001 / Rev C', roles: ['operator', 'auditor'], text: 'Drawing referenced by the procedure.' },
    { step: 1, title: 'Engineer review', ref: 'MOP-024 / Rev 4', roles: ['operator', 'auditor'], text: 'Findings and reviewer decisions recorded.' },
    { step: 2, title: 'Approved procedure', ref: 'MOP-024 / Rev 4', roles: ['operator', 'auditor', 'customer'], text: 'Approved version for Customer A / Hall 02.' },
    { step: 3, title: 'Execution evidence', ref: 'FIELD-018 / Completion record', roles: ['operator', 'auditor'], text: 'Example observations and witness record attached.' },
    { step: 4, title: 'Published customer update', ref: 'NOTICE-012 / Customer A', roles: ['operator', 'auditor', 'customer'], text: 'Work complete. The approved customer summary is available.' },
    { step: 0, title: 'Internal planning discussion', ref: 'Internal / Site team', roles: ['operator'], text: 'Working notes retained within the operator’s view.' },
    { step: 0, title: 'Other customer’s work', ref: 'Customer B / Hall 01', roles: ['operator'], text: 'Outside this customer and auditor example scope.' },
  ];
  const visibleRecords = s => VRECORDS.filter(r => r.step <= s.point && r.roles.includes(s.audience));
  function visibility(s) {
    const all = VRECORDS.filter(r => r.step <= s.point), vis = visibleRecords(s), AUD = [['operator', 'Operator'], ['customer', 'Customer'], ['auditor', 'Auditor']];
    return `${seg('Choose the audience', 'data-pp-audience', AUD.map(([k, t]) => [k, t]), s.audience, 'seg-tabs')}
    <div class="sc-two">
      <div><p class="code vis-ref">MOP-024 / HALL 02 / CUSTOMER A</p><h3 class="sc-h">${VEVENTS[s.point]}</h3><p class="vis-desc">${s.audience === 'operator' ? 'Internal view, including planning context and other work.' : s.audience === 'customer' ? 'The approved procedure and published update for Customer A.' : 'Source, review, approval, and execution evidence in the agreed audit scope.'}</p>
        <ol class="vis-steps" role="group" aria-label="Choose a moment in the record">${VEVENTS.map((e, i) => `<li><button type="button" data-pp-event="${i}" aria-pressed="${i === s.point}" class="${i <= s.point ? 'is-past' : ''}"><span class="code">0${i + 1}</span>${e}</button></li>`).join('')}</ol>
        <div class="tscroll" role="region" aria-label="Records by audience" tabindex="0"><table class="dist"><caption class="sr-only">Distribution of records by audience at this moment</caption><thead><tr><th scope="col">Record</th>${AUD.map(([k, t]) => `<th scope="col" class="${k === s.audience ? 'is-aud' : ''}">${t}</th>`).join('')}</tr></thead>
          <tbody>${all.map(r => `<tr class="${r.roles.includes(s.audience) ? '' : 'is-out'}"><th scope="row"><b>${esc(r.title)}</b><span class="code">${esc(r.ref)}</span></th>${AUD.map(([k]) => `<td class="${k === s.audience ? 'is-aud' : ''}">${r.roles.includes(k) ? icon('check') + '<span class="sr-only">Visible</span>' : '<span aria-hidden="true">—</span><span class="sr-only">Not shared</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <aside class="sc-panel"><p class="label">${s.audience} view</p><p class="tel-count"><b class="code">${vis.length}</b><span>of ${all.length} example records visible</span></p>
        <dl class="lf-rows"><div><dt>Site</dt><dd>North Campus</dd></div><div><dt>Audience scope</dt><dd>${s.audience === 'operator' ? 'Site operations' : 'Customer A / Hall 02'}</dd></div><div><dt>Internal notes</dt><dd>${s.audience === 'operator' ? 'Included' : 'Excluded'}</dd></div><div><dt>Other customer records</dt><dd>${s.audience === 'operator' ? 'Included' : 'Excluded'}</dd></div></dl>
        <p>Access is part of the workflow, alongside who approves the record and who publishes the update.</p>
        <p class="fine">This is an illustrative audience filter. Production authorization must be enforced and tested in the deployed system.</p></aside>
    </div>`;
  }

  /* ── Maintenance planning (planned): a free slot isn't the whole decision ── */
  const TASKS = [['ups-a', 'UPS-A', 'Inspection work package', 'OEM-UPS / Example quarterly task'], ['ups-b', 'UPS-B', 'Inspection work package', 'OEM-UPS / Example quarterly task'], ['cooling', 'CRAH-02', 'Cooling service review', 'OEM-CRAH / Example task interval']];
  const DAYS = ['Mon 14', 'Tue 15', 'Wed 16', 'Thu 17'];
  const maintenanceReadiness = s => { const conflict = s.days['ups-a'] === s.days['ups-b']; return { conflict, ready: !conflict && s.parts && s.vendor }; };
  function maintenance(s) {
    const d = maintenanceReadiness(s), task = TASKS.find(t => t[0] === s.asset);
    return `<div class="sc-two">
      <div><p class="sm-head"><span class="label">Illustrative week / September</span>${stamp(d.conflict ? '1 dependency conflict' : 'Separate work windows', d.conflict ? 'amber' : '')}</p>
        <div class="sched" role="table" aria-label="Illustrative maintenance schedule"><div class="sched-row sched-head" role="row"><span role="columnheader">Equipment</span>${DAYS.map(x => `<span role="columnheader" class="code">${x}</span>`).join('')}</div>
          ${TASKS.map(([k, n]) => `<div class="sched-row" role="row"><span role="rowheader"><button type="button" data-pp-masset="${k}" aria-pressed="${s.asset === k}">${n}</button></span>${DAYS.map((day, i) => `<span role="cell">${s.days[k] === i ? `<button type="button" data-pp-masset="${k}" class="task ${d.conflict && k !== 'cooling' ? 'is-conflict' : ''} ${s.asset === k ? 'is-sel' : ''}" aria-label="Select ${n}, scheduled ${day}">${icon(k === 'cooling' ? 'wave' : 'grid')}<span>Work</span></button>` : ''}</span>`).join('')}</div>`).join('')}</div>
        ${d.conflict ? hint('Shared resilience dependency', 'UPS-A and UPS-B are in the same illustrative work window. Select a task and move it to a different day.', 'warn') : hint('The example overlap is resolved', 'Different dates resolve this single illustrated conflict. The site still needs to review the actual work and operating conditions.')}
        <p class="field-l">Work-package prerequisites</p>${check('maintenance-parts', 'Required example parts are available', s.parts)}${check('maintenance-vendor', 'Vendor qualification and coverage confirmed', s.vendor)}</div>
      <aside class="sc-panel"><p class="label">Selected work package</p><h3 class="sc-h">${task[1]}</h3><p>${task[2]}</p><p class="sc-ref">${icon('file')}<span class="code">${task[3]}</span></p>
        <p class="field-l">Move this task to</p>${seg('Choose a maintenance day', 'data-pp-day', DAYS.map((x, i) => [i, x]), s.days[s.asset], 'seg-days')}
        <ul class="ready"><li class="${d.conflict ? 'no' : 'ok'}">${icon(d.conflict ? 'close' : 'check')}Dependency window ${d.conflict ? 'needs review' : 'separated'}</li><li class="${s.parts ? 'ok' : 'no'}">${icon(s.parts ? 'check' : 'close')}Parts ${s.parts ? 'confirmed' : 'not confirmed'}</li><li class="${s.vendor ? 'ok' : 'no'}">${icon(s.vendor ? 'check' : 'close')}Vendor ${s.vendor ? 'confirmed' : 'not confirmed'}</li></ul>
        ${s.prepared ? hint('Example package prepared', 'Schedule, source, parts, and vendor references are assembled for the site’s review. This is not approval to execute.') : act('prepare-package', 'Prepare example package', !d.ready)}
        <p class="fine">Intervals, dates, and checks are fictional. They are not maintenance recommendations for real equipment.</p></aside>
    </div>`;
  }

  /* ── Portfolio performance (planned): a view you can ask questions of ── */
  const SITES = [
    { key: 'north', name: 'North Campus', code: 'DC-01', stage: 'Steady-state operations', review: 8, overdue: 2, limit: 500, context: 'Two reviews are waiting for source clarification. One customer is approaching its contractual load.' },
    { key: 'east', name: 'East Campus', code: 'DC-02', stage: 'New hall entering service', review: 3, overdue: 0, limit: 500, context: 'New-hall procedures are moving through the first review cycle. Keep commissioning context in the comparison.' },
    { key: 'south', name: 'South Campus', code: 'DC-04', stage: 'Facility-management transition', review: 5, overdue: 1, limit: 500, context: 'The incoming team is reconciling procedure ownership and an inherited open maintenance item.' },
    { key: 'west', name: 'West Campus', code: 'DC-03', stage: 'Steady-state operations', review: 2, overdue: 0, limit: 500, context: 'Review records are available. Customer demand is unavailable in this example and is not counted as zero.' },
  ];
  const portfolioOrder = s => [...SITES].sort((a, b) => s.metric === 'capacity' ? ((s.demands[b.key] ?? -Infinity) - (s.demands[a.key] ?? -Infinity)) : b[s.metric === 'review' ? 'review' : 'overdue'] - a[s.metric === 'review' ? 'review' : 'overdue']);
  function portfolio(s) {
    const site = SITES.find(x => x.key === s.site), demand = s.demands[s.site], cap = s.metric === 'capacity', queue = s.metric === 'review';
    const metric = queue ? 'Open reviews' : cap ? 'Contract use' : 'Overdue work', total = cap ? '3 / 4' : queue ? '18' : '3';
    return `${seg('Choose a portfolio metric', 'data-pp-metric', [['review', 'Review queue'], ['overdue', 'Overdue work'], ['capacity', 'Customer headroom']], s.metric, 'seg-tabs')}
    <div class="sc-two">
      <div><div class="pf-total"><div><p class="label">Portfolio / example snapshot</p><h3 class="sc-h">${cap ? 'Make the capacity conversation visible.' : queue ? 'Where is review work waiting?' : 'Which work needs a closer look?'}</h3></div><p><b class="code">${total}</b><span>${cap ? 'sites with demand data' : queue ? 'open reviews' : 'overdue tasks'}</span></p></div>
        <div class="tscroll" role="region" aria-label="Portfolio facilities" tabindex="0"><table class="pf"><thead><tr><th scope="col">Facility</th><th scope="col">Operating context</th><th scope="col">${metric}</th></tr></thead><tbody>${portfolioOrder(s).map(r => `<tr class="${r.key === s.site ? 'is-sel' : ''}"><th scope="row"><button type="button" data-pp-site="${r.key}" aria-pressed="${r.key === s.site}"><b>${r.name}</b><small class="code">${r.code}</small></button></th><td>${r.stage}</td><td class="code">${cap ? (s.demands[r.key] === null ? '<span class="gap">Unavailable</span>' : `${num(s.demands[r.key] / r.limit * 100)}%`) : r[queue ? 'review' : 'overdue']}</td></tr>`).join('')}</tbody></table></div>
        <p class="fine">Select a facility to inspect its context. ${cap ? 'Demand is shown for one illustrative customer per reporting site.' : 'Counts use the same example definition; they do not measure overall site quality.'}</p></div>
      <aside class="sc-panel"><p class="label">${site.code} / The record behind the number</p><h3 class="sc-h">${site.name}</h3><p>${site.context}</p>
        ${cap ? (demand === null ? `<div class="gapcard">${icon('wave')}<b>No demand reading available.</b><p>Resolve the source or mapping before drawing a capacity conclusion.</p></div>` :
          `<p class="tel-count"><b class="code">${num(Math.abs(site.limit - demand))}</b><span>kW ${demand > site.limit ? 'above' : 'below'} the contractual limit</span></p>
           <div class="tel-range"><label for="pp-demand">Customer peak demand</label><output class="code" for="pp-demand">${num(demand)} kW</output></div><input id="pp-demand" data-pp-range="demand" type="range" min="250" max="550" step="5" value="${demand}" aria-valuetext="${num(demand)} kilowatts">
           <div class="lf-meter"><i style="width:${Math.min(demand / site.limit * 100, 100)}%"></i></div><div class="lf-meter-labels"><span>${num(demand / site.limit * 100)}% of contract</span><span>${site.limit} kW limit</span></div>
           ${hint(demand >= 450 ? 'Start a customer conversation' : 'Room in the selected contract', demand >= 450 ? 'Review demand history and the customer’s plans with the account owner.' : 'Continue to monitor the customer’s plans and measured demand.', demand > site.limit ? 'warn' : '')}`)
          : `<ul class="pf-recs"><li>${icon('file')}<span><b class="code">${queue ? 'MOP-024 / Source clarification' : site.overdue ? 'MAINT-012 / Supporting record' : 'No overdue tasks in this snapshot'}</b><small>${queue ? 'Author response needed' : site.overdue ? 'Review the due date and work history' : 'The example reports zero overdue work.'}</small></span></li><li>${icon('people')}<span><b>${site.stage}</b><small>Keep local responsibilities in view</small></span></li></ul>
             ${link(queue ? '/platform/review/' : '/platform/maintenance/', queue ? 'Explore the review workflow' : 'Explore maintenance planning')}`}
        <p class="fine">Contract utilization can trigger a conversation. Verified electrical, cooling, space, and resilience capacity must support any commitment to a customer.</p></aside>
    </div>`;
  }

  const SCENES = { overview, 'site-model': siteModel, procedures, review, fieldwork, telemetry, visibility, maintenance, portfolio };
  const api = { MODULES, DEFAULTS, SCENES, render: (k, s) => SCENES[k](s), clone, reviewOutcome, fieldReady, telemetryData, visibleRecords, maintenanceReadiness, portfolioOrder, FINDINGS };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.EntanglScenes = api;
})(typeof window !== 'undefined' ? window : globalThis);
