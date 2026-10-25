// L-104 · The connected facility: one fictional event, followed across every responsibility.
import { detail, stamp, chip, icon, btn, tlink, esc, sheetHead, clauses, pad2 } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';

const S = r => sheetFor(r);
const trail = [{ route: '/lifecycle/', num: 'L-101', title: 'Full lifecycle' }];

const SOURCES = [
  ['drawing', 'E-201 / REV. 04', 'Know what connects to what.', 'One-line diagram', 'What depends on this equipment?', 'See the connections documented for UPS-B and Hall 02. Give your reviewer a place to inspect the dependency and identify the equipment state that still needs verification.', ['UPS-B', 'Hall 02', 'Operating procedures']],
  ['asset', 'EQUIPMENT RECORD', 'The equipment. And its context.', 'Asset documentation', 'What does this asset need?', 'Associate the equipment record with the asset and its relevant documentation. Keep known relationships separate from unverified assumptions.', ['UPS-B', 'Manual', 'Service history']],
  ['signal', 'TELEMETRY FEED', 'A signal with a place to belong.', 'Site measurements · 22.6 °C · H02-INLET-02', 'What changed, and where?', 'Connect a measurement to its sensor, location, and operating context. A threshold crossing can become an issue with somewhere useful to go.', ['H02-INLET-02', 'Hall 02', 'CRAH-02']],
];
const STAGES = [
  ['Nothing to respond to yet.', 'Ready for the next signal.', 'The engineering context is connected. Introduce an alarm to follow the response.', 'Simulate an alarm', 'Introduce a simulated temperature rise. See where the signal goes next.'],
  ['A signal needs a response.', 'Temperature rise. Context attached.', 'The sample reading crossed its configured threshold. The issue brings the sensor, asset record, and response workflow together.', 'Review the response', 'A high reading is a signal, not a diagnosis. The cause is not yet established.'],
  ['A decision needs approval.', 'The next step needs your approval.', 'Review the supporting records, then authorize a non-invasive field inspection. No equipment action is proposed by this demo.', 'Approve & open field task', 'Demo approval creates a field task only. It does not authorize switching or any physical control.'],
  ['The context is in the field.', 'Same issue. Now in the field.', 'Task TSK-014 is with Jordan Lee, a fictional field engineer. The iPad has the same asset and the same response context.', 'Open the field task', 'Operator review is still required after the field record returns.'],
  ['The evidence is back.', 'The record is back. The call is still yours.', 'The sample observations are attached. A new simulated reading is 24.1 degrees Celsius. This does not establish a root cause or prove the inspection caused a change.', 'Close the demo issue', 'Closing this sample demonstrates a workflow transition, not a real safety sign-off.'],
  ['The loop is connected.', 'One response. A connected record.', 'The demo operator reviewed the returned evidence and closed ISS-014. Its context, approvals, and field observations remain in the same history.', 'Inspect the audit trail', 'The scenario is complete. The same story is now visible through the appropriate perspectives.'],
];
const LOG = [
  [1, 'Sample threshold crossed', 'Simulated sensor H02-INLET-02'], [1, 'Issue ISS-014 created', 'Configured demo workflow'],
  [2, 'Response reviewed; cause not established', 'Demo operator'],
  [3, 'Non-invasive field inspection approved', 'Demo operator'], [3, 'Task TSK-014 assigned to Jordan Lee', 'Demo workflow; fictional engineer'],
  [4, 'Sample field observations submitted', 'Jordan Lee (fictional engineer)'], [4, 'New simulated reading: 24.1 degrees Celsius', 'Demo sensor; no causal claim'],
  [5, 'Evidence reviewed; demo issue closed', 'Demo operator; not a real safety sign-off'],
];
const PERSPECTIVES = [
  ['operations', 'Operations', 'For the people running the site', 'The whole operation. In context.', 'Equipment state, open issues, and work in progress. Know what needs attention and who is carrying it forward.', 'SITE CONTEXT / ISSUES / REVIEWED WORKFLOWS'],
  ['field', 'Field engineer', 'For the people at the equipment', 'The right information. Right there.', 'Bring the approved work and the relevant equipment context to the person carrying it out.', 'ASSIGNED TASK / ASSET CONTEXT / FIELD RECORD'],
  ['customer', 'Customer', 'For the people depending on you', 'Keep customers informed.', 'Give customers their own usage and approved service updates, so they can get relevant information without chasing your operations team.', 'OWN SUITE / OWN USAGE / PUBLISHED UPDATES'],
  ['auditor', 'Auditor', 'For the people asking for evidence', 'The story is already in the record.', 'Follow the relevant signal, decision, approval, and field outcome without reconstructing the chain at audit time.', 'DEMO EVIDENCE / ACTORS / EVENT CHRONOLOGY'],
  ['commercial', 'Commercial', 'For the people planning what comes next', 'See the next capacity conversation.', 'Customer B is close to its contracted load in this sample. Review the trend and the site constraints with the account owner.', 'CONTRACTED LIMITS / MEASURED DEMAND / REVIEW'],
];
const CUSTOMERS = [
  ['Customer A', 'Suite 01', 248, 400, 62, 'Keep the conversation open.', 'There is more contractual room in this sample. Keep monitoring actual demand and the customer’s plans.', 'MONITOR USAGE'],
  ['Customer B', 'Suite 02', 465, 500, 93, 'A conversation worth starting.', 'Customer B is close to its contracted load in this sample. Review the trend and the site constraints with the account owner.', 'CAPACITY REVIEW SUGGESTED'],
  ['Customer C', 'Suite 03', 420, 600, 70, 'Plan around what comes next.', 'Current peak demand leaves contractual room. Understand the customer’s roadmap before deciding whether expansion is needed.', 'PLAN WITH THE CUSTOMER'],
];
const INTERESTS = ['Protect uptime', 'Scale operations', 'Respond faster', 'Improve daily operations', 'Build customer & auditor confidence', 'Connect operations to growth'];

export default {
  route: '/experience/',
  title: 'Entangl — Protect uptime. Move operations forward.',
  description: 'AI for data center operations. Use your site knowledge and live signals to review procedures, coordinate incident response, equip field teams, and plan customer growth.',
  scripts: ['experience', 'forms'],
  related: ['/lifecycle/', '/platform/telemetry/', '/platform/visibility/', '/platform/portfolio/'],
  body: () => `
${sheetHead({ sheet: S('/experience/'), trail, kicker: 'Illustrative workflow · example data', title: ['Keep uptime high.', 'Keep moving forward.'],
  lead: '<p>Explore the connected facility. An illustrative product story with fictional site information. Follow the same event across operations, fieldwork, customer visibility, and capacity. Confirm the supported scope for your deployment.</p>',
  actions: `${btn('#session', 'See it with your site', 'ink', 'down')}${tlink('#event', 'Follow the event', 'down')}`,
  keys: ['Your site knowledge', 'Your team in control', 'North Campus / DC-01 · illustrative facility'] })}

<section class="sec" id="context" aria-labelledby="ctx-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'L-104', kicker: 'Protect uptime before work begins', title: 'Make the next review more informed.', id: 'ctx-title', scale: '3 sources', lead: 'Your reviewers need to understand what the work affects. Generate and review procedures using your site’s engineering data, with the equipment and documentation in context.' })}
    <div class="xsrc" data-xsrc>
      <div class="xsrc-tabs" role="tablist" aria-label="Engineering sources">${SOURCES.map(([k, code, t, kind], i) => `<button type="button" role="tab" id="xs-${k}" aria-controls="xp-${k}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" data-xsrc-tab="${k}"><span class="code">${code}</span><b>${pad2(i + 1)} ${t}</b><small>${kind}</small></button>`).join('')}</div>
      ${SOURCES.map(([k, , , , q, c, links], i) => `<div class="xsrc-panel" role="tabpanel" id="xp-${k}" aria-labelledby="xs-${k}"${i ? ' hidden' : ''}><h3 class="h2">${q}</h3><p>${c}</p><p class="label">Connected to</p><ul class="xsrc-links">${links.map(l => `<li class="code">${l}</li>`).join('')}</ul></div>`).join('')}
      <p class="caution">Drawings describe design intent. Live equipment state still needs a current, trusted source.</p>
    </div>
  </div>
</section>

<section class="sec" id="event" aria-labelledby="ev-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'L-104', kicker: 'Respond faster when every handoff matters', title: 'An alarm arrives. Give your team a way forward.', id: 'ev-title', scale: 'ISS-014 · fictional', lead: 'Reduce the search for context between an alarm and a response. Bring the affected asset, supporting records, reviewer, and field task into the same workflow.' })}
    <div class="xev" data-xev data-stage="0">
      <div class="xev-reading"><p class="label">Hall 02 / thermal view</p><p class="lf-big"><b data-xev-temp>22.6</b><span>°C</span></p><p class="code fine" data-xev-state>Within sample threshold · H02-INLET-02 · illustrative data</p>
        <div class="xev-gauge"><i data-xev-bar style="width:56%"></i><b style="left:70%" title="Demo threshold 28 °C"></b></div><p class="code fine">DEMO THRESHOLD 28 °C</p></div>
      <ol class="xev-flow" aria-label="Response workspace">${['Signal', 'Context', 'Human review', 'Field work', 'Evidence'].map((x, i) => `<li data-step="${i + 1}"><span class="code">${pad2(i + 1)}</span>${x}</li>`).join('')}</ol>
      <div class="xev-card" aria-live="polite"><p class="label" data-xev-kicker>${STAGES[0][0]}</p><h3 class="h2" data-xev-title>${STAGES[0][1]}</h3><p data-xev-copy>${STAGES[0][2]}</p>
        <button type="button" class="lf-act" data-xev-next><span data-xev-btn>${STAGES[0][3]}</span>${icon('arrow')}</button><p class="fine" data-xev-fine>${STAGES[0][4]}</p><button type="button" class="btn-quiet xev-reset" data-xev-reset hidden>Reset the example</button></div>
      <div class="xev-log"><p class="label">Event record · ISS-014</p><ol data-xev-log><li class="xev-empty">No threshold crossing introduced.</li></ol></div>
      <p class="xev-rule">${icon('shield')}<span>Automation connects the workflow. Your team retains approval.</span></p>
    </div>
    <p class="fine sec-more">A fictional scenario, not an operational procedure. Thresholds are illustrative. No live integrations or equipment control.</p>
  </div>
</section>

<section class="sec" id="field" aria-labelledby="fd-title">
  <div class="wrap twin">
    <div>${detail({ n: 3, sheet: 'L-104', kicker: 'Scale the work at the equipment', title: 'Help every engineer arrive with the context.', id: 'fd-title', scale: '—' })}
      <p class="detail-lead">New sites and growing teams put pressure on your most experienced people. Put the approved work and relevant equipment knowledge in the engineer’s hands on the iPad.</p>
      ${clauses([['Arrive with the context.', 'See the approved task and the relevant asset record.'], ['Keep the record connected.', 'Record observations once, at the equipment.'], ['Make the next handoff clear.', 'Return the evidence to operations for review.']], { cols: 1 })}</div>
    <div class="tablet xtab" aria-label="Interactive iPad concept, sample workflow"><p class="tablet-top"><span>${icon('tablet')} entangl</span><span class="code">DEMO WORKSPACE · JL</span></p>
      <p class="code fine">North Campus / Hall 02 / Field work</p><p class="label xtab-k">Same connected record</p><h3 class="h3" data-xtab-title>No task assigned</h3><p data-xtab-copy>Awaiting an approved task. An issue does not become permission to act. Operator approval comes first.</p>
      <p class="fine">Interactive iPad concept · sample workflow. One shared thread, from the signal to the person on site.</p></div>
  </div>
</section>

<section class="sec" id="perspectives" aria-labelledby="ps-title">
  <div class="wrap">
    ${detail({ n: 4, sheet: 'L-104', kicker: 'Build confidence for the people depending on you', title: 'Answer their questions. With the work behind you.', id: 'ps-title', scale: '5 views', lead: 'Customers want a clear update. Auditors want the evidence. Give each audience the relevant view of the same operational record, with the context and chronology attached.' })}
    <div class="xps" data-xps>
      <div class="seg seg-sm seg-tabs xps-tabs" role="group" aria-label="Choose a perspective">${PERSPECTIVES.map(([k, l], i) => `<button type="button" data-xps-tab="${k}" aria-pressed="${i === 0}"><span class="code">${pad2(i + 1)}</span>${l}</button>`).join('')}</div>
      ${PERSPECTIVES.map(([k, , who, t, c, scope], i) => `<div class="xps-panel" data-xps-panel="${k}"${i ? ' hidden' : ''}><p class="label">${who}</p><h3 class="h2">${t}</h3><p>${c}</p><p class="code xps-scope">${scope}</p>${k === 'customer' ? '<p class="xps-notice" data-xps-notice>No customer update has been published in this demonstration.</p>' : ''}${k === 'auditor' ? '<p class="xps-notice" data-xps-audit>The chronology fills in as the event moves forward above.</p>' : ''}</div>`).join('')}
      <p class="fine">Illustrative views. Each audience sees the information relevant to its role. Follow the same event across responsibilities.</p>
    </div>
  </div>
</section>

<section class="sec" id="growth" aria-labelledby="gr-title">
  <div class="wrap">
    ${detail({ n: 5, sheet: 'L-104', kicker: 'Connect operations to growth before capacity becomes urgent', title: 'Give sales a signal worth a conversation.', id: 'gr-title', scale: 'Sample 30-day window', lead: 'Operations sees the demand. Your account team needs the context. Connect measured usage to contracted load so the right people can review an expansion opportunity together.' })}
    <div class="sc-two xcap" data-xcap>
      <div class="tscroll"><table class="pf"><caption class="sr-only">Capacity explorer, sample 30-day window</caption><thead><tr><th scope="col">Customer / suite</th><th scope="col">Peak / contracted</th><th scope="col">Utilization</th></tr></thead><tbody>${CUSTOMERS.map(([c, s, p, k, u], i) => `<tr class="${i === 1 ? 'is-sel' : ''}"><th scope="row"><button type="button" data-xcap-row="${i}" aria-pressed="${i === 1}"><b>${c}</b><small class="code">${s}</small></button></th><td class="code">${p} / ${k} kW</td><td><span class="xcap-u"><i style="width:${u}%"></i></span><span class="code">${u}%</span></td></tr>`).join('')}</tbody></table>
        <p class="fine">Measured peak over the displayed period, not a prediction.</p></div>
      <aside class="sc-panel" aria-live="polite">${CUSTOMERS.map(([c, s, p, k, u, m, e, pr], i) => `<div data-xcap-card="${i}"${i === 1 ? '' : ' hidden'}>${stamp(pr, i === 1 ? 'amber' : '')}<h3 class="sc-h">${m}</h3><p>${e}</p><p class="code fine">${c} · ${s} · ${p}&nbsp;kW peak · ${k}&nbsp;kW contracted</p></div>`).join('')}<p class="caution">Contractual headroom isn’t the same as sellable site capacity. Review engineering constraints before making an offer.</p></aside>
    </div>
  </div>
</section>

<section class="sec" id="trust" aria-labelledby="tr-title">
  <div class="wrap">
    ${detail({ n: 6, sheet: 'L-104', kicker: 'Confidence comes from the details', title: 'Make it earn your trust. On your own site.', id: 'tr-title', scale: '—', lead: 'See where an answer comes from, who makes the decision, and whether the workflow improves the work your team already does.' })}
    <ol class="ev3">
      <li><span class="code">01</span><h3 class="h3">Inspect the source.</h3><p>Look at the engineering record behind the connection. Check what is documented and what still needs verification.</p>${tlink('#context', 'Open a sample source', 'up')}</li>
      <li><span class="code">02</span><h3 class="h3">Keep the decision with your team.</h3><p>Follow the approval, field record, and operator review. See who is responsible as work moves forward.</p>${tlink('#event', 'Follow the event history', 'up')}</li>
      <li><span class="code">03</span><h3 class="h3">Evaluate a real workflow.</h3><p>Choose a useful starting point, agree what better looks like, and assess the result with the people who do the work.</p>${tlink('#session', 'Plan a session for your site', 'down')}</li>
    </ol>
    <dl class="bed"><div><dt>Bring</dt><dd>A representative workflow and its source documents.</dd></div><div><dt>Explore</dt><dd>The inputs, review steps, and handoffs with your team.</dd></div><div><dt>Decide</dt><dd>What fits, what needs connecting, and what to measure.</dd></div></dl>
    <p class="fine">This is an interactive product story with fictional data. Confirm the integrations and workflow fit for your deployment in a site session.</p>
  </div>
</section>

<section class="sec" id="session" aria-labelledby="ss-title">
  <div class="wrap tx-layout">
    <aside class="tx-side"><p class="detail-kicker">Let’s use your facility</p><h2 class="h2" id="ss-title">What would make the biggest difference?</h2><p class="tx-copy">Choose a real workflow to explore with Entangl. Review a maintenance workflow from your site: bring a representative one-line and a procedure your team already reviews.</p>
      <ol class="tx-bring"><li><span class="code">01</span>Your workflow</li><li><span class="code">02</span>Your source data</li><li><span class="code">03</span>Your success criteria</li><li><span class="code">04</span>A clear next step</li></ol></aside>
    <form class="tx" id="session-form" novalidate data-preview-form="session" aria-labelledby="ss-form-title">
      <header class="tx-head"><div><p class="label">Transmittal</p><h2 class="tx-title" id="ss-form-title">Your site session</h2></div><dl class="tx-meta"><div><dt>To</dt><dd>Entangl</dd></div><div><dt>Date</dt><dd data-today>—</dd></div></dl></header>
      <p class="tx-trap" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></p>
      <div class="tx-grid">
        <p class="tx-f"><label for="s-name">Your name</label><input id="s-name" name="name" type="text" autocomplete="name" placeholder="Alex Morgan" required maxlength="100"></p>
        <p class="tx-f"><label for="s-company">Company</label><input id="s-company" name="company" type="text" autocomplete="organization" placeholder="Your company" required maxlength="150"></p>
        <p class="tx-f tx-wide"><label for="s-email">Work email</label><input id="s-email" name="email" type="email" autocomplete="email" placeholder="alex@company.com" required maxlength="254"></p>
        <fieldset class="tx-f tx-wide tx-checks"><legend>What do you want to improve?</legend>${INTERESTS.map((x, i) => `<label class="tick"><input type="checkbox" name="interest" value="${esc(x)}"><span>${esc(x)}</span></label>`).join('')}</fieldset>
        <p class="tx-f tx-wide"><label for="s-context">What would make the biggest difference? <span class="opt">Optional</span></label><textarea id="s-context" name="context" rows="3" maxlength="1800"></textarea></p>
      </div>
      <div class="tx-foot"><button class="btn btn-ink" type="submit"><span>Send my request</span>${icon('arrow')}</button><p class="fine"><b class="tx-preview">Preview build: this form isn’t connected yet, so nothing is sent.</b> Once connected, your request goes directly to Entangl. We’ll use your details to respond to your enquiry. Please don’t include confidential site information.</p></div>
      <div class="tx-result" data-form-result hidden tabindex="-1"></div>
    </form>
  </div>
</section>
<script>window.entanglEventStages=${JSON.stringify(STAGES)};window.entanglEventLog=${JSON.stringify(LOG)};</script>
`,
};
