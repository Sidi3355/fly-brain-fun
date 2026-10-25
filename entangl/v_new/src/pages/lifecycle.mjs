// L-101 to L-103 · The connected lifecycle, design & handover, vendors & RFPs.
import { detail, stamp, chip, icon, btn, tlink, esc, sheetHead, clauses, closeNext, statusLine, noteRefs, rfiList } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';
import { lifecycle } from '../parts/lifecycle.mjs';

const S = r => sheetFor(r);
const parent = [{ route: '/lifecycle/', num: 'L-101', title: 'Full lifecycle' }];

// The six workflows behind the story, drawn as one process line in their real line weights.
const FLOW = [
  ['planned', 'Design and hand over.', 'Compare the design with the requirements. Carry accepted changes, commissioning evidence, and equipment information into operations.', '/lifecycle/design-and-handover/'],
  ['planned', 'Plan the work.', 'Connect maintenance tasks to the equipment, its guidance, and the windows when work can happen.', '/platform/maintenance/'],
  ['core', 'Prepare and review.', 'Write the procedure. Examine findings against site evidence. Put the right decisions with the right people.', '/platform/procedures/'],
  ['scoped', 'Carry out and respond.', 'Bring the approved work to the field. Connect operational signals to the equipment and procedures that help explain them.', '/platform/fieldwork/'],
  ['scoped', 'Show and improve.', 'Share the agreed evidence with customers and auditors. Use the work history to improve the next plan.', '/platform/visibility/'],
  ['planned', 'Buy the services. Keep the record.', 'Our planned procurement workflows connect requirements, bids, the chosen supplier, and the work they deliver.', '/lifecycle/vendors-and-rfps/'],
];
const flowLabel = { core: 'Core workflow', scoped: 'Explore the scope', planned: 'Planned workflow' };

const lifecyclePage = {
  route: '/lifecycle/',
  title: 'The full data center lifecycle | Entangl',
  description: 'A data center keeps changing. The people responsible for it need the design, the work, and the record of what happened to stay connected. We are building Entangl to become the operating system for that lifecycle. Start with procedures today.',
  scripts: ['lifecycle'],
  related: ['/lifecycle/design-and-handover/', '/lifecycle/vendors-and-rfps/', '/experience/', '/about/'],
  body: () => `
${sheetHead({ sheet: S('/lifecycle/'), kicker: 'The life of a data center', title: ['One facility.', 'A lifetime of decisions.'],
  lead: '<p>A data center keeps changing. The people responsible for it need the design, the work, and the record of what happened to stay connected. We are building Entangl to become the operating system for that lifecycle. Start with procedures today.</p>',
  actions: `${btn('/demo/', 'Book a site demo', 'ink')}${tlink('#moments', 'Walk through six moments', 'down')}`, aside: `<p class="sheet-stamp">${stamp('Interactive concept · Illustrative data')}</p>` })}

<section class="sec" id="moments" aria-labelledby="moments-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'L-101', kicker: 'Six moments', title: 'Walk through six moments. Watch the people, equipment, and work change.', id: 'moments-title', scale: 'NTS · Illustrative' })}
    ${lifecycle({ sheet: 'L-101', headingLevel: 3 })}
  </div>
</section>

<section class="sec" id="workflows" aria-labelledby="flow-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'L-101', kicker: 'Explore the workflows behind the experience', title: 'The same lifecycle, as work you can scope.', id: 'flow-title', scale: '—',
      lead: 'Each stage of the story maps to a workflow. The line around each one says how real it is today: solid for core, light for scoped with your deployment, dashed for planned.' })}
    <ol class="flow">${FLOW.map(([st, t, c, href], i) => `<li class="flow-step" data-status="${st}"><a href="${href}"><span class="flow-n code">0${i + 1}</span><span class="flow-st">${chip(st)}<span class="sr-only">${flowLabel[st]}</span></span><h3>${esc(t)}</h3><p>${esc(c)}</p><span class="flow-go">${icon('arrow')}<span class="sr-only">Open ${esc(S(href).title)}</span></span></a></li>`).join('')}</ol>
  </div>
</section>

<section class="sec" id="living" aria-labelledby="living-title">
  <div class="wrap twin">
    <div>${detail({ n: 3, sheet: 'L-101', kicker: 'The living facility', title: 'Same facility. Change your perspective.', id: 'living-title', scale: '—' })}
      <p class="detail-lead">Follow the existing interactive story through an alarm, a field task, a customer view, and the audit record. All data and workflows in this experience are illustrative.</p>
      <p class="sec-more">${btn('/experience/', 'Open the connected facility', 'line')}</p></div>
    <div class="twin-art" aria-hidden="true"><ol class="mini-chain">${['Signal', 'Review', 'Approval', 'Field record', 'Closure', 'Publication'].map((x, i) => `<li><span class="code">09:${['41', '43', '45', '50', '53', '55'][i]}</span>${x}</li>`).join('')}</ol></div>
  </div>
</section>
${closeNext()}
`,
};

// L-102 · Design & handover: a requirement register with evidence states.
const REQS = [
  ['REQ-01', 'Document the required power arrangement', 'found', 'Evidence found', 'SLD-001 · Rev C · Drawing reference', 'A drawing reference exists in this fictional record. The responsible engineer still checks whether it satisfies the applicable requirement.'],
  ['REQ-02', 'Reconcile the as-built revision', 'diff', 'Difference to review', 'Design Rev B → Site record Rev C', 'The two records identify different revisions. Review the accepted change and reconcile the as-built document before operational use.'],
  ['REQ-03', 'Attach commissioning evidence', 'missing', 'Evidence missing', 'Commissioning evidence is missing', 'The example register has no accepted test report for this item. Assign an evidence owner and resolve the gap; the record does not establish acceptance.'],
];
const designPage = {
  route: '/lifecycle/design-and-handover/',
  title: 'Data center design review and handover | Entangl',
  description: 'We are developing a way to compare site documents with the requirements they need to meet, then carry the accepted record into operations.',
  scripts: ['sheets'],
  related: ['/lifecycle/', '/platform/maintenance/', '/platform/site-model/'],
  body: () => `
${sheetHead({ sheet: S('/lifecycle/design-and-handover/'), trail: parent, kicker: 'Planned workflow', status: 'planned', title: 'Did the design meet the brief?',
  lead: '<p>We are developing a way to compare site documents with the requirements they need to meet, then carry the accepted record into operations.</p>',
  actions: btn('/demo/?workflow=Design+and+handover', 'Discuss design and handover', 'ink') })}

<section class="sec" id="register" aria-labelledby="reg-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'L-102', kicker: 'Interactive concept · planned workflow', title: 'A requirement. Its evidence. An open question.', id: 'reg-title', scale: 'NTS · Illustrative' })}
    <div class="ppf is-planned" data-reg>
      <div class="ppf-bar"><p><span class="code">NORTH CAMPUS / REQUIREMENT REGISTER</span>${chip('planned')}</p>${stamp('Planned · concept only', 'amber')}</div>
      <div class="ppf-scene sc-two reg">
        <table class="reg-table"><caption class="sr-only">Requirement register</caption><thead><tr><th scope="col">Ref</th><th scope="col">Requirement</th><th scope="col">Evidence</th></tr></thead>
          <tbody>${REQS.map((r, i) => `<tr class="reg-${r[2]}"><td class="code">${r[0]}</td><th scope="row"><button type="button" data-req="${i}" aria-pressed="${i === 0}">${esc(r[1])}</button></th><td><span class="ev ev-${r[2]}">${esc(r[3])}</span></td></tr>`).join('')}</tbody></table>
        <aside class="sc-panel" aria-live="polite"><p class="label">Requirement → evidence</p>${REQS.map((r, i) => `<div class="reg-card" data-req-card="${i}"${i ? ' hidden' : ''}><h3 class="sc-h code-h">${esc(r[4])}</h3><p>${esc(r[5])}</p></div>`).join('')}</aside>
      </div>
      <p class="ppf-foot">${icon('file')}<span>A planned concept with fictional records. Design acceptance and permit decisions remain with the responsible engineers and authorities.</span></p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="steps-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'L-102', kicker: 'The proposed workflow', title: 'From the basis of design to the first maintenance plan.', id: 'steps-title', scale: '—' })}
    ${clauses([
      ['Keep each requirement in view.', 'Link a requirement in the basis of design to the drawing or document that addresses it. Record what is supported, what differs, and what still needs evidence.'],
      ['Check the requirements that apply to this site.', 'Bring the agreed customer specifications and applicable permit requirements into the review. Keep their source, revision, and scope clear for the responsible specialists.'],
      ['Make handover easier to inspect.', 'Connect commissioning reports, test evidence, unresolved items, and accepted changes to the right equipment. Reconcile the design with the as-built record before operational use.'],
      ['Put the record to work.', 'Use the accepted equipment and document set to shape procedures, maintenance planning, and site training.'],
    ])}
  </div>
</section>

<section class="sec" aria-labelledby="dq-title">
  <div class="wrap">
    ${detail({ n: 3, sheet: 'L-102', kicker: 'Buyer question', title: 'What it does not do.', id: 'dq-title', scale: '—' })}
    ${rfiList([['Does this certify the design or secure a permit?', 'No. The proposed workflow supports evidence review. Design acceptance and permit decisions remain with the responsible engineers and authorities.']], { idBase: 'rfi' })}
  </div>
</section>
${closeNext({ href: '/demo/?workflow=Design+and+handover' })}
`,
};

// L-103 · Vendors & RFPs: one scope, two bids, and the record of delivery.
const BIDS = [['Defined visits & task scope', 'Included in example', 'Clarification needed'], ['Response commitment', 'Evidence to inspect', 'Evidence to inspect'], ['Exclusions & assumptions', 'Listed separately', 'Clarification needed'], ['Price, currency, tax & date', 'No quote supplied', 'No quote supplied'], ['Previous delivery record', 'Not supplied', 'Not supplied']];
const cellTone = v => /Clarification/.test(v) ? 'is-warn' : /No quote|Not supplied/.test(v) ? 'is-gap' : '';
const vendorsPage = {
  route: '/lifecycle/vendors-and-rfps/',
  title: 'Data center vendors and RFPs | Entangl',
  description: 'We are building a way to keep service requirements, supplier bids, and delivery records together, so the next buying decision starts with evidence from the last one.',
  scripts: ['sheets'],
  related: ['/lifecycle/', '/platform/maintenance/', '/platform/visibility/'],
  body: () => `
${sheetHead({ sheet: S('/lifecycle/vendors-and-rfps/'), trail: parent, kicker: 'Planned workflow', status: 'planned', title: 'From the bid to the work done.',
  lead: '<p>We are building a way to keep service requirements, supplier bids, and delivery records together, so the next buying decision starts with evidence from the last one.</p>',
  actions: btn('/demo/?workflow=Vendors+and+RFPs', 'Help shape vendors and RFPs', 'ink') })}

<section class="sec" id="bids" aria-labelledby="bids-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'L-103', kicker: 'A shared scope / a clearer comparison', title: 'Compare the scope behind each bid.', id: 'bids-title', scale: 'NTS · Illustrative' })}
    <div class="ppf is-planned" data-bids>
      <div class="ppf-bar"><p><span class="code">PROCUREMENT / SERVICE SCOPE</span>${chip('planned')}</p>${stamp('Planned · concept only', 'amber')}</div>
      <div class="ppf-scene">
        <div class="seg seg-sm seg-tabs" role="group" aria-label="Choose a comparison"><button type="button" data-bid-view="services" aria-pressed="true">Facilities services</button><button type="button" data-bid-view="tenant" aria-pressed="false">Tenant requirements</button></div>
        <div class="bids-view" data-bid-panel="services"><p class="fine bids-note">Illustrative invited-bid comparison · No live supplier quotes</p>
          <div class="tscroll"><table class="bids"><thead><tr><th scope="col">Compare the agreed scope</th><th scope="col">Bid A</th><th scope="col">Bid B</th></tr></thead><tbody>${BIDS.map(([a, b, c]) => `<tr><th scope="row">${esc(a)}</th><td class="${cellTone(b)}">${esc(b)}</td><td class="${cellTone(c)}">${esc(c)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="bids-view" data-bid-panel="tenant" hidden><p class="label">Tenant / facility requirements</p><h3 class="sc-h">A separate decision. A shared evidence pack.</h3><p class="bids-copy">The planned leasing workflow brings a prospective tenant’s requirements alongside the facility evidence. This is a separate transaction from buying facilities services.</p>
          <ul class="ticklist"><li>Tenant requirement and its source revision</li><li>Provider evidence for the agreed facility scope</li><li>Outstanding questions and decision owners</li><li>Accepted terms retained by the responsible teams</li></ul><p class="fine">No live marketplace, tenant offer, or supplier bid is represented here.</p></div>
      </div>
      <p class="ppf-foot">${icon('file')}<span>A planned concept with fictional bids. No supplier, price or quote is represented.</span></p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="vsteps-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'L-103', kicker: 'The proposed workflow', title: 'Ask for the same scope. Keep the record.', id: 'vsteps-title', scale: '—' })}
    ${clauses([
      ['Ask for the same scope.', 'Issue an RFP for facilities management or a defined service. Give invited suppliers the same requirements, site scope, and response format.'],
      ['Compare more than the headline price.', 'Review what is included, what is excluded, response commitments, staffing, and the assumptions behind the quote.'],
      ['Carry the decision into the work.', 'Link the chosen supplier to the agreed scope, planned visits, procedures, and records of delivery.'],
      ['Use the history next time.', 'Look at completed work, response times, repeat visits, and cost changes when a service comes up for review.'],
      ['Preparing a facility for a tenant?', 'We also see a place for a shared requirement and evidence pack during leasing: what the tenant needs, what the facility can show, and what remains open.'],
    ])}
  </div>
</section>
${closeNext({ href: '/demo/?workflow=Vendors+and+RFPs' })}
`,
};

export default [lifecyclePage, designPage, vendorsPage];
