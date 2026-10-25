// Six pressures, worked. Each is a question an operator already asks, answered as a worked
// example with the assumptions written down. Logic and wording follow the original site.
import { esc, icon, sheetRef } from '../kit.mjs';
import { sheetFor } from '../sheets.mjs';

const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
const time = m => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };

// A "given" line: label, dotted leader, a value you can change, and its unit.
// The blank is sized to the largest number it can hold, so a value is never cut off.
const blankWidth = (max, step) => Math.max(3, String(Math.round(max)).length + (String(step).includes('.') ? 2 : 0)) + 0.8;
export const given = (key, label, min, max, step, value, unit) => `<div class="given" style="--w:${blankWidth(max, step)}ch">
  <label for="pz-${key}">${esc(label)}</label><span class="given-dots" aria-hidden="true"></span>
  <span class="given-val"><button type="button" class="step" data-step="-1" data-for="pz-${key}" aria-label="Decrease ${esc(label.toLowerCase())}">${icon('minus')}</button><input class="blank" id="pz-${key}" data-pz="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${value}"><button type="button" class="step" data-step="1" data-for="pz-${key}" aria-label="Increase ${esc(label.toLowerCase())}">${icon('plus')}</button><span class="given-unit">${esc(unit)}</span></span>
</div>`;

const research = (pct, copy, ref) => `<div class="pz-research"><p class="label">Industry research</p><p class="pz-stat"><b>${pct}</b><span>%</span></p><p>${copy}${ref}</p></div>`;
const product = (route, help) => { const s = sheetFor(route); return `<div class="pz-product"><p class="label">Where Entangl fits</p><p>${help}</p>${sheetRef(s)}</div>`; };

export const PRESSURES = [
  { key: 'uptime', label: 'Protect uptime', q: 'One change. What else does it touch?', pain: 'The procedure names an asset. Your reviewer needs to see what depends on it. Select an asset and follow its documented connection.' },
  { key: 'scale', label: 'Scale your team’s work', q: 'More sites. The same few experts.', pain: 'Every new site adds procedure work. Change the inputs to see how much preparation and review time your portfolio requires.' },
  { key: 'response', label: 'Make sense of signals', q: 'The readings are here. The response isn’t.', pain: 'Three readings describe a situation. Someone still needs the context and responsibility to act.' },
  { key: 'efficiency', label: 'Find time lost waiting', q: 'The job takes 90 minutes. Why does it take all day?', pain: 'Waiting between people can occupy more of the day than the work itself. Try your own handoff delays.' },
  { key: 'visibility', label: 'Make the record clear', q: '“Who approved this, and what happened next?”', pain: 'Follow one event from the first signal to a published update. Switch audience to see which information is available at each moment.' },
  { key: 'growth', label: 'Spot the capacity conversation', q: 'Your customer is growing. Does the account team know?', pain: 'Your customer’s usage can become a commercial conversation. Move the measured demand to see how much contractual headroom remains.' },
];

function uptime(ref) {
  return `<div class="pz-work"><div class="trace" data-pz-trace data-asset="b" data-traced="false">
    <div class="seg seg-sm" role="group" aria-label="Choose equipment to trace">${[['a', 'UPS-A'], ['b', 'UPS-B'], ['cooling', 'CRAH-02']].map(([k, n]) => `<button type="button" data-asset="${k}" aria-pressed="${k === 'b'}">${n}</button>`).join('')}</div>
    <svg class="sld" viewBox="0 0 640 300" role="img" aria-labelledby="sld-t"><title id="sld-t">Simplified example: UPS-A connects to Hall 01 through PDU-A. UPS-B connects to Hall 02 through PDU-B. CRAH-02 serves Hall 02. Current operating states are not verified.</title>
      <g class="sld-route" data-route="a"><path class="sld-hl" d="M150 60H500"/><path class="sld-wire" d="M150 60H250M370 60H480"/><rect x="20" y="32" width="130" height="56"/><text x="85" y="66">UPS-A</text><rect x="250" y="32" width="120" height="56"/><text x="310" y="66">PDU-A</text><rect x="480" y="32" width="140" height="56"/><text x="550" y="66">HALL 01</text></g>
      <g class="sld-route" data-route="b"><path class="sld-hl" d="M150 150H500"/><path class="sld-wire" d="M150 150H250M370 150H480"/><rect x="20" y="122" width="130" height="56"/><text x="85" y="156">UPS-B</text><rect x="250" y="122" width="120" height="56"/><text x="310" y="156">PDU-B</text><rect x="480" y="122" width="140" height="56"/><text x="550" y="156">HALL 02</text></g>
      <g class="sld-route" data-route="cooling"><path class="sld-hl" d="M150 240H440Q460 240 460 220V196Q460 178 480 172"/><path class="sld-wire sld-dash" d="M150 240H440Q460 240 460 220V196Q460 178 480 172"/><rect x="20" y="212" width="130" height="56"/><text x="85" y="246">CRAH-02</text><text class="sld-note" x="300" y="262">COOLING CONNECTION</text></g>
    </svg>
    <div class="trace-result"><span class="trace-n" data-trace-n>?</span><p><b data-trace-title>What depends on UPS-B?</b><span data-trace-sub>Trace the documented connection to find out.</span></p></div>
    <button type="button" class="lf-act" data-pz-act="trace" aria-pressed="false"><span data-trace-btn>Trace the connection</span>${icon('link')}</button>
  </div></div>
  <aside class="pz-side">${research('57', 'of respondents reported their most recent major outage cost more than $100,000.', ref('uptime-2026'))}
  <p class="caution">Connectivity is one part of a review. Confirm current states, redundancy, and approvals before real work.</p>
  ${product('/platform/site-model/', 'Connect a procedure to the equipment and source drawings your reviewer needs.')}</aside>`;
}

function scale(ref) {
  return `<div class="pz-work"><div class="calc" data-pz-calc="scale">
    <div class="calc-row"><p class="calc-k">Given</p><div class="calc-v">${given('sites', 'Sites in your portfolio', 1, 24, 1, 8, 'sites')}${given('procedures', 'Procedures per site, per month', 1, 40, 1, 12, 'procedures')}${given('hours', 'Preparation + review per procedure', .5, 8, .5, 4, 'hours')}</div></div>
    <div class="calc-row"><p class="calc-k">Find</p><div class="calc-v"><p>Monthly engineering hours spent preparing and reviewing procedures.</p></div></div>
    <div class="calc-row calc-sol"><p class="calc-k">Solution</p><div class="calc-v" aria-live="polite"><p class="calc-eq"><span data-o="sites">8</span> × <span data-o="procedures">12</span> × <span data-o="hours">4</span> h = <b><span data-o="total">384</span> h / month</b></p><p class="calc-eq calc-eq-2">= <span data-o="reviews">96</span> procedures · <span data-o="days">48</span> eight-hour workdays</p>
      <div class="sites" data-o="tiles" aria-hidden="true"></div></div></div>
    <div class="calc-row"><p class="calc-k">Note</p><div class="calc-v"><p class="fine">Adjustable workload estimate. Preparation and review time per procedure is your assumption; no savings are predicted.</p></div></div>
  </div></div>
  <aside class="pz-side">${research('46', 'of surveyed operators reported difficulty finding qualified candidates.', ref('survey-2025'))}
  ${product('/platform/procedures/', 'Bring site information into procedure preparation and review. Use your own workload to define a useful evaluation.')}</aside>`;
}

function response() {
  const readings = [['H02-INLET-02', 'Inlet temperature', '29.4', '°C', 'Above sample threshold'], ['CRAH02-RETURN', 'Return temperature', '33.1', '°C', 'Related reading'], ['CRAH02-FAN', 'Fan speed', '82', '%', 'Related reading']];
  return `<div class="pz-work"><div class="signals" data-pz-signals data-grouped="false">
    <p class="signals-head"><span class="label">Hall 02 · fictional signals</span><span class="stamp flat" data-sig-tag>Awaiting context</span></p>
    <ul class="signals-list">${readings.map(r => `<li><span class="code">${r[0]}</span><b>${r[2]}<small>${r[3]}</small></b><span>${r[1]}</span><em>${r[4]}</em></li>`).join('')}</ul>
    <svg class="signals-join" viewBox="0 0 600 60" aria-hidden="true"><path d="M100 0V22Q100 32 110 32H290Q300 32 300 42V60M300 0V60M500 0V22Q500 32 490 32H310Q300 32 300 42"/></svg>
    <div class="issue"><span class="issue-n" data-sig-n>?</span><div><p class="code" data-sig-ref>READINGS RECEIVED · NO RESPONSE ORGANIZED</p><h4 data-sig-title>Who is picking this up?</h4><p data-sig-copy>The numbers arrived. The asset records, review, and field task still need to come together.</p></div></div>
    <button type="button" class="lf-act" data-pz-act="group" aria-pressed="false"><span data-sig-btn>Bring the context together</span>${icon('link')}</button>
    <p class="fine" data-sig-note>Same sample signals. Watch the context change.</p>
    <p class="fine">Scripted example of readings attached to an issue. It does not diagnose a fault or control equipment.</p>
  </div></div>
  <aside class="pz-side">${product('/platform/telemetry/', 'Explore how telemetry could connect a reading to an issue and an operator’s next decision.')}</aside>`;
}

function efficiency() {
  return `<div class="pz-work"><div class="calc" data-pz-calc="efficiency">
    <div class="calc-row"><p class="calc-k">Given</p><div class="calc-v"><p class="fine calc-fixed">Preparation 45 min · Review 15 min · Record 30 min = 90 minutes of work</p>${given('reviewWait', 'Waiting for a reviewer', 0, 480, 15, 180, 'min')}${given('fieldWait', 'Waiting for a field handoff', 0, 480, 15, 240, 'min')}</div></div>
    <div class="calc-row calc-sol"><p class="calc-k">Solution</p><div class="calc-v" aria-live="polite"><p class="calc-eq">90 + <span data-o="review">180</span> + <span data-o="field">240</span> min = <b><span data-o="elapsed">8h 30m</span> elapsed</b></p><p class="calc-eq calc-eq-2"><span data-o="wait">7h</span> waiting between people = <b><span data-o="pct">82</span>%</b> of the day</p>
      <div class="gantt" data-o="gantt" role="img" aria-label="Timeline: 90 minutes of work and 420 minutes of waiting"></div>
      <p class="gantt-key"><span><i class="work"></i>Work</span><span><i class="wait"></i>Waiting</span></p></div></div>
    <div class="calc-row"><p class="calc-k">Note</p><div class="calc-v"><p class="fine">Sequential example; work time is fixed at 90 minutes. These timings are assumptions, not measured Entangl results. Use the picture to find a handoff worth improving.</p></div></div>
  </div></div>
  <aside class="pz-side">${product('/platform/review/', 'Keep the source evidence and outstanding decision alongside the procedure your reviewer needs to assess.')}</aside>`;
}

export const EVENTS = [
  ['09:41', 'Issue created', 'Telemetry workflow', 'ISS-014', 'Hall 02 inlet temperature crossed the sample threshold.', 'Issue'],
  ['09:43', 'Response reviewed', 'Demo operator', 'Review R-014', 'The operator reviewed the linked signal and asset context. The cause remained unconfirmed.', 'Review'],
  ['09:45', 'Field task approved', 'Demo operator', 'Approval A-014', 'A non-invasive inspection was approved and assigned to the fictional field engineer.', 'Approval'],
  ['09:50', 'Observations returned', 'Demo field engineer', 'Task TSK-014', 'The field observations were attached to the issue for operator review.', 'Field record'],
  ['09:53', 'Issue closed after review', 'Demo operator', 'Closure C-014', 'The operator reviewed the returned record and closed the sample issue.', 'Closure'],
  ['09:55', 'Customer update published', 'Demo operator', 'Notice N-014', 'An approved closure update was made available in the customer view.', 'Publication'],
];

function visibility() {
  return `<div class="pz-work"><div class="chron" data-pz-chron data-audience="auditor" data-at="2">
    <div class="chron-head"><p class="label">One event · two responsibilities</p><div class="seg seg-sm" role="group" aria-label="Choose an evidence audience"><button type="button" data-aud="auditor" aria-pressed="true">${icon('file')}Auditor</button><button type="button" data-aud="customer" aria-pressed="false">${icon('eye')}Customer</button></div></div>
    <ol class="chron-list">${EVENTS.map((e, i) => `<li data-i="${i}"><button type="button" data-at="${i}" aria-pressed="${i === 2}"><span class="code">${e[0]}</span><span>${e[5]}</span></button></li>`).join('')}</ol>
    <label class="sr-only" for="pz-at">Move through the event</label><input id="pz-at" type="range" min="0" max="5" step="1" value="2" aria-valuetext="09:45, Field task approved">
    <div class="chron-card" aria-live="polite"><div data-view="auditor"><p class="chron-meta"><span class="code">ISS-014 · AUDIT HISTORY</span><span class="code" data-c-count>3 of 6 records available</span></p><p class="chron-time code" data-c-time>09:45</p><h4 data-c-title>Field task approved</h4><p data-c-copy>A non-invasive inspection was approved and assigned to the fictional field engineer.</p><dl class="lf-rows"><div><dt>Recorded by</dt><dd data-c-owner>Demo operator</dd></div><div><dt>Evidence reference</dt><dd class="code" data-c-ref>Approval A-014</dd></div></dl></div>
      <div data-view="customer" hidden><p class="chron-meta"><span class="code">${icon('lock')}CUSTOMER B · SUITE 02</span><span class="code">Published information</span></p><h4 data-cu-title>No update published yet.</h4><p data-cu-copy>The internal work record exists. A customer notice becomes visible only after publication at 09:55 in this example.</p><dl class="lf-rows"><div><dt>Latest notice</dt><dd class="code" data-cu-notice>None published</dd></div><div><dt>Scope</dt><dd>Customer B only</dd></div></dl></div></div>
    <p class="fine">Illustrative chronology and audience views. These sample records describe a fictional event; they are not live facility records.</p>
  </div></div>
  <aside class="pz-side">${product('/platform/visibility/', 'Explore the evidence your customers and auditors need, within an agreed information boundary.')}</aside>`;
}

function growth() {
  return `<div class="pz-work"><div class="calc" data-pz-calc="growth">
    <div class="calc-row"><p class="calc-k">Given</p><div class="calc-v"><p class="fine calc-fixed">Customer B · contracted limit 500 kW · illustrative 30-day demand</p>${given('load', 'Highest measured demand in the period', 250, 550, 5, 465, 'kW')}
      <div class="seg seg-sm presets" role="group" aria-label="Example demand levels"><button type="button" data-load="350" aria-pressed="false">350 kW · Room to plan</button><button type="button" data-load="465" aria-pressed="true">465 kW · Getting close</button><button type="button" data-load="525" aria-pressed="false">525 kW · Above the limit</button></div></div></div>
    <div class="calc-row calc-sol"><p class="calc-k">Solution</p><div class="calc-v" aria-live="polite"><p class="calc-eq"><span data-o="load">465</span> kW ÷ 500 kW = <b><span data-o="pct">93</span>% of contracted load</b></p><p class="calc-eq calc-eq-2"><span data-o="head">35 kW below</span> the contractual limit · <b data-o="status">A capacity conversation is worth starting</b></p>
      <svg class="demand" viewBox="0 0 630 260" role="img" aria-labelledby="demand-t"><title id="demand-t">Illustrative demand shape with a selected peak and a contractual limit of 500 kilowatts. Not a forecast.</title><path class="demand-grid" d="M45 220H590M45 160H590M45 100H590"/><text x="38" y="224" text-anchor="end">0</text><text x="38" y="164" text-anchor="end">200</text><text x="38" y="104" text-anchor="end">400</text><path class="demand-limit" d="M45 70H590"/><text class="demand-limit-t" x="45" y="58">CONTRACTED LIMIT · 500 kW</text><path class="demand-area" data-o="area"/><path class="demand-line" data-o="line"/><circle class="demand-end" data-o="end" r="6"/><text x="45" y="248">30-DAY EXAMPLE</text><text x="590" y="248" text-anchor="end">PEAK</text></svg></div></div>
    <div class="calc-row"><p class="calc-k">Note</p><div class="calc-v"><p class="fine">Contractual headroom is not verified site capacity. Review power, cooling, and redundancy constraints before offering expansion.</p></div></div>
  </div></div>
  <aside class="pz-side">${product('/platform/portfolio/', 'The portfolio direction connects operational records to decisions about the business. Define the capacity evidence your account team needs.')}</aside>`;
}

const BODIES = { uptime, scale, response, efficiency, visibility, growth };

export function pressures({ ref, sheet = 'G-001', n = 3 }) {
  return `<div class="pz-set" data-pz>
  <div class="pz-index" role="tablist" aria-label="Six operating pressures">${PRESSURES.map((p, i) => `<button class="pz-tab" type="button" role="tab" id="pz-tab-${p.key}" aria-controls="pressure-${p.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="code">${n}.${i + 1}</span><b>${esc(p.label)}</b></button>`).join('')}</div>
  ${PRESSURES.map((p, i) => `<article class="pz" id="pressure-${p.key}" role="tabpanel" aria-labelledby="pz-tab-${p.key} pz-q-${p.key}"${i ? ' hidden' : ''}>
    <header class="pz-head"><p class="pz-num"><span class="code">${n}.${i + 1}</span> ${esc(p.label)}</p><h3 class="pz-q" id="pz-q-${p.key}">${esc(p.q)}</h3><p class="pz-pain">${esc(p.pain)}</p></header>
    <div class="pz-grid">${BODIES[p.key](ref)}</div>
  </article>`).join('')}
</div>`;
}
