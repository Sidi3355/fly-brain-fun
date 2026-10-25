// G-002 Who it's for · G-003 About · G-004 Book a site demo · X-000 Not found.
import { detail, stamp, chip, icon, btn, tlink, esc, sheetHead, clauses, closeNext, statusLine } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';

const S = r => sheetFor(r);

// Who it's for, written as a responsibility matrix.
const ROLES = [
  ['owners-operators', 'For owners and operators', 'Keep work moving with the site in view.', 'Give engineering teams a place to write and review procedures using the information about their equipment. Agree the workflow across the portfolio and keep local requirements visible.', '/platform/review/', 'Write and review procedures', 'Engineering teams'],
  ['tenants-customers', 'For tenants and customer teams', 'See the evidence behind the work that affects you.', 'Explore a provider-approved view of relevant procedures, review findings, and outstanding decisions. Define the information you need and the approvals your team retains.', '/platform/visibility/', 'A provider-approved view', 'Your own approvals'],
  ['facilities-management', 'For facilities management teams', 'Bring a clear record to every customer.', 'Use the customer’s site information, templates, and review requirements to shape the procedure workflow. Agree who owns the data, the approval, and the service relationship.', '/platform/procedures/', 'The customer’s templates', 'Data, approval, service'],
  ['development-engineering', 'For development and engineering teams', 'Carry the design intent into operations.', 'Explore the planned design and handover workflow: requirements, drawing evidence, commissioning records, and the information needed for the first maintenance plan.', '/lifecycle/design-and-handover/', 'Requirements and evidence', 'The first maintenance plan'],
];
const whoPage = {
  route: '/who-its-for/',
  title: 'Entangl for data center owners, operators, and customers',
  description: 'Find the work you need to improve. Start there, then explore how it connects to the rest of the facility.',
  related: ['/platform/review/', '/platform/visibility/', '/platform/procedures/', '/lifecycle/design-and-handover/'],
  relatedTitle: 'Start with your responsibility',
  body: () => `
${sheetHead({ sheet: S('/who-its-for/'), kicker: 'Entangl', title: 'Built around the part of the site you are responsible for.',
  lead: '<p>Find the work you need to improve. Start there, then explore how it connects to the rest of the facility.</p>',
  actions: `${btn('/platform/review/', 'Explore procedure review', 'ink')}${tlink('/evaluate/', 'Plan a site evaluation')}` })}
<section class="sec" aria-labelledby="matrix-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'G-002', kicker: 'Responsibility matrix', title: 'Start with your responsibility.', id: 'matrix-title', scale: '—', lead: 'Four ways into the same facility record. Each starts with the work you already own, and keeps the decisions with the people who hold them.' })}
    <div class="matrix">${ROLES.map(([id, who, title, copy, href], i) => { const s = S(href); return `<article class="mx-row" id="${id}"><p class="mx-n code">0${i + 1}</p><div class="mx-who"><p class="label">${who}</p><h2 class="h3">${title}</h2></div><p class="mx-copy">${copy}</p><a class="mx-go" href="${href}"><span class="code">${s.num}</span><b>${esc(s.title)}</b>${s.status ? chip(s.status) : ''}<span class="mx-cta">Explore this workflow ${icon('arrow')}</span></a></article>`; }).join('')}</div>
  </div>
</section>
${closeNext()}
`,
};

const aboutPage = {
  route: '/about/',
  title: 'About Entangl | Knowledge for the life of a data center',
  description: 'A data center is designed by one group, built by another, and run by people who inherit the decisions. Each handover can leave them searching for the reason behind the work. We are building Entangl to keep that knowledge connected.',
  related: ['/platform/', '/lifecycle/', '/proof/'],
  body: () => `
${sheetHead({ sheet: S('/about/'), kicker: 'Entangl', title: ['The site keeps changing.', 'Its knowledge should keep up.'],
  lead: '<p>A data center is designed by one group, built by another, and run by people who inherit the decisions. Each handover can leave them searching for the reason behind the work.</p>' })}
<section class="sec" aria-labelledby="hand-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'G-003', kicker: 'Why we started', title: 'Three groups. Two handovers. One site.', id: 'hand-title', scale: 'NTS' })}
    <ol class="handover" aria-label="Who holds the knowledge over a facility's life">
      <li><span class="code">01</span><b>Designed</b><span>by one group</span></li>
      <li class="handover-gap" aria-hidden="true"><span>handover</span></li>
      <li><span class="code">02</span><b>Built</b><span>by another</span></li>
      <li class="handover-gap" aria-hidden="true"><span>handover</span></li>
      <li><span class="code">03</span><b>Run</b><span>by people who inherit the decisions</span></li>
    </ol>
    <div class="prose about-prose"><p>We are building Entangl to keep that knowledge connected. To the equipment. To the procedure. To the people who need to make the next decision.</p>
      <p>Procedures are our core today because that is where site information has to become usable work. Our direction is the full lifecycle: design, handover, maintenance, operations, customer oversight, and the services that keep the facility running.</p></div>
    <p class="sec-more">${btn('/platform/', 'See what we are building', 'line')}</p>
  </div>
</section>
<section class="sec" aria-labelledby="bod-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'G-003', kicker: 'Basis of design', title: 'Our standard is simple.', id: 'bod-title', scale: '—', lead: 'Every site has a basis of design: the criteria everything else is checked against. This is ours.' })}
    <ol class="bod">
      <li><span class="code">BOD-1</span><h3 class="h2">Make the work clear.</h3></li>
      <li><span class="code">BOD-2</span><h3 class="h2">Show the evidence.</h3></li>
      <li><span class="code">BOD-3</span><h3 class="h2">Respect the judgment of the people responsible for the site.</h3></li>
    </ol>
    <p class="fine bod-foot">Entangl, Inc. · San Francisco, CA · Built for the people behind uptime.</p>
  </div>
</section>
${closeNext()}
`,
};

// The demo request, laid out as a transmittal: the cover sheet engineers send with documents.
const WORKFLOWS = ['Writing procedures', 'Reviewing procedures', 'Fieldwork and training', 'Telemetry', 'Customer visibility', 'Maintenance planning', 'Design and handover', 'Vendors and RFPs', 'Something else'];
const demoPage = {
  route: '/demo/',
  title: 'Book an Entangl site demo',
  description: 'Tell us about the task and the site. We will use that to shape the conversation and agree what is worth testing.',
  scripts: ['forms'],
  related: ['/evaluate/', '/proof/example/', '/answers/'],
  body: () => `
${sheetHead({ sheet: S('/demo/'), kicker: 'Entangl', title: 'Show us the work you want to improve.',
  lead: '<p>Tell us about the task and the site. We will use that to shape the conversation and agree what is worth testing.</p>' })}
<section class="sec sec-tight" aria-labelledby="tx-title">
  <div class="wrap tx-layout">
    <aside class="tx-side">
      <p class="detail-kicker">A useful first conversation</p>
      <h2 class="h2">Start with a real task. Agree what to test.</h2>
      <p class="tx-copy">No site files are needed to book. We will agree a suitable way to share documents if a site-based evaluation is the next step.</p>
      <ol class="tx-bring"><li><span class="code">01</span>The work your team knows.</li><li><span class="code">02</span>The information behind it.</li><li><span class="code">03</span>Your standard for a useful result.</li></ol>
      <p class="tx-mail">${icon('mail')}<a class="inline-link" href="mailto:shapol@entangl.ai">shapol@entangl.ai</a></p>
    </aside>
    <form class="tx" id="demo-form" novalidate data-preview-form="demo" aria-labelledby="tx-title">
      <header class="tx-head"><div><p class="label">Transmittal</p><h2 class="tx-title" id="tx-title">Request a site demo</h2></div><dl class="tx-meta"><div><dt>To</dt><dd>Entangl</dd></div><div><dt>Date</dt><dd data-today>—</dd></div><div><dt>Re</dt><dd data-tx-re>Site demo</dd></div></dl></header>
      <p class="tx-trap" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></p>
      <div class="tx-grid">
        <p class="tx-f"><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" required maxlength="100"></p>
        <p class="tx-f"><label for="f-email">Work email</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="254"></p>
        <p class="tx-f"><label for="f-company">Company</label><input id="f-company" name="company" type="text" autocomplete="organization" required maxlength="150"></p>
        <p class="tx-f"><label for="f-workflow">What would you like to improve?</label><select id="f-workflow" name="workflow" required><option value="">Choose a workflow</option>${WORKFLOWS.map(w => `<option>${w}</option>`).join('')}</select></p>
        <p class="tx-f tx-wide"><label for="f-context">Anything we should know? <span class="opt">Optional</span></label><textarea id="f-context" name="context" rows="4" maxlength="1800"></textarea></p>
      </div>
      <details class="tx-more"><summary>${icon('pm', 'i rfi-mark')}<span>Add role, sites, or current systems</span></summary>
        <div class="tx-grid"><p class="tx-f"><label for="f-role">Role</label><input id="f-role" name="role" type="text" maxlength="100"></p><p class="tx-f"><label for="f-sites">Number of sites</label><input id="f-sites" name="sites" type="number" min="1" max="100000" inputmode="numeric"></p><p class="tx-f tx-wide"><label for="f-systems">Current systems</label><input id="f-systems" name="systems" type="text" maxlength="240"></p></div></details>
      <div class="tx-foot"><button class="btn btn-ink" type="submit"><span>Send my demo request</span>${icon('arrow')}</button><p class="fine"><b class="tx-preview">Preview build: this form isn’t connected yet, so nothing is sent.</b> Once connected, your request goes directly to Entangl. We’ll use your details to respond to your enquiry.</p></div>
      <div class="tx-result" data-form-result hidden tabindex="-1"></div>
    </form>
  </div>
</section>
`,
};

const notFound = {
  route: '/404',
  title: 'Page not found | Entangl',
  description: 'Find your way back to Entangl.',
  body: () => `
<section class="nf wrap" aria-labelledby="nf-title">
  <p class="code nf-num">X-000 · 404</p>
  <h1 class="display" id="nf-title">Let’s reconnect.<span>This sheet isn’t in the register.</span></h1>
  <p class="lead">This page could not be found. It may have been superseded, or the reference may be out of date. That happens to drawings too.</p>
  <div class="actions">${btn('/', 'Back to Entangl', 'ink', 'back')}${tlink('/#drawing-list', 'Open the drawing list')}</div>
  <p class="nf-stamp">${stamp('Void · not in register', 'amber')}</p>
</section>
`,
};

export default [whoPage, aboutPage, demoPage, notFound];
