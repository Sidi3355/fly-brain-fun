// G-001 · Cover. One asset, the six things connected to it, the life of one facility, the six
// pressures worked through, one finding, and the drawing list for the whole set.
import { detail, stamp, chip, icon, btn, tlink, esc, noteRefs, sheetRef } from '../kit.mjs';
import { SHEETS, GROUPS, STATUS, sheetFor } from '../sheets.mjs';
import { lifecycle } from '../parts/lifecycle.mjs';
import { pressures } from '../parts/pressures.mjs';

const notes = [
  { id: 'fictional', text: 'North Campus / DC-01 is an illustrative facility. Every equipment tag, document number, person and record on this site is fictional, and no record describes work to carry out at a real facility.' },
  { id: 'lifecycle', text: 'The lifecycle plan is a demonstration of Entangl’s lifecycle vision. All scenarios and values are illustrative; product scope is agreed for each deployment.' },
  { id: 'uptime-2026', text: 'Uptime Institute, <em>Annual outage analysis 2026</em>, drawing on its 2025 annual survey: 57% of respondents put their most recent major outage cost above $100,000. Costs are self-reported. This is industry context, not an Entangl outcome.', href: 'https://intelligence.uptimeinstitute.com/resource/annual-outage-analysis-2026', link: 'Read the published finding' },
  { id: 'survey-2025', text: 'Uptime Institute, <em>Global Data Center Survey 2025</em>, Figure 15, page 24: 46% reported difficulty finding qualified candidates; 650 respondents to this question. A hiring indicator, not a measure of Entangl productivity.', href: 'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf#page=25', link: 'Read the survey' },
  { id: 'worked', text: 'Industry research describes the problem. The worked examples use illustrative, editable assumptions and are not measured Entangl outcomes. They measure different things and are never added into a single ROI figure.' },
];
const ref = noteRefs(notes);

const things = [
  { kind: 'Drawing', ic: 'drawing', code: 'SLD-001 · Rev C', status: 'core', href: '/platform/site-model/',
    note: 'The documented arrangement: UPS-B connects through PDU-B to Hall 02. A drawing records an arrangement; it does not verify the present operating state.' },
  { kind: 'Manual', ic: 'manual', code: 'UPS-B · Equipment manual', status: 'core', href: '/platform/site-model/', mid: true,
    note: 'Manufacturer instructions and sequences of operation give the equipment practical context in every draft.' },
  { kind: 'Procedure', ic: 'procedure', code: 'MOP-024 · Rev C', status: 'core', href: '/platform/procedures/',
    note: 'The procedure for the UPS-B inspection, written and reviewed against the drawing and the manual. Generating it authorizes nothing.' },
  { kind: 'Person', ic: 'person', code: 'Qualified site technician', status: 'scoped', href: '/platform/fieldwork/', low: true,
    note: 'Assigned to work order WO-041. Qualifications and responsibilities follow the equipment and the work.' },
  { kind: 'Part', ic: 'part', code: 'Test instrument · In date', status: 'planned', href: '/platform/maintenance/', low: true, mid: true,
    note: 'The item the work needs, ready before it starts. Parts and vendor readiness belong to the planned maintenance workflow.' },
  { kind: 'Record', ic: 'record', code: 'WO-041 · Readings & sign-off', status: 'scoped', href: '/platform/visibility/', low: true,
    note: 'The work evidence stays attached to the equipment, for the next shift and for the people who need to see what happened.' },
];

const schematic = () => `<figure class="schematic" data-plot data-schematic aria-labelledby="sx-title">
  <h2 class="sr-only" id="sx-title">One asset and the six things connected to it</h2>
  <div class="sx">
    ${things.map((t, i) => `<div class="sx-node c${(i % 3) + 1}${t.low ? ' low' : ''}${t.mid ? ' mid' : ''}" data-status="${t.status}" style="--i:${i}">
      <a href="${t.href}"><span class="sx-kind">${icon(t.ic)}${t.kind}</span><span class="sx-code">${esc(t.code)}</span><span class="sx-note">${esc(t.note)}</span><span class="sx-tag">${chip(t.status)}</span></a>
    </div>`).join('')}
    <div class="sx-bus"><span class="sx-trace" aria-hidden="true"></span><p class="sx-asset"><b>UPS-B</b><span>North Campus · Hall 02 power</span></p></div>
  </div>
  <p class="sx-caption" aria-hidden="true"><span class="sx-caption-hint">Point at any of the six to trace it back to the asset.</span><span class="sx-caption-text"></span></p>
  <figcaption class="sx-legend"><span class="label">Line weight shows what exists today</span>${chip('core')}${chip('scoped')}${chip('planned')}<span>Illustrative records${ref('fictional')}</span></figcaption>
</figure>`;

// The finding: the same drawing at two revisions.
const finding = () => `<div class="find">
  <div class="find-doc">
    <p class="find-head"><span class="code">MOP-024 · Draft rev 02</span><span class="label">Procedure</span></p>
    <h3 class="find-title">UPS-B maintenance review</h3>
    <p class="find-sub">North Campus · Hall 02 · Section 02 / Reference documents</p>
    <ol class="find-refs"><li><span class="code">EOP-003</span> Cooling investigation</li><li class="is-flag"><span class="code">SLD-001</span> Electrical one-line <b class="code">Rev B</b><svg class="find-cloud" viewBox="0 0 300 44" preserveAspectRatio="none" aria-hidden="true"><path d="M6 8 Q16 0 26 8 Q36 0 46 8 Q56 0 66 8 Q76 0 86 8 Q96 0 106 8 Q116 0 126 8 Q136 0 146 8 Q156 0 166 8 Q176 0 186 8 Q196 0 206 8 Q216 0 226 8 Q236 0 246 8 Q256 0 266 8 Q276 0 286 8 Q296 14 286 22 Q296 30 286 36 Q276 44 266 36 Q256 44 246 36 Q236 44 226 36 Q216 44 206 36 Q196 44 186 36 Q176 44 166 36 Q156 44 146 36 Q136 44 126 36 Q116 44 106 36 Q96 44 86 36 Q76 44 66 36 Q56 44 46 36 Q36 44 26 36 Q16 44 6 36 Q-4 30 6 22 Q-4 14 6 8Z"/></svg><span class="find-delta" aria-hidden="true">1</span></li><li><span class="code">OPS-RULE-07</span> Example witness requirement</li></ol>
  </div>
  <div class="find-ne" aria-hidden="true"><span>≠</span></div>
  <div class="find-doc find-reg">
    <p class="find-head"><span class="code">Site document register</span><span class="label">Record</span></p>
    <h3 class="find-title">Electrical one-line</h3>
    <p class="find-sub">SLD-001 · North Campus</p>
    <dl class="lf-rows"><div><dt>Current record</dt><dd class="code"><mark>Revision C</mark></dd></div><div><dt>Previous record</dt><dd class="code">Revision B</dd></div><div><dt>Equipment context</dt><dd>UPS-B / Hall 02</dd></div><div><dt>Revision note</dt><dd>Equipment reference updated</dd></div></dl>
  </div>
  <div class="find-decision">
    <p class="label"><span class="find-delta" aria-hidden="true">1</span> Finding to resolve</p>
    <p class="find-q">A newer revision is in the site record. The procedure lists Rev B; the register contains Rev C.</p>
    <ol class="find-steps"><li>Confirm which drawing revision applies.</li><li>Ask the author to resolve the source reference and assess the change.</li><li>Return the revised draft for the required review.</li></ol>
    <p class="find-stamps">${stamp('AI review complete', 'flat')} ${stamp('Engineer decision pending', 'amber')}</p>
    <p class="find-rule">A review is not an approval. Your authorized people decide whether a procedure is ready for work.</p>
  </div>
</div>`;

const dlTable = (groups, caption) => `<table class="dl">
  <caption class="sr-only">${caption}</caption>
  <thead><tr><th scope="col">Sheet</th><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Rev</th></tr></thead>
  ${groups.map(id => GROUPS.find(g => g.id === id)).map(g => `<tbody><tr class="dl-group"><th colspan="4" scope="rowgroup">${esc(g.title)}</th></tr>${SHEETS.filter(s => s.group === g.id && !s.hidden).map(s => `<tr><td class="code">${s.num}</td><td><a href="${s.route}">${esc(s.title)}</a></td><td>${s.status ? chip(s.status) : '<span class="chip">—</span>'}</td><td class="code">C</td></tr>`).join('')}</tbody>`).join('')}
</table>`;
const drawingList = () => `<div class="dl-cols">${dlTable(['general', 'lifecycle', 'enterprise'], 'Drawing list, part 1: general, lifecycle and enterprise sheets')}${dlTable(['platform', 'proof'], 'Drawing list, part 2: platform, proof and research sheets')}</div>`;

export default {
  route: '/',
  title: 'Entangl | AI for data center engineering and operations',
  description: 'Write and review data center procedures using your site documents, equipment, and rules. Explore Entangl’s vision for the full facility lifecycle.',
  scripts: ['home', 'lifecycle', 'pressures'],
  notes,
  related: ['/platform/', '/lifecycle/', '/proof/', '/evaluate/'],
  relatedTitle: 'Continue to',
  body: () => `
<section class="cover wrap" aria-labelledby="cover-title">
  <div class="cover-grid">
    <div class="cover-top">
      <p class="cover-project"><b>Entangl</b> · AI for data center engineering and operations</p>
      <h1 class="cover-title display" id="cover-title">The work is connected. <span>The information should be too.</span></h1>
      <p class="cover-issue">${stamp('Issued for review · Rev C')}</p>
    </div>
    ${schematic()}
    <div class="cover-foot">
      <p class="lead">The drawing is in one place. The manual is in another. The latest change is with someone on shift. Entangl connects that site information to the procedure your team needs to write or review.</p>
      <div class="actions">${btn('/demo/', 'Book a site demo', 'ink')}${tlink('#life', 'Follow the life of one facility', 'down')}</div>
    </div>
  </div>
</section>

<section class="sec" id="life" aria-labelledby="life-title">
  <div class="wrap">
    ${detail({ n: 2, sheet: 'G-001', kicker: 'The life of a data center', title: 'One facility. A lifetime of decisions.', id: 'life-title', scale: 'NTS · Illustrative',
      lead: `From bringing it live to everything that comes next. Walk through six moments on the same floor plan and watch the people, equipment and work change.${ref('lifecycle')}` })}
    ${lifecycle({ sheet: 'G-001' })}
    <p class="sec-more">${tlink('/lifecycle/', 'The connected lifecycle, sheet L-101')}</p>
  </div>
</section>

<section class="sec" id="outcomes" aria-labelledby="pz-title">
  <div class="wrap">
    ${detail({ n: 3, sheet: 'G-001', kicker: 'Six pressures. Explore the numbers.', title: 'Start with the pressure you’re under.', id: 'pz-title', scale: 'Your numbers',
      lead: `Protect uptime. Give your teams time back. Make growth visible. Each pressure is worked through with its assumptions written down, so you can change them.${ref('worked')}` })}
    ${pressures({ ref, n: 3 })}
  </div>
</section>

<section class="sec" id="finding" aria-labelledby="find-title">
  <div class="wrap">
    ${detail({ n: 4, sheet: 'G-001', kicker: 'Illustrative example', title: 'One finding. Follow the evidence.', id: 'find-title', scale: '1:1',
      lead: 'The procedure references an older drawing revision. See the reference, compare the revisions, and the decision your reviewer needs to make.' })}
    ${finding()}
    <p class="sec-more">${tlink('/proof/example/', 'Inspect the full review example, sheet R-402')}</p>
  </div>
</section>

<section class="sec" id="drawing-list" aria-labelledby="dl-title">
  <div class="wrap">
    ${detail({ n: 5, sheet: 'G-001', kicker: 'Drawing list', title: 'Everything in this set, and how real it is today.', id: 'dl-title', scale: '—',
      lead: 'Every sheet carries its status. Core workflows are in use today. Scoped workflows are defined with each deployment. Planned workflows are concepts for discussing the direction, and are drawn dashed wherever they appear.' })}
    ${drawingList()}
  </div>
</section>

<section class="sec" id="next" aria-labelledby="next-title">
  <div class="wrap next">
    <div>
      <p class="detail-kicker">Your site is next</p>
      <h2 class="h1" id="next-title">Bring us a task your team knows well.</h2>
      <p class="lead">Bring a procedure, a review bottleneck, or a site question. Agree what to test and what a useful result looks like.</p>
    </div>
    <div class="next-act">${btn('/demo/', 'Book a site demo', 'ink')}<p class="fine">No site files needed to book. We’ll agree how to share them if an evaluation follows.</p></div>
  </div>
</section>
`,
};
