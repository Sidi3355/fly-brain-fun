// R-401 Customer evidence · R-402 A procedure review example · R-403 Buyer questions · R-404 Plan an evaluation.
import { detail, stamp, chip, icon, btn, tlink, esc, sheetHead, clauses, closeNext, rfiList, noteRefs, pad2 } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';
import { given } from '../parts/pressures.mjs';

const S = r => sheetFor(r);
const proofTrail = [{ route: '/proof/', num: 'R-401', title: 'Proof' }];

/* R-401 */
const EVIDENCE = [
  ['What needs attention before work starts?', 'The procedure references an older drawing revision. Open the source and see the decision your reviewer needs to make.', 'Illustrative example', 'PROCEDURE / MOP-024', 'Rev B in the draft. Rev C in the record.', '/proof/example/', 'Open the review example', 'Procedure review'],
  ['Did the design meet the brief?', 'Connect a requirement to drawing evidence, then inspect what is supported, what differs, and what still needs an answer.', 'Planned concept', 'DESIGN / REQUIREMENT REGISTER', 'A requirement. Its evidence. An open question.', '/lifecycle/design-and-handover/', 'Explore design & handover', 'Design review'],
  ['What changed, and what could it affect?', 'Explore related signals over the same period. Open the equipment context and the next check an operator needs to make.', 'Example data · Explore the scope', 'INCIDENT / HALL 02', 'Follow a sample signal from 09:00 to 09:12.', '/platform/telemetry/', 'Explore AI telemetry', 'Alarm investigation'],
  ['What can my customer see?', 'See the same procedure through operator, customer, and auditor views, with an explicit boundary around the information shared.', 'Illustrative · Explore the scope', 'VISIBILITY / MOP-024', 'Same record. A different sharing boundary.', '/platform/visibility/', 'Explore the shared view', 'Customer review'],
  ['Who should carry out the work?', 'Explore a planned way to compare invited bids against one scope, then keep the decision connected to the delivery record.', 'Planned concept', 'PROCUREMENT / SERVICE SCOPE', 'Compare the scope behind each bid.', '/lifecycle/vendors-and-rfps/', 'Explore vendors & RFPs', 'Service procurement'],
];
const proofPage = {
  route: '/proof/',
  title: 'Customer evidence and product examples | Entangl',
  description: 'Judge Entangl on a task your team understands. Look at the information used, the result, and the work required to make it useful.',
  related: ['/proof/example/', '/answers/', '/evaluate/', '/outage-report/'],
  body: () => `
${sheetHead({ sheet: S('/proof/'), kicker: 'Proof', title: 'See the work behind the claim.',
  lead: '<p>Judge Entangl on a task your team understands. Look at the information used, the result, and the work required to make it useful.</p>',
  actions: `${btn('/proof/example/', 'Open the example', 'ink')}${tlink('/demo/?request=Customer+reference', 'Request a reference')}` })}
<section class="sec" aria-labelledby="three-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'R-401', kicker: 'Three kinds of evidence', title: 'Inspect it. Ask about it. Test it yourself.', id: 'three-title', scale: '—' })}
    <ol class="ev3">
      <li><span class="code">01</span><h3 class="h3">Inspect a procedure review.</h3><p>Follow a finding from the procedure to its source and the reviewer’s decision.</p>${tlink('/proof/example/', 'Open the example')}</li>
      <li><span class="code">02</span><h3 class="h3">Ask for a relevant reference.</h3><p>Tell us the type of facility and workflow you want to evaluate. We can discuss a reference suited to that decision, subject to the customer’s agreement.</p>${tlink('/demo/?request=Customer+reference', 'Request a reference')}</li>
      <li><span class="code">03</span><h3 class="h3">Set your own test.</h3><p>Use the same procedures, source data, and success criteria to compare the workflow with how your team works today.</p>${tlink('/evaluate/', 'Plan an evaluation')}</li>
    </ol>
  </div>
</section>
<section class="sec" aria-labelledby="index-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'R-401', kicker: 'Choose a moment. See the evidence.', title: 'One facility. Different decisions.', id: 'index-title', scale: '—', lead: 'Follow the connection that matters to you. Each entry says what it is: an illustrative example, a planned concept, or example data within a scope you would agree.' })}
    <ol class="evidx">${EVIDENCE.map((e, i) => `<li><span class="evidx-n code">${pad2(i + 1)}</span><div class="evidx-q"><p class="label">${e[7]}</p><h3 class="h3">${esc(e[0])}</h3><p>${esc(e[1])}</p></div><div class="evidx-rec"><p class="code">${e[3]}</p><p>${esc(e[4])}</p>${stamp(e[2], /Planned/.test(e[2]) ? 'amber' : '')}</div><a class="evidx-go" href="${e[5]}"><span>${esc(e[6])}</span>${icon('arrow')}</a></li>`).join('')}</ol>
  </div>
</section>
${closeNext()}
`,
};

/* R-402 · the review example, step by step, with the reviewer's margin beside the document */
const margin = (k, t, c, next, label) => `<aside class="margin"><p class="label">${k}</p><h3 class="h3">${t}</h3><p>${c}</p>${next ? `<button type="button" class="tlink" data-rx-go="${next}"><span>${label}</span>${icon('arrow')}</button>` : ''}<p class="margin-state"><span>AI review complete</span><b>Engineer decision <span data-rx-decision>pending</span> · Approval not granted</b></p></aside>`;
const examplePage = {
  route: '/proof/example/',
  title: 'Explore a data center procedure review | Entangl',
  description: 'This example shows the questions a reviewer needs to answer before deciding what should change. It does not describe work to carry out at a real facility.',
  scripts: ['sheets'],
  related: ['/platform/review/', '/evaluate/', '/proof/'],
  body: () => `
${sheetHead({ sheet: S('/proof/example/'), trail: proofTrail, kicker: 'Illustrative example · Fictional site information', title: 'One finding. Follow the evidence.',
  lead: '<p>This example shows the questions a reviewer needs to answer before deciding what should change. It does not describe work to carry out at a real facility.</p>', actions: btn('/evaluate/', 'Plan an evaluation', 'ink') })}
<section class="sec" aria-labelledby="rx-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'R-402', kicker: 'North Campus / MOP-024 · Illustrative example', title: 'From the draft to the decision, in four steps.', id: 'rx-title', scale: '1:1' })}
    <div class="rx" data-rx>
      <div class="rx-tabs" role="tablist" aria-label="Review steps">${[['draft', 'Open draft'], ['source', 'Open source'], ['compare', 'Compare revisions'], ['decision', 'Reviewer decision']].map(([k, l], i) => `<button type="button" role="tab" id="rx-tab-${k}" aria-controls="rx-${k}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" data-rx-tab="${k}"><span class="code">${i + 1}</span>${l}</button>`).join('')}</div>
      <div class="rx-panel" role="tabpanel" id="rx-draft" aria-labelledby="rx-tab-draft">
        <article class="docsheet"><p class="label">Procedure draft · Revision 02</p><h3 class="docsheet-title">UPS-B maintenance review</h3><p class="docsheet-sub">North Campus · Hall 02</p>
          <p class="docsheet-sec code">02 / REFERENCE DOCUMENTS</p>
          <button type="button" class="docref" data-rx-go="source"><span class="code">SLD-001</span><span>Electrical one-line</span><b class="code">Revision B</b><span class="docref-cloud" aria-hidden="true"></span><span class="delta" aria-hidden="true">1</span></button>
          <p class="fine">Reference version listed in this example procedure. Confirm the applicable source before the review is completed.</p>
          <p class="docsheet-stamp">${stamp('Draft · engineer review required', 'amber')}</p></article>
        <aside class="margin"><p class="label"><span class="delta">1</span> Finding to resolve</p><h3 class="h3">A newer revision is in the site record.</h3><p>The procedure lists Rev B. The example document register contains Rev C.</p><button type="button" class="tlink" data-rx-go="source"><span>Inspect the source</span>${icon('arrow')}</button><p class="margin-state"><span>AI review complete</span><b>Engineer decision <span data-rx-decision>pending</span></b></p></aside>
      </div>
      <div class="rx-panel" role="tabpanel" id="rx-source" aria-labelledby="rx-tab-source" hidden>
        <article class="docsheet"><p class="label">Site document register</p><h3 class="docsheet-title">Electrical one-line</h3><p class="docsheet-sub code">SLD-001 · North Campus</p>
          <dl class="lf-rows"><div><dt>Current record</dt><dd class="code"><mark>Revision C</mark></dd></div><div><dt>Previous record</dt><dd class="code">Revision B</dd></div><div><dt>Equipment context</dt><dd>UPS-B / Hall 02</dd></div><div><dt>Example revision note</dt><dd>Equipment reference updated</dd></div></dl>
          <p class="docsheet-stamp">${stamp('Document record · not a live equipment state')}</p></article>
        ${margin('Source evidence', 'The source has changed.', 'A newer version exists. That alone does not establish its effect on the work. The reviewer must confirm which revision applies.', 'compare', 'Compare the two records')}
      </div>
      <div class="rx-panel" role="tabpanel" id="rx-compare" aria-labelledby="rx-tab-compare" hidden>
        <article class="docsheet"><p class="label">Compare the references</p><h3 class="docsheet-title">Same drawing. Different revisions.</h3>
          <div class="revcmp"><div><p class="label">In the draft</p><b class="revcmp-l">B</b><p class="code">MOP-024 / Reference list<br>SLD-001 · Rev B</p></div><div><p class="label">In the register</p><b class="revcmp-l is-cur">C</b><p class="code">Site document record<br>SLD-001 · Rev C</p></div></div>
          <p class="docsheet-ex">Example note: equipment reference updated. The effect on the procedure has not been assessed in this example.</p>
          <p class="docsheet-stamp">${stamp('Difference found · engineer review required', 'amber')}</p></article>
        ${margin('The next question', 'Does the change affect this procedure?', 'Confirm the applicable revision, examine the change, and record what the reviewer requires before the next review.', 'decision', 'See the reviewer decision')}
      </div>
      <div class="rx-panel" role="tabpanel" id="rx-decision" aria-labelledby="rx-tab-decision" hidden>
        <article class="docsheet"><p class="label">Illustrative review ledger</p><h3 class="docsheet-title">Keep the decision explicit.</h3>
          <ol class="find-steps"><li>Confirm which drawing revision applies.</li><li>Ask the author to resolve the source reference and assess the change.</li><li>Return the revised draft for the required review.</li></ol>
          <p class="ledger-status" data-rx-status>Example reviewer decision: request an update.</p>
          <button type="button" class="btn-mini" data-rx-record><span data-rx-record-label>Record this example decision</span>${icon('check')}</button>
          <p class="docsheet-stamp">${stamp('No live work is authorized')}</p></article>
        ${margin('The engineer makes the call', 'A review is not an approval.', 'This example records a request for an update. Your authorized people decide whether a real procedure is ready for work.')}
      </div>
      <p class="ppf-foot">${icon('file')}<span>Fictional site information. An example of how to evaluate a review.</span></p>
    </div>
  </div>
</section>
<section class="sec" aria-labelledby="shows-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'R-402', kicker: 'Reading the example', title: 'What happened, and what it shows.', id: 'shows-title', scale: '—' })}
    ${clauses([
      ['The procedure references one revision.', 'Open the document reference in the draft.'],
      ['The site record contains a newer revision.', 'Compare the reference with the document record used in this example.'],
      ['The reviewer needs to resolve the difference.', 'Confirm which revision applies, check whether the change affects the procedure, and record the decision in the review workflow.'],
      ['What this shows.', 'A useful finding makes the issue, the source, and the next decision easy to inspect. The engineer determines the effect on the work.'],
      ['What would you test?', 'Bring a procedure your team knows well. We will agree the source data and the checks before the evaluation.'],
    ])}
  </div>
</section>
${closeNext()}
`,
};

/* R-403 · Buyer questions, as a searchable RFI log */
const ANSWERS = [
  ['Fit', 'What does Entangl do today?', 'The core workflow is creating and reviewing procedures using facility information. The wider lifecycle includes workflows we are scoping or developing. We will show the current scope for your deployment.'],
  ['Fit', 'Why use it instead of a general AI assistant?', 'Evaluate the whole job: equipment context, source information, findings, review decisions, and the path to an approved result. Compare both approaches on the same procedure and measure the correction work.'],
  ['Procedures', 'Can it review the MOPs we already use?', 'Yes. Existing-procedure review is a core workflow. We will test your document format and agreed checks with a representative procedure.'],
  ['Procedures', 'Can we use our own templates?', 'Bring the exact template and output requirements. We will confirm the configuration and check that the exported result fits your process.'],
  ['Site data', 'What information do you need?', 'The starting set usually includes current one-lines, asset information, relevant manuals and sequences of operation, procedures, templates, and site rules. The final list depends on the first workflow.'],
  ['Site data', 'What if some information is missing?', 'We will identify the gaps with your team and narrow the evaluation to what can be checked. Missing site information needs a clear owner and a resolution plan.'],
  ['Workflows', 'Who approves the work?', 'Your authorized people. A generated procedure or completed AI review does not authorize a field action or guarantee that a procedure is safe.'],
  ['Workflows', 'Can we keep our CMMS and approval process?', 'That can be the starting scope. Agree which system holds the approved record, then test the export or integration and its handling of revisions.'],
  ['Site data', 'Does the platform know the live equipment state?', 'A document model reflects documented or selected states. Live measurements require the relevant integration and verified point mapping.'],
  ['Security', 'Is our data used to train models?', 'We will provide the applicable written data-use terms and explain the providers and processing involved in your deployment, including any customer-specific reuse.'],
  ['Security', 'Where is it hosted?', 'We will confirm the supported deployment, region, data flow, and operating responsibilities as part of your security review.'],
  ['Buying', 'What does it cost?', 'Request an itemized quote for your sites and workflows. It should show the billing unit, subscription, implementation, integrations, support, and any other charges.'],
  ['Buying', 'How do we know it is worth a rollout?', 'Set a baseline and test representative work. Measure quality, drafting and review time, correction effort, workflow completion, and total cost before deciding whether to expand.'],
];
const answersPage = {
  route: '/answers/',
  title: 'Questions about Entangl | Procedures, data, and deployment',
  description: 'Start with the decision you need to make. If the answer depends on your site, we will work through the details with you.',
  scripts: ['sheets'],
  related: ['/enterprise/security/', '/pricing/', '/evaluate/'],
  body: () => `
${sheetHead({ sheet: S('/answers/'), trail: proofTrail, kicker: 'Proof', title: 'The questions your team will ask.',
  lead: '<p>Start with the decision you need to make. If the answer depends on your site, we will work through the details with you.</p>', actions: btn('/demo/', 'Bring us your question', 'ink') })}
<section class="sec sec-tight" aria-labelledby="log-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'R-403', kicker: 'RFI log', title: 'Requests for information, answered.', id: 'log-title', scale: `${ANSWERS.length} entries` })}
    <div class="rfilog" data-rfilog>
      <div class="rfilog-tools"><label class="search"><span class="sr-only">Search the questions</span>${icon('search')}<input type="search" placeholder="Search your question" data-rfi-search autocomplete="off"></label>
        <div class="seg seg-sm rfilog-cats" role="group" aria-label="Filter by topic">${['All', 'Fit', 'Site data', 'Procedures', 'Workflows', 'Security', 'Buying'].map((c, i) => `<button type="button" data-rfi-cat="${c}" aria-pressed="${i === 0}">${c}</button>`).join('')}</div></div>
      <ol class="rfi">${ANSWERS.map(([cat, q, a], i) => { const id = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); return `<li data-cat="${cat}" data-text="${esc((q + ' ' + a).toLowerCase())}"><details id="${id}"${i === 0 ? ' open' : ''}><summary><span class="rfi-num">RFI-${pad2(i + 1)}</span><span class="rfi-q">${esc(q)}</span>${icon('pm', 'i rfi-mark')}</summary><div class="rfi-a"><p>${esc(a)}</p><p class="rfi-meta"><span class="chip">${esc(cat)}</span><button type="button" class="rfi-copy" data-copy="${id}">${icon('copy')}Copy a link to this answer</button></p></div></details></li>`; }).join('')}</ol>
      <p class="rfilog-none" data-rfi-none hidden>No questions match. Try another word or choose All.</p>
      <p class="sr-only" data-rfi-count role="status" aria-live="polite"></p>
    </div>
  </div>
</section>
${closeNext()}
`,
};

/* R-404 · Plan an evaluation: the test plan, then the calculation sheets */
const evalNotes = [
  { id: 'c-outage', text: 'Uptime Institute’s <em>Annual outage analysis 2026</em> reports the 57% finding from its 2025 annual survey. Costs are self-reported for respondents’ most recent major outage.', href: 'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2026.AnnualOutageAnalysis.pdf#page=2', link: 'Read the 2026 report' },
  { id: 'c-staff', text: '<em>Global Data Center Survey 2025</em>, Figure 15: 46% reported difficulty finding qualified candidates. This question had 650 respondents.', href: 'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf#page=25', link: 'Read the 2025 survey' },
  { id: 'c-insure', text: '$1,000,000 × 1% = $10,000 per year. This is arithmetic, not a quoted discount. FM describes engineering-led risk assessment for data centers; it does not verify an Entangl premium benefit.', href: 'https://www.fm.com/solutions/industries/data-centers', link: 'Read the insurer’s perspective' },
  { id: 'c-sep', text: 'Industry research describes the problem. The calculators use illustrative, editable assumptions and are not measured Entangl outcomes. Outage exposure, team capacity, and premium sensitivity are separate measures and are not added into a single ROI figure.' },
];
const eref = noteRefs(evalNotes);
const OUTLINE = ['Task to evaluate', 'Sites & systems', 'Baseline & sample', 'Quality checks', 'Customer effort & integrations', 'Deployment review & complete cost', 'Acceptance criteria & evidence owners', 'Next decision'];
const calcBlock = ({ id, n, title, find, givens, solution, note, research }) => `<article class="csheet" id="${id}" data-calc="${id}">
  <header class="csheet-head"><p class="code">CALC ${n}</p><h3 class="h3">${title}</h3><button type="button" class="ppf-reset" data-calc-reset aria-label="Reset ${esc(title)}">${icon('reset')}<span>Reset</span></button></header>
  <div class="calc">
    <div class="calc-row"><p class="calc-k">Given</p><div class="calc-v">${givens}</div></div>
    <div class="calc-row"><p class="calc-k">Find</p><div class="calc-v"><p>${find}</p></div></div>
    <div class="calc-row calc-sol"><p class="calc-k">Solution</p><div class="calc-v" aria-live="polite">${solution}</div></div>
    <div class="calc-row"><p class="calc-k">Note</p><div class="calc-v"><p class="fine">${note}</p></div></div>
  </div>${research || ''}
</article>`;
const evaluatePage = {
  route: '/evaluate/',
  title: 'Evaluate Entangl on your site and procedures',
  description: 'Use your own standard for a useful result. Choose the work, record the baseline, and agree what the evaluation needs to prove.',
  scripts: ['sheets', 'calc'],
  notes: evalNotes,
  related: ['/proof/example/', '/pricing/', '/enterprise/rollout/'],
  body: () => `
${sheetHead({ sheet: S('/evaluate/'), trail: proofTrail, kicker: 'Proof', title: 'Give us a task your team knows well.',
  lead: '<p>Use your own standard for a useful result. Choose the work, record the baseline, and agree what the evaluation needs to prove.</p>', actions: `${btn('/demo/?request=Site+evaluation', 'Plan my evaluation', 'ink')}${tlink('#outline', 'Print the evaluation outline', 'down')}` })}
<section class="sec" aria-labelledby="tp-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'R-404', kicker: 'Test plan', title: 'Five things to agree before you start.', id: 'tp-title', scale: '—' })}
    ${clauses([
      ['Pick work worth improving.', 'Choose representative procedures and reviews, including complex work where your engineers spend meaningful time. Include known issues and valid examples.'],
      ['Measure the whole job.', 'Track drafting, review, correction, and handoff effort. Record the issues found and missed, false positives, and whether people can complete the workflow.'],
      ['Count the cost of getting there.', 'Include customer time, implementation, integrations, support, and the subscription in the decision.'],
      ['Agree the next step before you start.', 'Define what earns a wider rollout, what needs more work, and when to stop. Record the owners of the operational, security, and budget decisions.'],
      ['Take the plan to your team.', 'Use the evaluation brief to align operations, IT, security, procurement, and the budget holder around the same scope.'],
    ])}
  </div>
</section>
<section class="sec" id="outline" aria-labelledby="ol-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'R-404', kicker: 'Available without a lead form', title: 'Take the plan to your team.', id: 'ol-title', scale: 'Print · A4 / Letter', lead: 'Fill in what you know. Your notes stay in this page and are included when you print.' })}
    <form class="outline" data-outline onsubmit="return false">
      <div class="outline-head"><p class="code">EVALUATION OUTLINE · ENTANGL</p><button type="button" class="btn btn-line" data-print>${icon('print')}<span>Print the evaluation outline</span></button></div>
      <div class="outline-grid">${OUTLINE.map((l, i) => `<p class="outline-f"><label for="ol-${i}"><span class="code">${pad2(i + 1)}</span>${l}</label><textarea id="ol-${i}" rows="3"></textarea></p>`).join('')}</div>
    </form>
  </div>
</section>
<section class="sec" id="calculations" aria-labelledby="calc-title">
  <div class="wrap">
    ${detail({ n: 3, sheet: 'R-404', kicker: 'Your numbers / your assumptions', title: 'Calculation sheets.', id: 'calc-title', scale: 'Estimate · USD', lead: `Four separate measures, each with its working shown. They use your assumptions, they are not measured Entangl outcomes, and they are never added together into one ROI figure.${eref('c-sep')}` })}
    <div class="csheets">
      ${calcBlock({ id: 'calc-value', n: '1', title: 'Value of released engineering time',
        givens: given('v-count', 'Procedures per month', 0, 100000, 1, '', 'procedures') + given('v-hourly', 'Loaded hourly cost', 0, 10000, 1, '', '$ / hour') + given('v-current', 'Current hours per procedure (drafting + review + correction)', 0, 1000, .5, '', 'hours') + given('v-expected', 'Expected hours per procedure (the same work)', 0, 1000, .5, '', 'hours') + given('v-fees', 'Annual recurring fees', 0, 100000000, 100, '', '$ / year') + given('v-setup', 'One-time setup costs', 0, 100000000, 100, '', '$') + given('v-impl', 'Customer implementation hours', 0, 100000, 1, '', 'hours'),
        find: 'Annual capacity value, first-year net estimated value, and hours released per year.',
        solution: '<p class="calc-eq">Annual capacity value = <b data-o="value">—</b></p><p class="calc-eq calc-eq-2">First-year net estimated value = <b data-o="net">—</b></p><p class="calc-eq calc-eq-2">Hours released per year = <b data-o="hours">—</b></p><p class="fine calc-status" data-o="status">Enter your inputs to calculate an estimate. Costs and negative results remain visible.</p><details class="calc-how"><summary>See the calculation</summary><p class="code">Annual capacity value = 12 × monthly procedure count × (current hours − expected hours) × hourly cost.</p><p class="code">First-year net = capacity value − recurring fees − setup cost − implementation hours × hourly cost.</p></details>',
        note: 'Use your own assumptions to estimate the value of released engineering time. Capacity value is not automatically a cash saving.' })}
      ${calcBlock({ id: 'calc-exposure', n: '2', title: 'Illustrative cost exposure',
        givens: given('x-min', 'Minutes of disruption', 0, 120, 1, 30, 'min') + given('x-rate', 'Your estimated cost per minute', 0, 1000000, 100, 5000, '$ / min'),
        find: 'Exposure over the minutes of disruption, for one event.',
        solution: '<p class="calc-eq"><span data-o="min">30</span> minutes × <span data-o="rate">$5,000</span> per minute = <b data-o="exp">$150,000</b></p>',
        note: 'Use a cost estimate for your operation. This models exposure for one event; it does not predict an outage or a reduction in risk.',
        research: `<p class="csheet-src"><b>57%</b> of respondents put their latest major outage cost above $100,000. Industry research · Uptime Institute 2026${eref('c-outage')}</p>` })}
      ${calcBlock({ id: 'calc-capacity', n: '3', title: 'A target for your evaluation',
        givens: given('k-sites', 'Sites in your portfolio', 1, 40, 1, 8, 'sites') + given('k-proc', 'Procedures per site, per month', 1, 200, 1, 12, 'jobs') + given('k-cur', 'Current effort per procedure', 0, 40, .5, 4, 'hours') + given('k-tgt', 'Target effort per procedure', 0, 40, .5, 1.5, 'hours'),
        find: 'Potential capacity recovered each month at your target.',
        solution: '<p class="calc-eq"><span data-o="sites">8</span> sites × <span data-o="proc">12</span> procedures × <span data-o="diff">2.5</span> hours recovered = <b><span data-o="rec">240</span> h / month</b></p><p class="calc-eq calc-eq-2">Current effort <span data-o="cur">384</span> h · your target <span data-o="tgt">144</span> h</p>',
        note: 'Current and target hours include preparation and review. Validate the target in an evaluation. Recovered capacity does not determine safe staffing levels.',
        research: `<p class="csheet-src"><b>46%</b> of surveyed operators struggle to find qualified candidates. Industry research · Uptime Institute 2025${eref('c-staff')}</p>` })}
      ${calcBlock({ id: 'calc-premium', n: '4', title: 'Hypothetical premium sensitivity',
        givens: given('p-prem', 'Your annual insurance premium', 0, 100000000, 1000, 1000000, '$ / year') + given('p-pct', 'Hypothetical premium reduction', 0, 10, .5, 0, '%'),
        find: 'Annual premium reduction in this scenario.',
        solution: '<p class="calc-eq"><span data-o="prem">$1,000,000</span> annual premium × <span data-o="pct">0</span>% = <b><span data-o="red">$0</span> / year</b></p><p class="calc-eq calc-eq-2">Scenario annual premium <span data-o="scen">$1,000,000</span></p>',
        note: 'The starting scenario assumes no saving. An insurer must agree any change; pricing also depends on coverage, claims, market conditions, and other risks. Entangl has no verified premium-reduction benchmark.',
        research: `<p class="csheet-src"><b>$10k</b> for each 1% premium change on an illustrative $1m annual policy. Illustrative calculation · no saving assumed${eref('c-insure')}</p>` })}
    </div>
  </div>
</section>
${closeNext()}
`,
};

export default [proofPage, examplePage, answersPage, evaluatePage];
