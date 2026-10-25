// One template for the platform sheets: the proof first, then what changes, the details,
// the test plan, the questions (logged as RFIs), and the next conversation.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { detail, stamp, statusLine, btn, tlink, esc, icon, rfiList, pad2, chip } from '../kit.mjs';
import { sheetFor, STATUS } from '../sheets.mjs';

const require = createRequire(import.meta.url);
const Scenes = require('../assets/js/scenes.js');
const DATA = JSON.parse(readFileSync(new URL('../data-platform.json', import.meta.url), 'utf8'));

const routeOf = key => key === 'overview' ? '/platform/' : `/platform/${key}/`;
const demoHref = h => h.replace(/^\/demo\?/, '/demo/?');
const lines = t => t.split('\n').map((l, i) => i ? `<span>${esc(l)}</span>` : esc(l)).join(' ');

export function platformPage(key) {
  const d = DATA[key], sheet = sheetFor(routeOf(key)), planned = sheet.status === 'planned';
  const name = key === 'overview' ? 'Platform overview' : sheet.title;
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/"><span class="code">G-001</span> Cover</a><span aria-hidden="true">/</span>${key === 'overview' ? `<span aria-current="page"><span class="code">P-201</span> Platform</span>` : `<a href="/platform/"><span class="code">P-201</span> Platform</a><span aria-hidden="true">/</span><span aria-current="page"><span class="code">${sheet.num}</span> ${esc(sheet.title)}</span>`}</nav>`;
  const body = `
<article class="pp" data-pp-page="${key}">
<header class="sheet-head wrap">
  ${crumbs}
  <div class="sheet-head-grid">
    <div>
      <p class="detail-kicker">${esc(d.eyebrow)}</p>
      <h1 class="h1 sheet-title">${lines(d.title)}</h1>
    </div>
    <div class="sheet-head-side">
      ${sheet.status ? `<p class="sheet-status">${statusLine(sheet.status)}</p>` : `<p class="sheet-status"><span class="status-line"><i aria-hidden="true" style="border-top-style:solid"></i>Eight workflows · one site context</span></p>`}
      <p class="lead">${esc(d.lead)}</p>
      <div class="actions">${btn(demoHref(d.ctaHref), esc(d.cta), 'ink')}${tlink('#proof', esc(d.demoLabel), 'down')}</div>
    </div>
  </div>
  <ol class="keys">${d.pills.map((p, i) => `<li><span class="code">${pad2(i + 1)}</span>${esc(p)}</li>`).join('')}</ol>
</header>

<section class="sec" id="proof" aria-labelledby="proof-title">
  <div class="wrap">
    ${detail({ n: 1, sheet: sheet.num, kicker: planned ? 'Interactive concept · planned workflow' : 'Explore an interactive example', title: lines(d.demoTitle), id: 'proof-title', scale: 'NTS · Illustrative', lead: esc(d.demoIntro) })}
    <div class="ppf${planned ? ' is-planned' : ''}">
      <div class="ppf-bar"><p><span class="code">ENTANGL / ${esc(name.toUpperCase())}</span>${sheet.status ? chip(sheet.status) : ''}</p>${planned ? stamp('Planned · concept only', 'amber') : ''}<button type="button" class="ppf-reset" data-pp-action="reset" aria-label="Reset the ${esc(name)} example">${icon('reset')}<span>Reset example</span></button></div>
      <div class="ppf-scene" data-scene>${Scenes.render(key, Scenes.clone(Scenes.DEFAULTS[key]))}</div>
      <p class="ppf-foot">${icon('file')}<span>Scripted, interactive preview. All facility records, tasks, measurements, and decisions are illustrative.</span></p>
    </div>
  </div>
</section>

<section class="sec" id="value" aria-labelledby="value-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: sheet.num, kicker: 'What changes for your team', title: lines(d.valueTitle), id: 'value-title', scale: '—', lead: esc(d.valueIntro) })}
    <ol class="tri">${d.value.map(([t, c], i) => `<li><span class="tri-n">${i + 1}</span><h3 class="h3">${esc(t)}</h3><p>${esc(c)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="sec" id="details" aria-labelledby="details-title">
  <div class="wrap">
    ${detail({ n: 3, sheet: sheet.num, kicker: 'The details that matter', title: lines(d.detailTitle), id: 'details-title', scale: '—', lead: esc(d.detailIntro) })}
    <ol class="spec">${d.detail.map(([t, c], i) => `<li><span class="code">3.${i + 1}</span><h3>${esc(t)}</h3><p>${esc(c)}</p></li>`).join('')}</ol>
    <p class="sec-more">${tlink('/enterprise/integrations/', 'Discuss systems and integrations, sheet E-301')}</p>
  </div>
</section>

<section class="sec" id="evaluate" aria-labelledby="eval-title">
  <div class="wrap">
    ${detail({ n: 4, sheet: sheet.num, kicker: 'Prove it on your site', title: 'A useful conversation starts with real work.', id: 'eval-title', scale: 'Your site', lead: esc(d.evalIntro) })}
    <table class="tplan"><caption class="sr-only">Test plan: what to bring and what to measure</caption>
      <thead><tr><th scope="col"><span class="code">IN</span> Bring to the conversation</th><th scope="col"><span class="code">AC</span> Measure in the evaluation</th></tr></thead>
      <tbody>${d.bring.map((b, i) => `<tr><td><span class="code">${pad2(i + 1)}</span>${esc(b)}</td><td><span class="code">${pad2(i + 1)}</span>${esc(d.measure[i] || '')}</td></tr>`).join('')}</tbody></table>
    <p class="sec-more">${tlink('/evaluate/', 'Open the evaluation planner, sheet R-404')}</p>
  </div>
</section>

<section class="sec" id="questions" aria-labelledby="q-title">
  <div class="wrap">
    ${detail({ n: 5, sheet: sheet.num, kicker: 'Buyer questions', title: 'The questions behind the decision.', id: 'q-title', scale: '—', lead: 'Get the details clear before committing to a rollout. Logged here the way a project logs requests for information.' })}
    <div class="qgrid">
      ${rfiList(d.faq.map(([q, a]) => [q, esc(a)]), { idBase: 'rfi' })}
      <aside class="scopebox"><p class="label">Workflow scope</p>${sheet.status ? `<p class="scopebox-status">${statusLine(sheet.status)}</p>` : ''}<p>${esc(d.scope)}</p><div class="scopebox-links">${tlink('/enterprise/security/', 'Security and deployment')}${tlink('/pricing/', 'Pricing and scope')}</div></aside>
    </div>
  </div>
</section>

<section class="sec" id="next" aria-labelledby="next-title">
  <div class="wrap next">
    <div><p class="detail-kicker">Make the next conversation specific</p><h2 class="h1" id="next-title">${lines(d.closeTitle)}</h2><p class="lead">${esc(d.closeCopy)}</p></div>
    <div class="next-act">${btn(demoHref(d.ctaHref), esc(d.cta), 'ink')}<p class="fine">No site files needed to book. We’ll agree how to share them if an evaluation follows.</p></div>
  </div>
</section>
</article>`;
  return {
    route: routeOf(key),
    title: { overview: 'The Entangl platform | Site knowledge connected to work', 'site-model': 'Data center site model | Entangl', procedures: 'Write MOPs, SOPs, and EOPs | Entangl', review: 'Review data center procedures | Entangl', fieldwork: 'Fieldwork and procedure training | Entangl', telemetry: 'AI telemetry for data center operations | Entangl', visibility: 'Customer and audit visibility for data centers | Entangl', maintenance: 'Data center maintenance planning | Entangl', portfolio: 'Data center portfolio performance | Entangl' }[key],
    description: { overview: 'Explore how Entangl connects site knowledge, procedures, reviews, fieldwork, telemetry and customer evidence. Try the interactive workflow and plan a site evaluation.', 'site-model': 'Explore a data center site model that connects equipment, drawings, manuals and procedures. Trace dependencies and distinguish documented, observed and measured states.', procedures: 'Create MOP, SOP and EOP drafts using facility documents, equipment context and your requirements. Explore an interactive draft and learn how to evaluate Entangl.', review: 'Review existing data center procedures against facility information. Inspect findings, compare sources and explore reviewer decisions in Entangl’s interactive example.', fieldwork: 'Explore Entangl’s tablet fieldwork and training workflow. Try a guided rehearsal, equipment identity checks, observations and witness gates using a fictional procedure.', telemetry: 'Explore how Entangl can connect data center telemetry, related alarms, equipment context and response procedures. Replay an interactive fictional cooling incident.', visibility: 'Explore customer and auditor views of data center procedures, approvals and execution evidence. Switch audiences in an interactive example and plan the right access boundaries.', maintenance: 'Explore Entangl’s planned maintenance workflow. Resolve a fictional scheduling conflict and see how manuals, dependencies, parts and work packages shape a maintenance plan.', portfolio: 'Explore Entangl’s planned portfolio view. Compare fictional site review queues, overdue work and customer demand, then inspect the records behind the numbers.' }[key],
    scripts: ['scenes', 'platform'],
    related: d.related.map(r => r + '/'),
    relatedTitle: key === 'overview' ? 'Explore the platform' : 'Keep the work connected',
    body,
  };
}
