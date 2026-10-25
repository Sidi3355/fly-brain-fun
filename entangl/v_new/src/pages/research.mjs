// R-405 · Annual outage report, its request confirmation and its email.
import { detail, stamp, icon, btn, tlink, esc, sheetHead, clauses, closeNext } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';

const S = r => sheetFor(r);
const trail = [{ route: '/proof/', num: 'R-401', title: 'Proof' }];

const reportPage = {
  route: '/outage-report/',
  title: 'Annual Data Center Outage Report 2025/2026 | Entangl',
  description: 'Get Entangl’s 52-page annual data center outage report. Nine detailed case studies, illustrated failures, recovery timelines, and lessons for your sites.',
  scripts: ['forms'],
  related: ['/proof/', '/platform/telemetry/', '/platform/review/'],
  body: () => `
<header class="sheet-head wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/"><span class="code">G-001</span> Cover</a><span aria-hidden="true">/</span><span aria-current="page"><span class="code">R-405</span> Annual outage report</span></nav>
  <div class="rep-hero">
    <div class="rep-copy">
      <p class="detail-kicker">Entangl research · 2025 / 2026</p>
      <h1 class="h1 sheet-title">How data center outages escalate. <span>The failures. The recovery. The decisions that shape both.</span></h1>
      <p class="lead">Our annual data center outage report follows 12 months of U.S. incidents, from the first failure to the return of service. See what happened, why recovery took longer, and what to review at your own sites.</p>
      <dl class="rep-stats"><div><dt>Pages</dt><dd>52</dd></div><div><dt>Detailed cases</dt><dd>9</dd></div><div><dt>Months of incidents</dt><dd>12</dd></div></dl>
      <p class="code rep-dates">14 September 2025 – 14 September 2026</p>
    </div>
    <figure class="rep-cover"><img src="/assets/img/outage-report-cover.webp" width="778" height="1100" alt="Cover of Entangl’s 2025/2026 report, How data center outages escalate"><figcaption class="code">The complete illustrated field guide · PDF · 18 MB</figcaption></figure>
  </div>
</header>

<section class="sec sec-tight" id="report-form" aria-labelledby="report-form-title">
  <div class="wrap tx-layout">
    <aside class="tx-side"><p class="detail-kicker">The annual outage report</p><h2 class="h2">Get your copy.</h2><p class="tx-copy">We’ll email you a link to the full report.</p><p class="fine">Need a hand? <a class="inline-link" href="mailto:shapol@entangl.ai?subject=Annual%20outage%20report">Contact Entangl</a></p></aside>
    <form class="tx" id="report-form-el" novalidate data-preview-form="report" aria-labelledby="report-form-title">
      <header class="tx-head"><div><p class="label">Request</p><h2 class="tx-title" id="report-form-title">Email me the report</h2></div><dl class="tx-meta"><div><dt>Document</dt><dd>R-405 · 2025/2026</dd></div><div><dt>Date</dt><dd data-today>—</dd></div></dl></header>
      <p class="tx-trap" aria-hidden="true"><label>Leave this field empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></p>
      <div class="tx-grid">
        <p class="tx-f tx-wide"><label for="r-name">Full name</label><input id="r-name" name="name" type="text" autocomplete="name" placeholder="Your full name" required maxlength="100"></p>
        <p class="tx-f"><label for="r-email">Email address</label><input id="r-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required maxlength="254"></p>
        <p class="tx-f"><label for="r-phone">Phone number</label><input id="r-phone" name="phone" type="tel" autocomplete="tel" placeholder="+1 415 555 0123" required maxlength="40" aria-describedby="r-phone-help"><span class="tx-help" id="r-phone-help">Include your country code.</span></p>
      </div>
      <div class="tx-foot"><button class="btn btn-ink" type="submit"><span>Email me the report</span>${icon('arrow')}</button><p class="fine"><b class="tx-preview">Preview build: this form isn’t connected yet, so nothing is sent.</b> We’ll use your details to send the report and respond to your enquiry.</p></div>
      <div class="tx-result" data-form-result hidden tabindex="-1"></div>
    </form>
  </div>
</section>

<section class="sec" aria-labelledby="inside-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: 'R-405', kicker: 'Inside the report', title: 'Read the failure. Follow the recovery.', id: 'inside-title', scale: '52 pp', lead: 'Nine detailed cases draw on incidents involving Microsoft Azure, Google Cloud, Nebius, AWS / Coinbase, and Blacksmith.' })}
    ${clauses([
      ['See how the failure spread.', 'Illustrated case studies trace power, cooling, network, and shared infrastructure failures.'],
      ['Understand what delayed recovery.', 'Follow the dependencies, handoffs, and restart decisions between restoring a facility and restoring service.'],
      ['Take the questions back to your site.', 'Review scope, sequence, equipment state, monitoring context, and recovery with your team.'],
    ], { cols: 1 })}
    <p class="sec-more">${tlink('#report-form', 'Get the full report', 'up')}</p>
  </div>
</section>
<section class="sec" aria-labelledby="evid-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'R-405', kicker: 'The evidence', title: 'Public sources. Practical operating lessons.', id: 'evid-title', scale: '—' })}
    <p class="detail-lead">Based on operator and customer post-mortems, status histories, company statements, and other published sources. The report includes a broader register of 32 reports and leads. It is a selected evidence base, not a count of every outage in the industry.</p>
  </div>
</section>
`,
};

const thanksPage = {
  route: '/outage-report/thank-you/',
  title: 'Your outage report request | Entangl',
  description: 'Check your inbox for Entangl’s annual data center outage report.',
  body: () => `
<section class="thanks wrap" aria-labelledby="th-title">
  <div><p class="detail-kicker">Report request submitted</p><h1 class="h1" id="th-title">Check your inbox.</h1>
    <p class="lead">Thanks for requesting <em>How data center outages escalate</em>. Look for an email with a link to your copy of the report.</p>
    <p class="thanks-help">If it hasn’t arrived after a few minutes, check your spam folder. Need help? <a class="inline-link" href="mailto:shapol@entangl.ai?subject=Annual%20outage%20report%20delivery">Email shapol@entangl.ai</a>.</p>
    <div class="actions">${btn('/platform/', 'Explore Entangl', 'ink')}${tlink('/outage-report/', 'Use a different email')}</div></div>
  <figure class="rep-cover"><img src="/assets/img/outage-report-cover.webp" width="778" height="1100" alt="How data center outages escalate, the Entangl 2025/2026 report"></figure>
</section>
`,
};

const emailPage = {
  route: '/outage-report/email-preview/',
  title: 'Your annual data center outage report | Entangl',
  description: 'Your copy is ready: 52 pages, nine detailed cases, and practical lessons for your sites.',
  body: () => `
<section class="mail wrap" aria-labelledby="mail-title">
  <p class="code mail-tag">Email preview · R-405.2</p>
  <article class="mail-card">
    <header class="mail-head"><span class="code">Research · 2025 / 2026</span></header>
    <p class="label">The annual outage report</p>
    <h1 class="h2" id="mail-title">Your outage report is ready.</h1>
    <p>Thanks for requesting a copy. Explore what happened, why recovery took longer, and the questions to bring back to your team.</p>
    <p>${btn('https://entangl.com/reports/Entangl-Data-Center-Outages-2025-2026.pdf', 'Download the report', 'ink', 'down')}</p>
    <p class="code fine">PDF · 52 pages · 18 MB</p>
    <div class="mail-cover"><img src="/assets/img/outage-report-cover.webp" width="778" height="1100" alt="How data center outages escalate. Entangl, 2025/2026."><div><p class="label">An illustrated field guide</p><h2 class="h3">How data center outages escalate</h2><p>The failures. The recovery. The decisions that shape both.</p></div></div>
    <dl class="rep-stats"><div><dt>Detailed cases</dt><dd>9</dd></div><div><dt>Months of incidents</dt><dd>12</dd></div><div><dt>Operating gaps to review</dt><dd>5</dd></div></dl>
    <h2 class="h3">What does this mean for your sites?</h2>
    <p>Bring us a procedure, a review bottleneck, or a site question. We’ll show you how Entangl can help.</p>
    <p>${tlink('/demo/', 'Book a site demo')}</p>
    <footer class="mail-foot">You received this email because you requested the report from Entangl. Questions? <a class="inline-link" href="mailto:shapol@entangl.ai">shapol@entangl.ai</a><br>© 2026 Entangl, Inc. · entangl.com</footer>
  </article>
</section>
`,
};

export default [reportPage, thanksPage, emailPage];
