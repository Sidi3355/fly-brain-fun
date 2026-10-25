// E-301 to E-304 · Systems & integrations, security & deployment, implementation, pricing.
import { detail, stamp, icon, btn, tlink, esc, sheetHead, clauses, closeNext, rfiList } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';

const S = r => sheetFor(r);

const integrations = {
  route: '/enterprise/integrations/',
  title: 'Data center systems and integrations | Entangl',
  description: 'Agree what Entangl should do, which system holds the approved record, and how information moves between them.',
  related: ['/enterprise/security/', '/enterprise/rollout/', '/pricing/', '/platform/'],
  body: () => `
${sheetHead({ sheet: S('/enterprise/integrations/'), kicker: 'Enterprise', title: 'Fit the systems your team already uses.',
  lead: '<p>Agree what Entangl should do, which system holds the approved record, and how information moves between them.</p>', actions: btn('/demo/?request=Integration+review', 'Review your integration needs', 'ink') })}
<section class="sec" aria-labelledby="icd-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'E-301', kicker: 'Interface control', title: 'Agree the record handoff.', id: 'icd-title', scale: 'Scope with your team', lead: 'Three parties, two interfaces, one approved record. Each box names who owns it.' })}
    <div class="icd" role="img" aria-label="Site inputs, documents and signals owned by your source owners, flow to Entangl for draft and review by your authorized reviewers, then to the final record of approved work in your agreed system of record.">
      <div class="icd-box"><p class="code">01 / SITE INPUTS</p><h3 class="h3">Documents & signals</h3><p>Your source owners</p></div>
      <div class="icd-if"><span class="code">IF-1</span></div>
      <div class="icd-box icd-mid"><p class="code">02 / ENTANGL</p><h3 class="h3">Draft & review</h3><p>Your authorized reviewers</p></div>
      <div class="icd-if"><span class="code">IF-2</span></div>
      <div class="icd-box"><p class="code">03 / FINAL RECORD</p><h3 class="h3">Approved work</h3><p>Your agreed system of record</p></div>
    </div>
    ${rfiList([['What needs to be tested at the handoff?', 'Site and equipment identity, document revisions, attachments, approval ownership, transfer failures, and who maintains the connection.']], { idBase: 'rfi', openFirst: false })}
  </div>
</section>
<section class="sec" aria-labelledby="int-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'E-301', kicker: 'Each connection', title: 'A clear scope for every interface.', id: 'int-title', scale: '—' })}
    ${clauses([
      ['Documents and procedures.', 'Test the files, fields, attachments, and export formats your team needs. Keep site, equipment, and version identifiers intact.'],
      ['Work orders and change management.', 'Map the handoff to your CMMS or change process, including submission, revision, approval ownership, and failed transfers.'],
      ['Monitoring and signals.', 'For telemetry, define the points, timestamps, update rate, and equipment mapping from your BMS, EPMS, or SCADA.'],
      ['A clear scope for each connection.', 'Confirm the supported path, the configuration work, the people involved, and who maintains it after launch.'],
    ])}
    <div class="sec-gap">${rfiList([['What about ServiceNow, MCIM, Corrigo, or our internal system?', 'Tell us the system and the workflow you need. We will confirm the current integration or export path for your environment and demonstrate the exchange.']], { idBase: 'rfi', start: 2 })}</div>
  </div>
</section>
${closeNext()}
`,
};

const security = {
  route: '/enterprise/security/',
  title: 'Security, data, and deployment | Entangl',
  description: 'Start the security review with the deployment you are considering. We will work through the architecture, data use, access, and service requirements with your team.',
  scripts: ['sheets'],
  related: ['/enterprise/integrations/', '/enterprise/rollout/', '/pricing/', '/answers/'],
  body: () => `
${sheetHead({ sheet: S('/enterprise/security/'), kicker: 'Enterprise', title: ['Know where your data goes.', 'Know who can use it.'],
  lead: '<p>Start the security review with the deployment you are considering. We will work through the architecture, data use, access, and service requirements with your team.</p>', actions: btn('/demo/?request=Security+review', 'Start a security review', 'ink') })}
<section class="sec" aria-labelledby="sec-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'E-302', kicker: 'Review checklist', title: 'Five things your security review should settle.', id: 'sec-title', scale: '—', lead: 'Written as a checklist for your review, not as claims. We will provide the current material for the deployment you are considering and say plainly where a requirement needs further work.' })}
    <div data-check5><ol class="check5">${[
      ['Deployment and data flow.', 'Confirm where information is stored and processed, which providers are involved, and which regions and deployment options are supported.'],
      ['Identity and access.', 'Review sign-in requirements, user access, privileged roles, and the boundaries between organizations, sites, contractors, and customer reviewers.'],
      ['Data use and ownership.', 'Review the written terms for customer inputs and generated records, including model processing, retention, export, and deletion.'],
      ['Continuity and support.', 'Agree how service issues are reported, what support applies, and how your team accesses the records it needs if the service is unavailable.'],
      ['Evidence for your review.', 'Request the current security material relevant to the proposed scope. We will identify any requirements that need further work.'],
    ].map(([t, c], i) => `<li><input type="checkbox" class="check5-box" id="sr-${i + 1}"><span class="code">SR-${i + 1}</span><div><h3><label for="sr-${i + 1}">${t}</label></h3><p>${c}</p></div></li>`).join('')}</ol>
    <p class="check5-tally" data-check5-tally aria-live="polite">Tick each one as your review settles it.</p></div>
  </div>
</section>
${closeNext()}
`,
};

const rollout = {
  route: '/enterprise/rollout/',
  title: 'Implementing Entangl | Site setup, training, and rollout',
  description: 'Build the rollout around a workflow your team can evaluate. Agree the data, the people, and the result before expanding.',
  related: ['/evaluate/', '/enterprise/integrations/', '/pricing/'],
  body: () => `
${sheetHead({ sheet: S('/enterprise/rollout/'), kicker: 'Enterprise', title: ['Start with one site.', 'Make the work useful.'],
  lead: '<p>Build the rollout around a workflow your team can evaluate. Agree the data, the people, and the result before expanding.</p>', actions: btn('/demo/?request=First-site+rollout', 'Plan your first site', 'ink') })}
<section class="sec" aria-labelledby="ro-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'E-303', kicker: 'Rollout sequence', title: 'Five steps, in order.', id: 'ro-title', scale: '—', lead: 'From the first job to the review of the result. The schedule is agreed once the data, the scope, and the people are clear.' })}
    <ol class="levels">${[
      ['Choose the first job.', 'Pick a representative procedure or review task, an operational owner, and the outcome the evaluation needs to prove.'],
      ['Prepare and check the site information.', 'Collect the agreed documents. Review equipment and connections. Give missing information a named owner.'],
      ['Fit the process.', 'Check templates, approval roles, exports or integrations, and the final record your team needs.'],
      ['Train on actual work.', 'Use the tasks people will perform, with a clear first action and a route for help.'],
      ['Review the result.', 'Measure the work completed and the effort it took. Resolve the important gaps and agree the next site or workflow.'],
    ].map(([t, c], i) => `<li style="--l:${i}"><span class="code">STEP ${i + 1}</span><h3>${t}</h3><p>${c}</p></li>`).join('')}</ol>
  </div>
</section>
<section class="sec" aria-labelledby="roq-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'E-303', kicker: 'Buyer questions', title: 'Time and effort.', id: 'roq-title', scale: '—' })}
    ${rfiList([['How much time will our team need?', 'The plan should show document preparation, site validation, IT work, testing, and training. We will estimate those tasks for the agreed scope.'], ['How long does setup take?', 'It depends on data readiness, site scope, integrations, and the people available. We will agree a schedule once those are clear.']], { idBase: 'rfi' })}
  </div>
</section>
${closeNext()}
`,
};

const pricing = {
  route: '/pricing/',
  title: 'Entangl pricing | Site and portfolio scope',
  description: 'Start with the sites and work you want Entangl to support. Get a written proposal that makes the full cost and the next decision clear.',
  related: ['/evaluate/', '/enterprise/rollout/', '/answers/'],
  body: () => `
${sheetHead({ sheet: S('/pricing/'), kicker: 'Enterprise', title: ['A clear scope.', 'A complete price.'],
  lead: '<p>Start with the sites and work you want Entangl to support. Get a written proposal that makes the full cost and the next decision clear.</p>', actions: btn('/demo/?request=Scoped+quote', 'Request a scoped quote', 'ink') })}
<section class="sec" aria-labelledby="boq-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'E-304', kicker: 'Schedule of items', title: 'Your proposal should cover:', id: 'boq-title', scale: '—', lead: 'No price is printed on this sheet, because a number without your scope would not mean anything. This is the list every proposal from us should itemize.' })}
    <table class="boq"><caption class="sr-only">Items every proposal should cover</caption><thead><tr><th scope="col">Item</th><th scope="col">Description</th><th scope="col">Rate</th></tr></thead><tbody>${[
      'The sites, workflows, users, and billing unit in scope.', 'Subscription charges and any limits or overages.', 'Data setup, configuration, integration, and training.', 'Support, travel, and any third-party costs.', 'Evaluation terms, rollout timing, and what happens at the end.',
    ].map((t, i) => `<tr><td class="code">${String(i + 1).padStart(2, '0')}</td><td>${t}</td><td class="boq-rate">Per your scope</td></tr>`).join('')}</tbody></table>
  </div>
</section>
<section class="sec" aria-labelledby="eval-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'E-304', kicker: 'How it starts', title: 'Evaluate first. Then plan the portfolio.', id: 'eval-title', scale: '—' })}
    ${clauses([
      ['Start with a defined evaluation.', 'Agree what the evaluation includes, what your team needs to contribute, how success is measured, and what it costs to continue or stop.'],
      ['Plan for the portfolio.', 'Separate committed sites from possible expansion. Make the treatment of added sites, delayed rollout, and new workflows clear in the proposal.'],
    ])}
    <div class="sec-gap">${rfiList([['Is pricing per site, user, or megawatt?', 'The quote will state the billing unit and its definition for your deployment. We will work through your facility structure so both sides arrive at the same total.']], { idBase: 'rfi' })}</div>
  </div>
</section>
${closeNext()}
`,
};

export default [integrations, security, rollout, pricing];
