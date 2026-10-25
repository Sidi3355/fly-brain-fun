// The lifecycle spine: six moments in the life of one facility, on one plan.
// Content is the original site's lifecycle story, unchanged in substance.
import { esc, icon } from '../kit.mjs';
import { plan } from './plan.mjs';

export const MOMENTS = [
  { id: 'launch', name: 'Bring it live', era: 'Day one', title: 'Open with the confidence to operate.', copy: 'Turn a finished building into a facility your team is ready to run.', tags: ['Commissioning', 'Readiness', 'Preventive maintenance'],
    features: [['Close the document gaps', 'AI organizes as-builts, manuals and test records, and identifies what is missing.'], ['Clear the readiness gates', 'Prepare procedures and tasks, check the evidence, and resolve the decisions before go-live.'], ['Build the maintenance plan', 'Create preventive schedules from your equipment records and manufacturer requirements.']] },
  { id: 'operate', name: 'Run the facility', era: 'Every day', title: 'Give every shift a clear plan.', copy: 'Connect the procedure, the person and the part before work starts.', tags: ['Procedures', 'iPad execution', 'Inventory'],
    features: [['Generate and review procedures', 'Create site-specific MOPs, SOPs and EOPs with the source evidence close at hand.'], ['Take the work to the floor', 'Use equipment maps and the iPad app to execute approved work and capture readings, photos and sign-off.'], ['Stay ahead of maintenance', 'Coordinate preventive schedules, inventory, critical spares and vendor work.']] },
  { id: 'incident', name: 'Handle an incident', era: 'When it matters', title: 'Turn alarms into a coordinated response.', copy: 'Know what changed, what it affects and what your team needs to do next.', tags: ['AI telemetry', 'Alarm triage', 'Response'],
    features: [['Find the issue behind the alarms', 'AI connects telemetry and related alarms to the equipment and the issue that needs attention.'], ['Bring the procedure into the response', 'Attach the relevant response procedure, affected systems and required checks to the issue.'], ['Coordinate from anywhere', 'Assign responders, execute on iPad and keep remote teams and affected customers informed.']] },
  { id: 'people', name: 'Transfer facility management', era: 'The next operator', title: 'Keep the knowledge when responsibility changes.', copy: 'Give the incoming operator the context to run the same site with confidence.', tags: ['Qualifications', 'Knowledge transfer', 'Training'],
    features: [['Expose qualification gaps', 'See who is ready, which site inductions remain and where coverage needs attention.'], ['Transfer the way the site works', 'Carry over procedures, missing work instructions, equipment history, open work and vendor knowledge.'], ['Prepare the incoming team', 'Train new team members on site-specific procedures and verify readiness before responsibilities transfer.']] },
  { id: 'grow', name: 'Grow the business', era: 'What comes next', title: 'See the capacity behind the next opportunity.', copy: 'Connect the operating reality of your facility to customer growth.', tags: ['Capacity', 'Contract limits', 'Customer visibility'],
    features: [['Understand the constraints', 'Connect demand, power, cooling and planned expansion to the capacity you can discuss with customers.'], ['Grow existing accounts', 'Compare utilization with contract limits and identify the next upsell conversation.'], ['Give customers a clear view', 'Share agreed operating information, maintenance updates and reports through customer access.']] },
  { id: 'prove', name: 'Prove & transfer', era: 'Through every change', title: 'Make your operating history easy to trust.', copy: 'Give auditors, insurers and prospective owners evidence they can follow.', tags: ['Assurance', 'Insurance', 'Acquisitions'],
    features: [['Support assurance and audits', 'Connect completed work, approvals, incidents and source documents in a traceable record.'], ['Prepare for insurance reviews', 'Bring the condition, maintenance and incident history of the facility into one evidence set.'], ['Carry the history into an acquisition', 'Give a new owner the operating context, open obligations and knowledge behind the asset.']] },
];

export const RECORDS = [
  { when: 'DAY 01', title: 'Accepted into service', text: 'Commissioning checks, approved procedures, and the named operating team.' },
  { when: 'MONTH 03', title: 'Maintenance completed', text: 'The approved work pack, technician sign-off, and captured readings.' },
  { when: 'MONTH 08', title: 'Incident reviewed', text: 'Alarm history, response decisions, restoration checks, and follow-up actions.' },
  { when: 'YEAR 02', title: 'Facility management transferred', text: 'Transferred responsibilities, qualifications, supplier coverage, and open work.' },
  { when: 'YEAR 04', title: 'Expansion proposed', text: 'The capacity case, customer requirements, engineering reviews, and open decisions.' },
];

export const AUDIENCES = [
  ['operator', 'Operator', 'The full operating record', 'Equipment history, work ownership, open risks, and the source behind each decision.', 'All site records'],
  ['customer', 'Customer', 'The view for Customer A', 'Relevant maintenance, service-impact notices, agreed procedures, and contract information.', 'Customer A scope'],
  ['auditor', 'Auditor', 'Evidence behind the control', 'Approved versions, signatures, timestamps, exceptions, and corrective actions.', 'Control evidence'],
  ['insurer', 'Insurer', 'A record of risk and action', 'Equipment condition, completed maintenance, risk recommendations, and incident evidence.', 'Risk evidence'],
  ['acquirer', 'Acquirer', 'Know what comes with the site', 'Asset condition, deferred work, service obligations, and the history behind the operating plan.', 'Due diligence scope'],
];

const act = (name, label) => `<button class="lf-act" type="button" data-lf-act="${name}"><span>${label}</span>${icon('arrow')}</button>`;
const seg = (name, items, current) => `<div class="seg" role="group" aria-label="${esc(name)}">${items.map(([v, l]) => `<button type="button" data-lf-${name.split(' ')[0].toLowerCase()}="${v}" aria-pressed="${v === current}">${l}</button>`).join('')}</div>`;

function interaction(i) {
  switch (i) {
    case 0: return `<div class="lf-gauge"><div class="lf-gauge-top"><span class="label">Readiness gates</span><span class="lf-state" data-show-pre>4 checks remaining</span><span class="lf-state is-ok" data-show-post>Ready to operate</span></div>
      <p class="lf-big"><b data-lf-gates>28</b><span>/ 32</span></p>
      <div class="lf-track" role="progressbar" aria-label="Readiness gates completed" aria-valuemin="0" aria-valuemax="32" aria-valuenow="28">${Array.from({ length: 32 }, (_, k) => `<i class="${k < 28 ? 'is-done' : ''}"></i>`).join('')}</div>
      <p class="lf-note" data-show-pre>Cooling acceptance is awaiting its witness record.</p><p class="lf-note" data-show-post>Cooling evidence accepted. The first racks are live.</p></div>
      ${act('launch', '<span data-show-pre>Verify the cooling test</span><span data-show-post>Replay commissioning</span>')}`;
    case 1: return `${seg('Work order', [['ups', 'UPS inspection'], ['cooling', 'Cooling service']], 'ups')}
      <dl class="lf-rows"><div><dt>Work order</dt><dd><span data-show-ups>WO-041 · Inspect UPS-B</span><span data-show-cooling>WO-042 · Inspect the cooling plant</span></dd></div>
      <div><dt>Assigned to</dt><dd><span data-show-ups>Qualified site technician</span><span data-show-cooling>Cooling specialist</span></dd></div>
      <div><dt>Approved procedure</dt><dd class="code"><span data-show-ups>MOP-024 / Rev C</span><span data-show-cooling>MOP-031 / Rev B</span></dd></div>
      <div><dt>Required item</dt><dd><span data-show-ups>Test instrument · In date</span><span data-show-cooling>Filter kit · Reserved</span></dd></div>
      <div><dt>Work evidence</dt><dd><span data-show-open>Awaiting completion</span><span class="is-ok" data-show-done>Readings &amp; sign-off captured</span></dd></div></dl>
      ${act('work', '<span data-show-open>Complete the work order</span><span data-show-done>Replay this work order</span>')}`;
    case 2: return `<div class="lf-chain"><div><b>7</b><span>Related alarms</span></div>${icon('arrow')}<div><b>1</b><span>Actionable issue</span></div>${icon('arrow')}<div>${icon('procedure')}<span>Procedure attached</span></div></div>
      <div class="lf-temp"><span class="label">Hall 02 · supply temperature</span><p class="lf-big"><b data-lf-temp>31.2</b><span>°C</span></p><span class="lf-state" data-show-fault>Responding</span><span class="lf-state is-ok" data-show-recovered>Recovered</span></div>
      ${act('incident', '<span data-show-fault>Run the recovery scenario</span><span data-show-recovered>Replay the cooling incident</span>')}`;
    case 3: return `${seg('Team view', [['people', 'Team'], ['vendors', 'Vendors'], ['parts', 'Parts']], 'people')}
      <div class="lf-transfer"><span>Outgoing operator</span>${icon('arrow')}<b>Incoming operator</b></div>
      <dl class="lf-rows"><div><dt>Site records retained</dt><dd class="code">248</dd></div><div><dt>Open readiness items</dt><dd><span data-show-handover-pre><span data-show-people>2 site inductions</span><span data-show-vendors>1 escalation handover</span><span data-show-parts>1 stock verification</span></span><span class="is-ok" data-show-handover-post>None in this example</span></dd></div></dl>
      <p class="lf-note" data-show-handover-pre><span data-show-people>Qualifications, procedures and open work carry into the handover.</span><span data-show-vendors>Service scope, contacts and escalation paths move with the site.</span><span data-show-parts>Critical spares and reserved parts stay connected to the work.</span></p><p class="lf-note" data-show-handover-post>The incoming team is on duty. The site history stays.</p>
      ${act('handover', '<span data-show-handover-pre>Complete management transfer</span><span data-show-handover-post>Replay management transfer</span>')}`;
    case 4: return `<div class="lf-demand"><label class="label" for="lf-demand">Customer A peak demand</label><p class="lf-big"><output id="lf-demand-out" for="lf-demand">800</output><span>kW</span></p>
      <input id="lf-demand" type="range" min="400" max="1400" step="25" value="800" aria-describedby="lf-demand-help">
      <div class="lf-meter"><i style="width:40%"></i><b title="Contract limit" style="left:60%"></b></div>
      <div class="lf-meter-labels lf-meter-3"><span>400 kW</span><span style="left:60%">1,000 kW contract</span><span>1,400 kW</span></div>
      <p class="lf-note" id="lf-demand-help"><span data-lf-status>Within the example contract</span> · <span class="code" data-lf-pct>80%</span> of contract</p></div>
      <dl class="lf-rows"><div><dt>Facility capacity</dt><dd class="code"><span data-show-current>2.4 MW · example</span><span data-show-expanded>4.0 MW · proposed</span></dd></div></dl>
      ${act('expansion', '<span data-show-current>Preview a new data hall</span><span data-show-expanded>See the current facility</span>')}
      <p class="lf-fine">Expansion does not change the customer’s contract. Engineering and commercial review remain separate decisions.</p>`;
    default: return `<div class="lf-audience"><label class="label" for="lf-audience">View the record as</label><select id="lf-audience">${AUDIENCES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      <div class="lf-aud-card"><span class="stamp flat" data-lf-aud-scope>${AUDIENCES[0][4]}</span><h4 data-lf-aud-title>${AUDIENCES[0][2]}</h4><p data-lf-aud-copy>${AUDIENCES[0][3]}</p></div>
      <div class="lf-record"><p class="lf-record-when code" data-lf-rec-when>${RECORDS[0].when}</p><p class="lf-record-title" data-lf-rec-title>${RECORDS[0].title}</p><p class="lf-note" data-lf-rec-text>${RECORDS[0].text}</p>
      <label class="sr-only" for="lf-record">Scrub through the site history</label><input id="lf-record" type="range" min="0" max="4" step="1" value="0" aria-valuetext="${RECORDS[0].when}: ${RECORDS[0].title}"><div class="lf-meter-labels"><span>Day 01</span><span>Year 04</span></div></div>
      <p class="lf-fine">Illustrative audience views. This demo contains no private customer records.</p>`;
  }
}

const CAPTIONS = ['Commissioning crews are testing the facility.', 'UPS inspection: the panel opens for the technician.', 'Cooling fault. Responders arrive while Hall 02 heats up.', 'Outgoing and incoming teams meet on the same site.', 'Customer demand grows inside the existing data halls.', 'An evidence-led site walk connects the records to the equipment.'];

export function lifecycle({ sheet = 'G-001', headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `<div class="lf" data-lf data-moment="0" data-launch="pre" data-work="ups" data-workdone="open" data-incident="fault" data-team="people" data-handover="pre" data-expansion="current" data-record="0">
  <div class="lf-spine" role="tablist" aria-label="Six moments in the life of the facility">
    ${MOMENTS.map((m, i) => `<button class="lf-tab" type="button" role="tab" id="lf-tab-${m.id}" aria-selected="${i === 0}" aria-controls="lf-panel-${m.id}" tabindex="${i === 0 ? 0 : -1}" data-lf-moment="${i}"><span class="lf-tab-n">0${i + 1}</span><span class="lf-tab-name">${esc(m.name)}</span><span class="lf-tab-era">${esc(m.era)}</span></button>`).join('')}
  </div>
  <div class="lf-body">
    <figure class="lf-plan" data-plot>
      <div class="lf-plan-scroll" tabindex="0" aria-label="Floor plan; scroll sideways to see all of it">${plan({ id: 'plan' })}</div>
      <figcaption class="lf-caption"><span class="label">Inside the facility</span><span data-lf-caption>${CAPTIONS[0]}</span></figcaption>
    </figure>
    <div class="lf-panels">
      ${MOMENTS.map((m, i) => `<section class="lf-panel" role="tabpanel" id="lf-panel-${m.id}" aria-labelledby="lf-tab-${m.id}"${i ? ' hidden' : ''} tabindex="0">
        <p class="lf-index"><span class="code">0${i + 1} / 06</span> ${esc(m.era)}</p>
        <${h} class="lf-title">${esc(m.title)}</${h}>
        <p class="lf-copy">${esc(m.copy)}</p>
        <div class="lf-try"><p class="label lf-try-label">Try it on the plan</p>${interaction(i)}</div>
        <ol class="lf-features">${m.features.map(([t, c]) => `<li><b>${esc(t)}</b><span>${esc(c)}</span></li>`).join('')}</ol>
        <p class="lf-tags">${m.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>
      </section>`).join('')}
    </div>
  </div>
  <p class="lf-foot">${icon('link')}<span>Same facility throughout: connected equipment, people, work and evidence. A demonstration of Entangl’s lifecycle vision; all scenarios and values are illustrative, and product scope is agreed for each deployment.</span></p>
</div>`;
}
