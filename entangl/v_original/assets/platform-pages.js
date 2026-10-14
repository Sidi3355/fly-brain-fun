/* Buyer-facing platform pages and scripted examples. All facility records are fictional. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"></use></svg>`;
  const num = n => Number(n).toLocaleString('en-US', {maximumFractionDigits: 1});
  const clone = x => JSON.parse(JSON.stringify(x));
  const modules = [
    ['site-model','grid','Site model','The equipment and the sources behind the work.'],
    ['procedures','file','Write procedures','A draft grounded in the site and task.'],
    ['review','eye','Review & approvals','Findings, evidence, and an engineer’s decision.'],
    ['fieldwork','tablet','Fieldwork & training','The procedure and evidence at the point of work.'],
    ['telemetry','wave','AI telemetry','Signals connected to a useful investigation.'],
    ['maintenance','clock','Maintenance planning','Tasks, dependencies, and work readiness.'],
    ['visibility','shield','Customer & audit visibility','The relevant record for the right audience.'],
    ['portfolio','capacity','Portfolio performance','Attention and opportunity across sites.']
  ];
  const defaults = {
    overview:{path:'planned',node:'review'},
    procedures:{type:'mop',site:'north',template:'operations',sources:{drawing:true,manual:true,rules:true}},
    review:{finding:0,decisions:['','',''],reasons:['','',''],accepting:false,reason:'',submitted:false},
    'site-model':{asset:'ups-b',evidence:'drawing',revised:false},
    fieldwork:{step:0,equipment:'',observation:'',witness:false,mode:'practice',done:false},
    telemetry:{time:3,grouped:false,stale:false,response:false},
    visibility:{audience:'operator',point:2},
    maintenance:{asset:'ups-b',days:{'ups-a':0,'ups-b':0,cooling:2},parts:false,vendor:true,prepared:false},
    portfolio:{metric:'review',site:'north',demands:{north:465,east:340,south:410,west:null}}
  };
  const route = key => key === 'overview' ? '/platform' : '/platform/' + key;
  const label = key => modules.find(m => m[0] === key)?.[2] || 'Platform overview';
  const headline = s => s.split('\n').map((line,i) => i ? `<em>${esc(line)}</em>` : esc(line)).join('<br>');
  const pill = (text, tone = '') => `<span class="pp-pill ${tone}">${esc(text)}</span>`;
  const choice = (attr,key,text,selected,extra='') => `<button type="button" ${attr}="${esc(key)}" aria-pressed="${selected}" ${extra}>${text}</button>`;
  const group = (name,body,cls='') => `<div class="pp-choices ${cls}" role="group" aria-label="${esc(name)}">${body}</div>`;
  const link = (href,text,cls='pp-link') => `<a class="${cls}" href="${esc(href)}">${esc(text)}${icon('arrow')}</a>`;
  const action = (key,text,disabled=false,cls='pp-primary') => `<button type="button" class="${cls}" data-pp-action="${key}" ${disabled?'disabled':''}>${text}${icon('arrow')}</button>`;
  const check = (key,label,checked) => `<label class="pp-check"><input type="checkbox" data-pp-check="${key}" ${checked?'checked':''}><span>${esc(label)}</span></label>`;
  const hint = (title,copy,tone='') => `<div class="pp-hint ${tone}">${icon(tone==='warn'?'bell':'check')}<div><strong>${esc(title)}</strong><p>${esc(copy)}</p></div></div>`;
  const range = (id,label,min,max,step,value,unit) => `<div class="pp-range"><div><label for="${id}">${esc(label)}</label><output for="${id}">${num(value)}${unit==='%'?'':' '}${esc(unit)}</output></div><input id="${id}" data-pp-range="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" style="--pp-fill:${(value-min)/(max-min)*100}%" aria-valuetext="${num(value)} ${esc(unit)}"></div>`;

  const paths = {
    planned:{name:'Planned maintenance',nodes:['site-model','procedures','review','fieldwork','maintenance','visibility'],record:'MOP-024 / UPS-B inspection',decision:'What must be checked before the work starts?',trace:['SLD-001 · Rev C','MOP-024 · Draft','Engineer review · Open']},
    incident:{name:'An incident',nodes:['site-model','telemetry','procedures','fieldwork','visibility','portfolio'],record:'INC-017 / Hall 02 cooling',decision:'Which signals belong together, and who owns the response?',trace:['CRAH-02 · Signals','INC-017 · Investigation','EOP-003 · Response reference']},
    customer:{name:'A customer review',nodes:['site-model','review','fieldwork','visibility','portfolio'],record:'CUSTOMER A / Hall 02',decision:'What has been reviewed, approved, and shared?',trace:['Procedure · Rev 4','Approval · Recorded','Customer update · Published']}
  };
  function overviewScene(s) {
    const p=paths[s.path],selected=modules.find(m=>m[0]===s.node);
    return `${group('Choose an operating situation',Object.entries(paths).map(([k,v])=>choice('data-pp-path',k,esc(v.name),s.path===k)).join(''),'pp-situation-tabs')}<div class="pp-overview-layout"><div class="pp-network-workflows"><div class="pp-network-origin">${icon('grid')}<div><span>NORTH CAMPUS / DC-01</span><strong>One shared site context</strong></div><span class="pp-origin-count">08<span>workflows</span></span></div><div class="pp-workflow-grid">${modules.map(([k,i,n],index)=>`<button type="button" data-pp-node="${k}" class="pp-workflow-node ${p.nodes.includes(k)?'is-connected':''} ${k===s.node?'is-selected':''}" aria-pressed="${k===s.node}"><span class="pp-workflow-top">${icon(i)}<small>0${index+1}</small></span><strong>${n}</strong><span>${p.nodes.includes(k)?'In this workflow':'Explore the connection'}</span></button>`).join('')}</div></div><aside class="pp-record-panel"><span class="pp-kicker">FOLLOW THE CONNECTION</span><h3>${esc(selected[2])}</h3><p>${esc(selected[3])}</p><div class="pp-record-reference">${icon('file')}<span>${esc(p.record)}</span></div><h4>${esc(p.decision)}</h4><ol class="pp-record-trail">${p.trace.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>${link(route(s.node),'Explore '+selected[2].toLowerCase())}<p class="pp-fine">This example connects the proposed workflow. Module availability is defined in the scope below.</p></aside></div>`;
  }

  const procedureTypes = {
    mop:{name:'MOP',task:'Planned UPS inspection',parts:['Scope & equipment','Prerequisites & authorizations','Inspection record','Closeout & recovery references']},
    sop:{name:'SOP',task:'Shift handover',parts:['Shift & responsibilities','Current site conditions','Open work & exceptions','Incoming-team acknowledgement']},
    eop:{name:'EOP',task:'Cooling alert response',parts:['Trigger & affected systems','Initial verification','Response coordination','Recovery evidence & escalation']}
  };
  function procedureScene(s) {
    const t=procedureTypes[s.type],north=s.site==='north',asset=s.type==='sop'?'Site operations':s.type==='eop'?(north?'CRAH-02':'CRAH-07'):(north?'UPS-B':'UPS-04');
    const available=Object.values(s.sources).filter(Boolean).length,missing=Object.entries(s.sources).filter(([,v])=>!v).map(([k])=>({drawing:'site drawing',manual:'equipment manual',rules:'site rules'}[k]));
    return `<div class="pp-author-layout"><aside class="pp-brief-panel"><span class="pp-kicker">YOUR BRIEF</span><h3>Make it specific.</h3><span class="pp-field-label">Procedure type</span>${group('Procedure type',Object.entries(procedureTypes).map(([k,v])=>choice('data-pp-procedure-type',k,v.name,s.type===k)).join(''))}<label class="pp-select-label" for="pp-procedure-site">Facility<select id="pp-procedure-site" data-pp-select="procedure-site"><option value="north" ${north?'selected':''}>North Campus / DC-01</option><option value="south" ${!north?'selected':''}>South Campus / DC-04</option></select></label><label class="pp-select-label" for="pp-template">Document template<select id="pp-template" data-pp-select="template"><option value="operations" ${s.template==='operations'?'selected':''}>Operations template</option><option value="vendor" ${s.template==='vendor'?'selected':''}>Vendor work package</option></select></label><div class="pp-source-selector"><span class="pp-field-label">Sources available to the draft</span>${check('source-drawing','Current site drawing',s.sources.drawing)}${check('source-manual','Equipment manual',s.sources.manual)}${check('source-rules','Site rules & requirements',s.sources.rules)}</div><div class="pp-context-count"><strong>${available}<span>/ 3</span></strong><span>example sources<br>included</span></div></aside><div class="pp-draft-paper"><div class="pp-paper-header"><span>${t.name} / EXAMPLE DRAFT</span>${pill('Engineer review required')}</div><h3>${t.task}</h3><div class="pp-paper-meta"><span>${north?'North Campus':'South Campus'}</span><span>${asset}</span><span>${s.template==='operations'?'Operations template':'Vendor work package'}</span></div><div class="pp-draft-sections">${t.parts.map((part,i)=>`<section><span>0${i+1}</span><div><h4>${part}</h4><p>${[
      `The task is scoped to ${asset} at ${north?'North Campus / DC-01':'South Campus / DC-04'}. Confirm the equipment and the boundary with the site team.`,
      s.sources.rules?`${s.template==='vendor'?'Vendor induction, named site contact, and approved work window':'Site responsibilities, required reviews, and approved work window'} are referenced for engineer confirmation.`:'Site requirements are missing. The reviewer needs the applicable approvals, constraints, and escalation requirements.',
      s.sources.manual?`Include the applicable ${s.type==='sop'?'shift record and open work':s.type==='eop'?'measurement history and incident record':'equipment guidance and observation record'} for ${asset}. This preview contains no live-work instructions.`:'The applicable equipment guidance is missing. Identify the required source before completing the task detail.',
      s.template==='vendor'?'Retain the vendor report, site acceptance, open exceptions, and the approved closeout record.':'Record observations, unresolved questions, the responsible reviewer, and the approved follow-up references.'
    ][i]}</p>${i===0&&s.sources.drawing?`<span class="pp-source-chip">${icon('file')}SLD-${north?'001':'004'} / Rev ${north?'C':'B'}</span>`:''}</div></section>`).join('')}</div>${missing.length?hint('Information still needed',`Missing: ${missing.join(', ')}. The draft leaves those questions open.`,'warn'):hint('Context included. Review still required.','The site, source set, and template change with your brief. Your engineer assesses the resulting draft.')}</div></div>`;
  }

  const findings = [
    {title:'Drawing revision mismatch',type:'Source reference',location:'Section 02 / Supporting documents',draft:'Reference: SLD-001, Revision B.',source:'The current example site register lists SLD-001, Revision C.',why:'The reviewer needs to check which changes in the current drawing affect the task.',evidence:'SLD-001 / Site drawing register / Rev C'},
    {title:'Equipment scope is incomplete',type:'Equipment context',location:'Section 01 / Equipment in scope',draft:'Equipment: UPS-B. Dependent distribution is not identified.',source:'The example drawing connects UPS-B to PDU-B and Hall 02.',why:'The work boundary needs the dependent equipment and affected area, or a recorded reason for excluding them.',evidence:'SLD-001 / UPS-B → PDU-B → Hall 02'},
    {title:'Witness requirement is unassigned',type:'Site requirement',location:'Section 03 / Pre-work checks',draft:'Witness: to be confirmed.',source:'The example site rule requires a named witness before this work package is accepted.',why:'An open responsibility can delay acceptance. Confirm the person or resolve the requirement before the next approval.',evidence:'OPS-RULE-07 / Example witness requirement'}
  ];
  function reviewOutcome(s) {
    const count=s.decisions.filter(Boolean).length;
    return {count,ready:count===findings.length,revision:s.decisions.some(d=>d==='revision')};
  }
  function reviewScene(s) {
    const f=findings[s.finding],o=reviewOutcome(s),decision=s.decisions[s.finding];
    return `<div class="pp-review-layout"><aside class="pp-findings"><div class="pp-findings-title"><span class="pp-kicker">MOP-024 / REV 4</span><strong>3 findings to assess</strong></div><div role="group" aria-label="Choose a finding">${findings.map((f,i)=>`<button type="button" data-pp-finding="${i}" aria-pressed="${s.finding===i}"><span class="pp-finding-number">0${i+1}</span><span><strong>${f.title}</strong><small>${s.decisions[i]==='revision'?'Revision requested':s.decisions[i]==='accepted'?'Accepted with reason':f.type}</small></span>${icon(s.decisions[i]?'check':'chevron')}</button>`).join('')}</div><div class="pp-review-count"><strong>${o.count}<span>/ 3</span></strong><span>reviewer decisions<br>recorded</span></div></aside><div class="pp-finding-detail"><div class="pp-detail-top">${pill(f.type,'amber')}<span>${f.location}</span></div><h3>${f.title}</h3><div class="pp-evidence-comparison"><div><span class="pp-kicker">IN THE PROCEDURE</span><p>${f.draft}</p></div><div><span class="pp-kicker">IN THE SITE RECORD</span><p>${f.source}</p></div></div><div class="pp-source-line">${icon('file')}<span>${f.evidence}</span></div><p class="pp-review-why">${f.why}</p>${decision?hint(decision==='revision'?'Revision requested':'Accepted with a reason',decision==='revision'?'This issue remains for the author to resolve in a revised procedure.':s.reasons[s.finding],decision==='revision'?'warn':''):''}${s.accepting?`<div class="pp-reason"><label for="pp-review-reason">Record the reviewer’s reason</label><textarea id="pp-review-reason" data-pp-text="review-reason" maxlength="400" rows="2" placeholder="What evidence supports this decision?">${esc(s.reason)}</textarea>${action('save-reason','Record acceptance',!s.reason.trim())}</div>`:`<div class="pp-demo-actions">${action('request-revision','Request revision',false,'pp-secondary')}${action('accept-finding','Accept with a reason',false,'pp-secondary')}</div>`}<div class="pp-review-submit">${action('submit-review',s.submitted?'Review recorded':'Record this review',!o.ready||s.submitted)}<p>${s.submitted?(o.revision?'Review recorded. A revised procedure is still required.':'Review recorded. Authorization remains with the site’s approver.'):'Record a decision on all three findings. Completing this review does not authorize field work.'}</p></div></div></div>`;
  }

  const assetInfo = {
    'ups-a':{name:'UPS-A',area:'Hall 01',pdu:'PDU-A',line:'a',source:'SLD-001 / Rev C / Power path A'},
    'ups-b':{name:'UPS-B',area:'Hall 02',pdu:'PDU-B',line:'b',source:'SLD-001 / Rev C / Power path B'},
    cooling:{name:'CRAH-02',area:'Hall 02',pdu:'Cooling service',line:'c',source:'MECH-002 / Rev B / Cooling service'}
  };
  function siteModelScene(s) {
    const a=assetInfo[s.asset];
    const evidence={drawing:['Documented relationship',`${a.name} ${s.asset==='cooling'?'serves':'connects through '+a.pdu+' to'} ${a.area}. The drawing does not verify the present operating state.`,a.source],field:['Field observation',`An example field note confirms the label “${a.name}.” The note is one observation, not a continuous measurement.`, 'FIELD-NOTE-018 / Example observation / 09:10'],telemetry:['Integration not connected','No sensor feed is connected to this website example. Live state would require verified point mapping and a current timestamp.','No current measurement available']}[s.evidence];
    return `<div class="pp-model-layout"><div class="pp-map-panel"><div class="pp-detail-top"><span class="pp-kicker">SIMPLIFIED SITE RELATIONSHIPS</span>${pill(s.revised?'Incoming Rev D / unvalidated':'Revision C / example')}</div><div class="pp-site-map" data-trace="${a.line}" role="img" aria-label="UPS-A connects through PDU-A to Hall 01. UPS-B connects through PDU-B to Hall 02. CRAH-02 serves Hall 02. ${esc(a.name)} is selected."><svg viewBox="0 0 600 300" aria-hidden="true"><g class="pp-map-grid"><path d="M0 50H600M0 150H600M0 250H600M100 0V300M300 0V300M500 0V300"/></g><g class="pp-map-path pp-path-a"><path d="M160 61H247M360 61H447"/></g><g class="pp-map-path pp-path-b"><path d="M160 152H247M360 152H447"/></g><g class="pp-map-path pp-path-c"><path d="M160 248H398Q422 248 422 224V177Q422 152 447 152"/></g><g class="pp-map-node"><rect x="25" y="32" width="135" height="58" rx="4"/><text x="92" y="66">UPS-A</text><rect x="247" y="32" width="113" height="58" rx="4"/><text x="304" y="66">PDU-A</text><rect x="447" y="32" width="132" height="58" rx="4"/><text x="513" y="66">Hall 01</text><rect x="25" y="123" width="135" height="58" rx="4"/><text x="92" y="157">UPS-B</text><rect x="247" y="123" width="113" height="58" rx="4"/><text x="304" y="157">PDU-B</text><rect x="447" y="123" width="132" height="58" rx="4"/><text x="513" y="157">Hall 02</text><rect x="25" y="219" width="135" height="58" rx="4"/><text x="92" y="253">CRAH-02</text></g></svg></div>${group('Trace an equipment connection',Object.entries(assetInfo).map(([k,v])=>choice('data-pp-asset',k,icon(k==='cooling'?'wave':'grid')+v.name,s.asset===k)).join(''))}<div class="pp-map-revision">${check('drawing-revised','Introduce a new drawing revision',s.revised)}</div>${s.revised?hint('2 procedure references need another look','MOP-024 and EOP-003 cite Rev C. The diagram retains that revision until the new drawing is validated.','warn'):hint('The source stays connected to the asset',`${a.name} → ${a.pdu} → ${a.area}. Select a different asset to follow its documented relationship.`)}</div><aside class="pp-record-panel"><span class="pp-kicker">EQUIPMENT CONTEXT</span><h3>${a.name}</h3><p>${a.area} / ${s.asset==='cooling'?'Cooling':'Electrical distribution'}</p>${group('Choose evidence provenance',['drawing','field','telemetry'].map(k=>choice('data-pp-evidence',k,esc({drawing:'Drawing',field:'Field check',telemetry:'Telemetry'}[k]),s.evidence===k)).join(''),'pp-compact-choices')}<div class="pp-state-card"><span>${esc(evidence[0])}</span><p>${esc(evidence[1])}</p><small>${esc(evidence[2])}</small></div><div class="pp-record-reference">${icon('file')}<span>Linked work<br><strong>MOP-024 · EOP-003</strong></span></div><p class="pp-fine">Select a source to see what it can—and cannot—establish about the asset.</p></aside></div>`;
  }

  const fieldSteps=['Confirm equipment','Record an observation','Witness checkpoint','Handoff the record'];
  function fieldReady(s) {return s.step===0?s.equipment==='ups-b':s.step===1?s.observation==='clear':s.step===2?s.witness:true;}
  function fieldScene(s) {
    let body;
    if(s.done) body=`<div class="pp-field-complete">${icon('check')}<span class="pp-kicker">REHEARSAL COMPLETE</span><h3>The checks have a record.</h3><p>Equipment identity, observation, and witness acknowledgement are attached to this fictional rehearsal.</p>${pill('4 / 4 checkpoints recorded')}${action('field-reset','Run it again')}</div>`;
    else {
      const panels=[
        `<p>Match the equipment label in this example with the work package.</p><div class="pp-equipment-id"><span>EXPECTED EQUIPMENT</span><strong>UPS-B</strong><small>North Campus / Hall 02</small></div><span class="pp-field-label">Which equipment label did you find?</span>${group('Observed equipment label',['ups-a','ups-b'].map(k=>choice('data-pp-field-equipment',k,k.toUpperCase(),s.equipment===k)).join(''))}${s.equipment==='ups-a'?hint('Hold: the equipment does not match','Confirm the correct asset with the site team before continuing.','warn'):s.equipment==='ups-b'?hint('Equipment matched in the example','Continue to record the observation.'):''}`,
        `<p>Capture the condition you observed for the example task.</p>${group('Choose an observation',choice('data-pp-field-observation','clear','No issue observed',s.observation==='clear')+choice('data-pp-field-observation','issue','An issue needs review',s.observation==='issue'),'pp-vertical-choices')}${s.observation==='issue'?hint('Hold: request the site team’s review','The observation remains attached to the task. Do not advance while the issue is unresolved.','warn'):s.observation==='clear'?hint('Example observation attached','The recorded observation will travel with this rehearsal.'):''}`,
        `<p>This example work package requires a witness checkpoint before handoff.</p><div class="pp-witness-record">${icon('people')}<div><strong>Witness acknowledgement</strong><span>Required by the example site rule</span></div></div>${check('field-witness','Record the sample witness acknowledgement',s.witness)}${s.witness?hint('Witness checkpoint recorded','The rehearsal can move to the handoff.'):hint('Waiting for the checkpoint','The next step stays unavailable until the acknowledgement is recorded.','warn')}`,
        `<p>Review the example record before completing the rehearsal.</p><ul class="pp-completion-list"><li>${icon('check')}UPS-B identity confirmed</li><li>${icon('check')}Observation recorded</li><li>${icon('check')}Witness acknowledgement attached</li></ul>${hint('Ready to complete this rehearsal','In live work, the site’s authorization and exception process govern completion.')}`
      ];
      body=`<div class="pp-tablet-task"><span class="pp-kicker">CHECKPOINT 0${s.step+1} / 04</span><h3>${fieldSteps[s.step]}</h3>${panels[s.step]}<div class="pp-tablet-bottom">${s.step?`<button type="button" data-pp-action="field-back" class="pp-quiet">Previous checkpoint</button>`:'<span></span>'}${action('field-next',s.step===3?'Complete rehearsal':'Record & continue',!fieldReady(s))}</div></div>`;
    }
    return `<div class="pp-field-layout"><aside class="pp-field-context"><span class="pp-kicker">TABLET WORKFLOW</span><h3>Keep the next<br>check clear.</h3><p>Try the mismatch and exception paths. The example pauses at the point that needs attention.</p>${group('Choose preview mode',choice('data-pp-field-mode','practice','Training dry run',s.mode==='practice')+choice('data-pp-field-mode','execution','Execution preview',s.mode==='execution'),'pp-vertical-choices')}<ol class="pp-field-step-list">${fieldSteps.map((n,i)=>`<li class="${s.done||i<s.step?'is-done':i===s.step?'is-active':''}"><span>${s.done||i<s.step?'✓':'0'+(i+1)}</span>${n}</li>`).join('')}</ol><p class="pp-fine">${s.mode==='practice'?'Practice record only. No live-work authorization or equipment connection.':'A scripted execution preview. An approved procedure and site authorization are required for live work.'}</p></aside><div class="pp-tablet"><div class="pp-tablet-top"><span>${icon('mark')}entangl</span><span>${s.mode==='practice'?'TRAINING DRY RUN':'EXECUTION PREVIEW'}</span></div><div class="pp-tablet-job"><div><strong>UPS-B / Inspection record</strong><span>MOP-024 · Rev 4 · Fictional procedure</span></div>${pill(s.done?'Complete':`Step ${s.step+1} of 4`)}</div><div class="pp-step-progress" aria-label="${s.done?4:s.step} of 4 checkpoints completed">${fieldSteps.map((_,i)=>`<i class="${s.done||i<s.step?'is-done':''}"></i>`).join('')}</div>${body}</div></div>`;
  }

  const signals=[
    {asset:'CRAH-02',label:'Fan status',value:'Stopped',time:'09:41',icon:'wave'},
    {asset:'Hall 02',label:'Airflow alarm',value:'Low airflow',time:'09:42',icon:'bell'},
    {asset:'Rack inlet',label:'Temperature',value:'30.8 °C',time:'09:43',icon:'wave'}
  ];
  function telemetryData(s) {const count=Math.min(3,Math.max(0,s.time)),fresh=count-(s.stale&&count===3?1:0);return {count,fresh,canGroup:fresh>=2};}
  function telemetryScene(s) {
    const d=telemetryData(s),grouped=s.grouped&&d.canGroup,points=[[26,130],[154,128],[282,88],[410,32]],visible=points.slice(0,s.time+1),line=visible.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');
    return `<div class="pp-telemetry-layout"><div class="pp-telemetry-signals"><div class="pp-detail-top"><span class="pp-kicker">NORTH CAMPUS / HALL 02</span>${pill('Recorded example')}</div><div class="pp-signal-list">${signals.map((a,i)=>`<div class="pp-signal ${i<d.count?'is-visible':''}"><span class="pp-signal-symbol">${icon(a.icon)}</span><div><strong>${a.label}</strong><small>${a.asset} · ${i<d.count?a.time:'Not yet reported'}</small></div><span class="pp-signal-value">${i<d.count?(i===2&&s.stale?'Stale':a.value):'—'}</span></div>`).join('')}</div><div class="pp-telemetry-chart"><div><span>Rack inlet temperature</span><strong>${s.stale&&d.count===3?'Stale reading':[23,23.2,26.3,30.8][s.time]+' °C'}</strong></div><svg viewBox="0 0 440 168" role="img" aria-label="Illustrative temperature history from 23 to 30.8 degrees Celsius between 09:40 and 09:43. ${s.stale?'Latest point is stale.':''}"><path d="M26 32H420M26 82H420M26 132H420" class="pp-chart-grid"/><path d="${line}" class="pp-chart-line ${s.stale?'is-stale':''}"/><circle cx="${visible.at(-1)[0]}" cy="${visible.at(-1)[1]}" r="5"/><text x="26" y="158">09:40</text><text x="368" y="158">09:43</text></svg></div>${range('pp-telemetry-time','Move through the incident',0,3,1,s.time,'min')}${check('telemetry-stale','Treat the latest temperature reading as stale',s.stale)}</div><div class="pp-issue-panel"><div class="pp-issue-count"><strong>${grouped?'1':d.count}</strong><span>${grouped?'connected issue':'signals to investigate'}</span></div><h3>${grouped?'Cooling interruption?':'What belongs together?'}</h3><p>${grouped?(d.count<3?'Fan and airflow signals suggest a cooling interruption. The temperature alert has not arrived; verify the cause with the available evidence.':s.stale?'Fan and airflow evidence suggest a cooling interruption. The temperature reading needs verification.':'Related fan, airflow, and temperature signals suggest a cooling interruption. The operator still needs to verify the cause.'):'Bring the equipment and timing into the same investigation before deciding what to do next.'}</p>${grouped?`<div class="pp-issue-facts"><span>Equipment<strong>CRAH-02</strong></span><span>Affected area<strong>Hall 02</strong></span><span>Assessment<strong>Suggested cause</strong></span><span>Fresh signals<strong>${d.fresh} of ${d.count}</strong></span></div>${s.stale?hint('Data quality needs attention','Verify the stale point before relying on the temperature trend.','warn'):''}${s.response?`<div class="pp-response-reference"><span class="pp-kicker">RESPONSE REFERENCE ATTACHED</span><h4>EOP-003 / Cooling investigation</h4><p>Verify measurements, confirm affected systems, and coordinate the authorized response.</p><span>Owner: example control-room role</span>${link('/platform/fieldwork','Explore the field handoff')}</div>`:action('attach-response','Attach a response reference')}`:action('group-signals','Connect the signals',!d.canGroup)}<p class="pp-fine">${d.canGroup?'No equipment is controlled by this example.':'Move the timeline forward until at least two fresh signals are available.'}</p></div></div>`;
  }

  const visibilityEvents=['Draft prepared','Review completed','Approval recorded','Work completed','Update published'];
  const visibilityRecords=[
    {step:0,title:'Source drawing',ref:'SLD-001 / Rev C',roles:['operator','auditor'],text:'Drawing referenced by the procedure.'},
    {step:1,title:'Engineer review',ref:'MOP-024 / Rev 4',roles:['operator','auditor'],text:'Findings and reviewer decisions recorded.'},
    {step:2,title:'Approved procedure',ref:'MOP-024 / Rev 4',roles:['operator','auditor','customer'],text:'Approved version for Customer A / Hall 02.'},
    {step:3,title:'Execution evidence',ref:'FIELD-018 / Completion record',roles:['operator','auditor'],text:'Example observations and witness record attached.'},
    {step:4,title:'Published customer update',ref:'NOTICE-012 / Customer A',roles:['operator','auditor','customer'],text:'Work complete. The approved customer summary is available.'},
    {step:0,title:'Internal planning discussion',ref:'Internal / Site team',roles:['operator'],text:'Working notes retained within the operator’s view.'},
    {step:0,title:'Other customer’s work',ref:'Customer B / Hall 01',roles:['operator'],text:'Outside this customer and auditor example scope.'}
  ];
  function visibleRecords(s) {return visibilityRecords.filter(r=>r.step<=s.point&&r.roles.includes(s.audience));}
  function visibilityScene(s) {
    const records=visibleRecords(s),all=visibilityRecords.filter(r=>r.step<=s.point);
    return `${group('Choose the audience',choice('data-pp-audience','operator',icon('grid')+'Operator',s.audience==='operator')+choice('data-pp-audience','customer',icon('people')+'Customer',s.audience==='customer')+choice('data-pp-audience','auditor',icon('shield')+'Auditor',s.audience==='auditor'),'pp-audience-tabs')}<div class="pp-visibility-layout"><div><div class="pp-event-header"><span class="pp-kicker">MOP-024 / HALL 02 / CUSTOMER A</span><h3>${visibilityEvents[s.point]}</h3><p>${s.audience==='operator'?'Internal view, including planning context and other work.':s.audience==='customer'?'The approved procedure and published update for Customer A.':'Source, review, approval, and execution evidence in the agreed audit scope.'}</p></div><div class="pp-event-timeline" role="group" aria-label="Choose a moment in the record">${visibilityEvents.map((e,i)=>`<button type="button" data-pp-event="${i}" aria-pressed="${i===s.point}" class="${i<=s.point?'is-past':''}"><span>0${i+1}</span><strong>${e}</strong></button>`).join('')}</div><div class="pp-shared-records">${records.length?records.map(r=>`<article>${icon(r.title.includes('Approved')?'check':'file')}<div><h4>${r.title}</h4><span>${r.ref}</span><p>${r.text}</p></div></article>`).join(''):`<div class="pp-empty">${icon('lock')}<h4>No shared record at this moment.</h4><p>Move to approval or publication to see what becomes available to the customer.</p></div>`}</div></div><aside class="pp-permission-card"><span class="pp-kicker">${s.audience.toUpperCase()} VIEW</span><div class="pp-permission-count"><strong>${records.length}</strong><span>of ${all.length} example<br>records visible</span></div><div class="pp-permission-scope"><span>Site<strong>North Campus</strong></span><span>Audience scope<strong>${s.audience==='operator'?'Site operations':'Customer A / Hall 02'}</strong></span><span>Internal notes<strong>${s.audience==='operator'?'Included':'Excluded'}</strong></span><span>Other customer records<strong>${s.audience==='operator'?'Included':'Excluded'}</strong></span></div><p>Access is part of the workflow, alongside who approves the record and who publishes the update.</p><p class="pp-fine">This is an illustrative audience filter. Production authorization must be enforced and tested in the deployed system.</p></aside></div>`;
  }

  const maintenanceTasks=[['ups-a','UPS-A','Inspection work package','OEM-UPS / Example quarterly task'],['ups-b','UPS-B','Inspection work package','OEM-UPS / Example quarterly task'],['cooling','CRAH-02','Cooling service review','OEM-CRAH / Example task interval']];
  const dayNames=['Mon 14','Tue 15','Wed 16','Thu 17'];
  function maintenanceReadiness(s) {const conflict=s.days['ups-a']===s.days['ups-b'];return {conflict,ready:!conflict&&s.parts&&s.vendor};}
  function maintenanceScene(s) {
    const d=maintenanceReadiness(s),task=maintenanceTasks.find(t=>t[0]===s.asset);
    return `<div class="pp-maintenance-layout"><div class="pp-planner"><div class="pp-detail-top"><span class="pp-kicker">ILLUSTRATIVE WEEK / SEPTEMBER</span>${pill(d.conflict?'1 dependency conflict':'Separate work windows',d.conflict?'amber':'')}</div><div class="pp-schedule"><div class="pp-schedule-head"><span>Equipment</span>${dayNames.map(d=>`<span>${d}</span>`).join('')}</div>${maintenanceTasks.map(([k,n])=>`<div class="pp-schedule-row"><button type="button" data-pp-maintenance-asset="${k}" aria-pressed="${s.asset===k}">${n}</button>${dayNames.map((day,i)=>`<div>${s.days[k]===i?`<button type="button" data-pp-maintenance-asset="${k}" class="pp-scheduled-task ${d.conflict&&k!=='cooling'?'has-conflict':''} ${s.asset===k?'is-selected':''}" aria-label="Select ${n}, scheduled ${day}">${icon(k==='cooling'?'wave':'grid')}<span>Work</span></button>`:''}</div>`).join('')}</div>`).join('')}</div>${d.conflict?hint('Shared resilience dependency','UPS-A and UPS-B are in the same illustrative work window. Select a task and move it to a different day.','warn'):hint('The example overlap is resolved','Different dates resolve this single illustrated conflict. The site still needs to review the actual work and operating conditions.')}<div class="pp-package-prerequisites"><span class="pp-field-label">Work-package prerequisites</span>${check('maintenance-parts','Required example parts are available',s.parts)}${check('maintenance-vendor','Vendor qualification and coverage confirmed',s.vendor)}</div></div><aside class="pp-record-panel"><span class="pp-kicker">SELECTED WORK PACKAGE</span><h3>${task[1]}</h3><p>${task[2]}</p><div class="pp-record-reference">${icon('file')}<span>${task[3]}</span></div><span class="pp-field-label">Move this task to</span>${group('Choose a maintenance day',dayNames.map((day,i)=>choice('data-pp-day',i,day,s.days[s.asset]===i)).join(''),'pp-day-choices')}<div class="pp-readiness-lines"><span>${icon(d.conflict?'close':'check')}Dependency window ${d.conflict?'needs review':'separated'}</span><span>${icon(s.parts?'check':'close')}Parts ${s.parts?'confirmed':'not confirmed'}</span><span>${icon(s.vendor?'check':'close')}Vendor ${s.vendor?'confirmed':'not confirmed'}</span></div>${s.prepared?hint('Example package prepared','Schedule, source, parts, and vendor references are assembled for the site’s review. This is not approval to execute.'):action('prepare-package','Prepare example package',!d.ready)}<p class="pp-fine">Intervals, dates, and checks are fictional. They are not maintenance recommendations for real equipment.</p></aside></div>`;
  }

  const portfolioSites=[
    {key:'north',name:'North Campus',code:'DC-01',stage:'Steady-state operations',review:8,overdue:2,limit:500,context:'Two reviews are waiting for source clarification. One customer is approaching its contractual load.'},
    {key:'east',name:'East Campus',code:'DC-02',stage:'New hall entering service',review:3,overdue:0,limit:500,context:'New-hall procedures are moving through the first review cycle. Keep commissioning context in the comparison.'},
    {key:'south',name:'South Campus',code:'DC-04',stage:'Facility-management transition',review:5,overdue:1,limit:500,context:'The incoming team is reconciling procedure ownership and an inherited open maintenance item.'},
    {key:'west',name:'West Campus',code:'DC-03',stage:'Steady-state operations',review:2,overdue:0,limit:500,context:'Review records are available. Customer demand is unavailable in this example and is not counted as zero.'}
  ];
  function portfolioOrder(s) {return [...portfolioSites].sort((a,b)=>s.metric==='capacity'?((s.demands[b.key]??-Infinity)-(s.demands[a.key]??-Infinity)):b[s.metric=== 'review'?'review':'overdue']-a[s.metric==='review'?'review':'overdue']);}
  function portfolioScene(s) {
    const site=portfolioSites.find(x=>x.key===s.site),demand=s.demands[s.site],capacity=s.metric==='capacity',queue=s.metric==='review',metric=queue?'Open reviews':capacity?'Contract use':'Overdue work',total=capacity?'3 / 4':queue?'18':'3';
    return `${group('Choose a portfolio metric',choice('data-pp-metric','review','Review queue',queue)+choice('data-pp-metric','overdue','Overdue work',s.metric==='overdue')+choice('data-pp-metric','capacity','Customer headroom',capacity),'pp-situation-tabs')}<div class="pp-portfolio-layout"><div class="pp-portfolio-table-wrap"><div class="pp-portfolio-total"><div><span class="pp-kicker">PORTFOLIO / EXAMPLE SNAPSHOT</span><h3>${capacity?'Make the capacity conversation visible.':queue?'Where is review work waiting?':'Which work needs a closer look?'}</h3></div><div><strong>${total}</strong><span>${capacity?'sites with demand data':queue?'open reviews':'overdue tasks'}</span></div></div><div class="pp-table-scroll"><table class="pp-site-table"><thead><tr><th scope="col">Facility</th><th scope="col">Operating context</th><th scope="col">${metric}</th></tr></thead><tbody>${portfolioOrder(s).map(row=>`<tr class="${row.key===s.site?'is-selected':''}"><th scope="row"><button type="button" data-pp-site="${row.key}" aria-pressed="${row.key===s.site}"><span>${row.name}</span><small>${row.code}</small></button></th><td>${row.stage}</td><td>${capacity?(s.demands[row.key]===null?'<span class="pp-missing">Unavailable</span>':`${num(s.demands[row.key]/row.limit*100)}<small>%</small>`):row[queue?'review':'overdue']}</td></tr>`).join('')}</tbody></table></div><p class="pp-table-caption">Select a facility to inspect its context. ${capacity?'Demand is shown for one illustrative customer per reporting site.':'Counts use the same example definition; they do not measure overall site quality.'}</p></div><aside class="pp-portfolio-inspector"><span class="pp-kicker">${site.code} / THE RECORD BEHIND THE NUMBER</span><h3>${site.name}</h3><p>${site.context}</p>${capacity?(demand===null?`<div class="pp-empty">${icon('wave')}<h4>No demand reading available.</h4><p>Resolve the source or mapping before drawing a capacity conclusion.</p></div>`:`<div class="pp-headroom-value"><strong>${num(Math.abs(site.limit-demand))}<span>kW</span></strong><p>${demand>site.limit?'above the contractual limit':'below the contractual limit'}</p></div>${range('pp-demand','Customer peak demand',250,550,5,demand,'kW')}<div class="pp-contract-meter"><i style="width:${Math.min(demand/site.limit*100,100)}%"></i></div><div class="pp-chart-labels"><span>${num(demand/site.limit*100)}% of contract</span><span>${site.limit} kW limit</span></div>${hint(demand>=450?'Start a customer conversation':'Room in the selected contract',demand>=450?'Review demand history and the customer’s plans with the account owner.':'Continue to monitor the customer’s plans and measured demand.',demand>site.limit?'warn':'')}`):`<div class="pp-portfolio-records"><div>${icon('file')}<span><strong>${queue?'MOP-024 / Source clarification':site.overdue?'MAINT-012 / Supporting record':'No overdue tasks in this snapshot'}</strong><small>${queue?'Author response needed':site.overdue?'Review the due date and work history':'The example reports zero overdue work.'}</small></span></div><div>${icon('people')}<span><strong>${site.stage}</strong><small>Keep local responsibilities in view</small></span></div></div>${link(queue?'/platform/review':'/platform/maintenance',queue?'Explore the review workflow':'Explore maintenance planning')}`}${capacity?'<p class="pp-fine">Contractual headroom is not verified physical capacity. Check electrical, cooling, space, and resilience constraints before making a commitment.</p>':''}</aside></div>`;
  }

  const scenes={overview:overviewScene,procedures:procedureScene,review:reviewScene,'site-model':siteModelScene,fieldwork:fieldScene,telemetry:telemetryScene,visibility:visibilityScene,maintenance:maintenanceScene,portfolio:portfolioScene};
  function renderScene(key,s) {return scenes[key](s);}
  function renderPlatformPage(p) {
    const planned=['maintenance','portfolio'].includes(p.key),query=new URLSearchParams({workflow:p.workflow,context:p.request}),demo='/demo?'+query.toString();
    const related=p.key==='overview'?modules:modules.filter(m=>m[0]!==p.key).filter(m=>({procedures:['site-model','review','fieldwork'],review:['procedures','site-model','visibility'],'site-model':['procedures','review','telemetry'],fieldwork:['procedures','review','visibility'],telemetry:['site-model','fieldwork','visibility'],visibility:['review','fieldwork','portfolio'],maintenance:['site-model','procedures','portfolio'],portfolio:['review','maintenance','visibility']}[p.key]||[]).includes(m[0]));
    return `<article class="pp-page pp-${p.key}" data-pp-page="${p.key}"><div class="wrap pp-breadcrumb"><nav aria-label="Breadcrumb"><a href="/">Entangl</a><span>/</span>${p.key==='overview'?'<span aria-current="page">Platform</span>':`<a href="/platform">Platform</a><span>/</span><span aria-current="page">${esc(p.name)}</span>`}</nav><a href="#pp-questions">Buyer questions${icon('down')}</a></div><header class="pp-hero wrap"><div><span class="pp-kicker">${esc(p.eyebrow)}</span><h1>${headline(p.title)}</h1></div><div class="pp-hero-intro"><p>${esc(p.lead)}</p><div class="pp-hero-actions">${link(demo,p.cta,'btn btn-dark')}${link('#interactive-example',p.demoLabel)}</div></div><div class="pp-promises">${p.pills.map((t,i)=>`<span><small>0${i+1}</small>${esc(t)}</span>`).join('')}</div></header>
      <section class="pp-demo-section" id="interactive-example" aria-labelledby="pp-demo-title"><div class="wrap"><div class="pp-section-heading"><div><span class="pp-kicker">${planned?'INTERACTIVE CONCEPT / PLANNED WORKFLOW':'EXPLORE AN INTERACTIVE EXAMPLE'}</span><h2 id="pp-demo-title">${headline(p.demoTitle)}</h2></div><p>${esc(p.demoIntro)}</p></div><div class="pp-demo-frame"><div class="pp-demo-toolbar"><span>${icon('mark')}ENTANGL <i>/</i> ${esc(p.name.toUpperCase())}</span><button type="button" data-pp-action="reset" aria-label="Reset the ${esc(p.name)} example">${icon('reset')}Reset example</button></div><div class="pp-scene" id="pp-scene">${renderScene(p.key,clone(defaults[p.key]))}</div><div class="pp-demo-disclosure">${icon('file')}<span>Scripted, interactive preview. All facility records, tasks, measurements, and decisions are illustrative.</span></div></div></div></section>
      <section class="pp-value-section wrap" id="pp-value"><div class="pp-section-heading"><div><span class="pp-kicker">WHAT CHANGES FOR YOUR TEAM</span><h2>${headline(p.valueTitle)}</h2></div><p>${esc(p.valueIntro)}</p></div><div class="pp-value-grid">${p.value.map(([i,t,c])=>`<article><span class="pp-value-icon">${icon(i)}</span><h3>${esc(t)}</h3><p>${esc(c)}</p></article>`).join('')}</div></section>
      <section class="pp-detail-section"><div class="wrap pp-detail-layout"><div class="pp-detail-heading"><span class="pp-kicker">THE DETAILS THAT MATTER</span><h2>${headline(p.detailTitle)}</h2><p>${esc(p.detailIntro)}</p>${link('/enterprise/integrations','Discuss systems and integrations')}</div><div class="pp-detail-grid">${p.detail.map(([t,c],i)=>`<article><span class="pp-detail-number">0${i+1}</span><h3>${esc(t)}</h3><p>${esc(c)}</p></article>`).join('')}</div></div></section>
      <section class="pp-evaluate-section wrap" id="pp-evaluate"><header><span class="pp-kicker">PROVE IT ON YOUR SITE</span><h2>A useful conversation<br><em>starts with real work.</em></h2><p>${planned?'Shape the proposed workflow around your actual records, constraints, and acceptance criteria.':'Choose a representative task, record the baseline, and agree what a useful result must demonstrate.'}</p>${link('/evaluate','Open the evaluation planner')}</header><div class="pp-evaluation-lists"><div><h3>Bring to the conversation</h3><ul>${p.bring.map(t=>`<li>${icon('plus')}<span>${esc(t)}</span></li>`).join('')}</ul></div><div><h3>Measure in the evaluation</h3><ul>${p.measure.map(t=>`<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul></div></div></section>
      <section class="pp-questions wrap" id="pp-questions"><div><span class="pp-kicker">BUYER QUESTIONS</span><h2>The questions<br>behind the decision.</h2><p>Get the details clear before committing to a rollout.</p>${link('/enterprise/security','Security and deployment')}${link('/pricing','Pricing and scope')}</div><div class="pp-faq-list">${p.faq.map(([q,a],i)=>`<details ${i===0?'open':''}><summary><span>${esc(q)}</span>${icon('plus')}</summary><p>${esc(a)}</p></details>`).join('')}<div class="pp-scope"><span class="pp-kicker">WORKFLOW SCOPE</span><p>${esc(p.scope)}</p></div></div></section>
      <section class="pp-cta"><div class="wrap"><div><span class="pp-kicker">MAKE THE NEXT CONVERSATION SPECIFIC</span><h2>${headline(p.closeTitle)}</h2><p>${esc(p.closeCopy)}</p></div><div>${link(demo,p.cta,'btn btn-lime')}<span>No site files needed to book.<br>We’ll agree how to share them if an evaluation follows.</span></div></div></section>
      <nav class="pp-related wrap" aria-label="Related platform workflows"><span class="pp-kicker">${p.key==='overview'?'EXPLORE THE PLATFORM':'KEEP THE WORK CONNECTED'}</span><div>${related.map(([k,i,n,c])=>`<a href="${route(k)}"><span class="pp-related-icon">${icon(i)}</span><span><strong>${n}</strong><small>${c}</small></span>${icon('diagonal')}</a>`).join('')}</div></nav><p class="sr-only" id="pp-live" role="status" aria-live="polite" aria-atomic="true"></p></article>`;
  }

  if(typeof module==='object'&&module.exports){module.exports={renderPlatformPage,renderScene,defaults,reviewOutcome,fieldReady,telemetryData,visibleRecords,maintenanceReadiness,portfolioOrder};return;}
  const root=document.querySelector('[data-pp-page]');
  if(!root)return;
  const key=root.dataset.ppPage;
  let state=clone(defaults[key]),announceTimer;
  const $=s=>root.querySelector(s);
  // Keep native range elements mounted during a drag, including their pointer state.
  function reconcileChildren(current, fresh) {
    for(let i=0;i<fresh.childNodes.length;i++){
      const next=fresh.childNodes[i],old=current.childNodes[i];
      if(!old){current.append(next.cloneNode(true));continue;}
      if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(next.cloneNode(true));continue;}
      if(next.nodeType===3){if(old.nodeValue!==next.nodeValue)old.nodeValue=next.nodeValue;continue;}
      if(next.nodeType!==1)continue;
      for(const attr of [...old.attributes])if(!next.hasAttribute(attr.name))old.removeAttribute(attr.name);
      for(const attr of [...next.attributes])if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);
      reconcileChildren(old,next);
    }
    while(current.childNodes.length>fresh.childNodes.length)current.lastChild.remove();
  }
  function draw(message='Example updated.') {
    const active=document.activeElement,focusId=root.contains(active)?active.id:null;
    const selector=root.contains(active)?[...active.attributes].filter(a=>a.name.startsWith('data-pp-')).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(''):'';
    if(active?.matches('input[type="range"]')&&root.contains(active)){
      const fresh=document.createElement('div');fresh.innerHTML=renderScene(key,state);reconcileChildren($('#pp-scene'),fresh);
    }else $('#pp-scene').innerHTML=renderScene(key,state);
    const next=focusId?document.getElementById(focusId):selector?$(selector):null;
    if(next&&!next.disabled)next.focus({preventScroll:true});
    clearTimeout(announceTimer);announceTimer=setTimeout(()=>{$('#pp-live').textContent=message;},150);
  }
  function set(attr,callback) {root.addEventListener('click',e=>{const b=e.target.closest('['+attr+']');if(!b)return;callback(b.getAttribute(attr));draw();});}
  set('data-pp-path',v=>{state.path=v;if(!paths[v].nodes.includes(state.node))state.node=paths[v].nodes[0];});
  set('data-pp-node',v=>state.node=v);
  set('data-pp-procedure-type',v=>state.type=v);
  set('data-pp-finding',v=>{state.finding=Number(v);state.accepting=false;state.reason='';});
  set('data-pp-asset',v=>state.asset=v);
  set('data-pp-evidence',v=>state.evidence=v);
  set('data-pp-field-equipment',v=>state.equipment=v);
  set('data-pp-field-observation',v=>state.observation=v);
  set('data-pp-field-mode',v=>state.mode=v);
  set('data-pp-audience',v=>state.audience=v);
  set('data-pp-event',v=>state.point=Number(v));
  set('data-pp-maintenance-asset',v=>{state.asset=v;state.prepared=false;});
  set('data-pp-day',v=>{state.days[state.asset]=Number(v);state.prepared=false;});
  set('data-pp-metric',v=>state.metric=v);
  set('data-pp-site',v=>state.site=v);
  root.addEventListener('click',e=>{
    const button=e.target.closest('[data-pp-action]');if(!button||button.disabled)return;
    const action=button.dataset.ppAction;
    if(action==='reset'){state=clone(defaults[key]);draw('Example reset.');return;}
    if(action==='request-revision'){state.decisions[state.finding]='revision';state.reasons[state.finding]='';state.accepting=false;state.submitted=false;}
    if(action==='accept-finding'){state.accepting=true;state.reason=state.reasons[state.finding];}
    if(action==='save-reason'){if(!state.reason.trim())return;state.decisions[state.finding]='accepted';state.reasons[state.finding]=state.reason.trim();state.accepting=false;state.submitted=false;}
    if(action==='submit-review'){if(!reviewOutcome(state).ready)return;state.submitted=true;}
    if(action==='field-next'){if(!fieldReady(state))return;if(state.step===3)state.done=true;else state.step++;}
    if(action==='field-back')state.step=Math.max(0,state.step-1);
    if(action==='field-reset')state={...clone(defaults.fieldwork),mode:state.mode};
    if(action==='group-signals'){if(!telemetryData(state).canGroup)return;state.grouped=true;}
    if(action==='attach-response')state.response=true;
    if(action==='prepare-package'){if(!maintenanceReadiness(state).ready)return;state.prepared=true;}
    draw();
    if(action==='accept-finding')$('#pp-review-reason')?.focus({preventScroll:true});
    if(action==='field-next'||action==='field-back'||action==='field-reset'){
      const h=$('.pp-tablet-task h3')||$('.pp-field-complete h3');h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true});
    }
  });
  root.addEventListener('change',e=>{
    const el=e.target,select=el.dataset.ppSelect,ck=el.dataset.ppCheck;
    if(select==='procedure-site')state.site=el.value;
    if(select==='template')state.template=el.value;
    if(ck?.startsWith('source-'))state.sources[ck.slice(7)]=el.checked;
    if(ck==='drawing-revised')state.revised=el.checked;
    if(ck==='field-witness')state.witness=el.checked;
    if(ck==='telemetry-stale'){state.stale=el.checked;state.response=false;}
    if(ck==='maintenance-parts'){state.parts=el.checked;state.prepared=false;}
    if(ck==='maintenance-vendor'){state.vendor=el.checked;state.prepared=false;}
    if(select||ck)draw();
  });
  root.addEventListener('input',e=>{
    const el=e.target;
    if(el.dataset.ppText==='review-reason'){
      state.reason=el.value;const save=$('[data-pp-action="save-reason"]');if(save)save.disabled=!state.reason.trim();return;
    }
    if(el.dataset.ppRange==='pp-telemetry-time'){
      state.time=Number(el.value);if(!telemetryData(state).canGroup){state.grouped=false;state.response=false;}draw(`${telemetryData(state).count} example signals available.`);
    }
    if(el.dataset.ppRange==='pp-demand'){
      state.demands[state.site]=Number(el.value);draw(`Customer demand ${el.value} kilowatts against a 500 kilowatt contract.`);
    }
  });
})();
