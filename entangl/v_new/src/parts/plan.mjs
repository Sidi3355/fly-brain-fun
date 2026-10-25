// North Campus / DC-01, drawn as a floor plan. One facility for every lifecycle moment:
// the base plan never changes; each moment adds its own annotations on top.
// All equipment and records are fictional (see the cover sheet's general notes).
//
// Layout (viewBox 1000 × 640): building x60–700 / y64–464; proposed Hall 03 x724–944 /
// y64–284. Annotation bands: right (x732–988, slots at y306 / 368 / 430), bottom
// (y486–532, slots at x60 / 352), top (y22–50). Title, scale and north sit in the bottom corners.

const R = (x, y, w, h, cls = '', extra = '') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const T = (x, y, text, cls = 'pl-tag', extra = '') => `<text class="${cls}" x="${x}" y="${y}" ${extra}>${text}</text>`;

// A revision cloud around a box: scallops along each side, the way changes are marked on a drawing.
export function cloud(x, y, w, h, r = 7) {
  const seg = len => Math.max(2, Math.round(len / (r * 1.8)));
  const nx = seg(w), ny = seg(h), sx = w / nx, sy = h / ny;
  let d = `M${x} ${y}`;
  for (let i = 1; i <= nx; i++) d += ` A${(sx / 2).toFixed(1)} ${r} 0 0 1 ${(x + sx * i).toFixed(1)} ${y}`;
  for (let i = 1; i <= ny; i++) d += ` A${r} ${(sy / 2).toFixed(1)} 0 0 1 ${x + w} ${(y + sy * i).toFixed(1)}`;
  for (let i = 1; i <= nx; i++) d += ` A${(sx / 2).toFixed(1)} ${r} 0 0 1 ${(x + w - sx * i).toFixed(1)} ${y + h}`;
  for (let i = 1; i <= ny; i++) d += ` A${r} ${(sy / 2).toFixed(1)} 0 0 1 ${x} ${(y + h - sy * i).toFixed(1)}`;
  return `<path class="pl-cloud" d="${d}Z"/>`;
}

const SLOT = { r1: [732, 306], r2: [732, 368], r3: [732, 430], b1: [60, 486], b2: [352, 486], top: [90, 20], top2: [400, 20] };
const W = { r: 256, b: 280, top: 300 };

// A callout box in a named slot, with an optional leader from an anchor point on the plan.
export function callout({ slot, title, detail, cls = '', from, w }) {
  const [x, y] = SLOT[slot], h = detail ? 46 : 30, bw = w || (slot.startsWith('r') ? W.r : slot.startsWith('b') ? W.b : W.top);
  let leader = '';
  if (from) {
    const [ax, ay] = from;
    // Meet the box on its nearest edge.
    const lx = Math.min(Math.max(ax, x + 14), x + bw - 14), ly = ay < y ? y : ay > y + h ? y + h : y + h / 2;
    const ex = ax < x ? x : ax > x + bw ? x + bw : lx;
    const end = (ay >= y && ay <= y + h) ? [ex, ly] : [lx, ly];
    leader = `<path class="pl-leader" d="M${ax} ${ay} L${end[0]} ${end[1]}"/><circle class="pl-anchor" cx="${ax}" cy="${ay}" r="3.4"/>`;
  }
  return `<g class="pl-callout ${cls}">${leader}<rect class="pl-cbox" x="${x}" y="${y}" width="${bw}" height="${h}"/><text class="pl-ctitle" x="${x + 10}" y="${y + 19}">${title}</text>${detail ? `<text class="pl-cdetail" x="${x + 10}" y="${y + 36}">${detail}</text>` : ''}</g>`;
}

const person = (x, y, cls = '') => `<g class="pl-person ${cls}" transform="translate(${x} ${y})"><circle r="9"/><circle class="pl-head" cy="-2.8" r="2.8"/><path class="pl-body" d="M-4.8 4.8a4.8 4.8 0 0 1 9.6 0"/></g>`;
const alarm = (x, y) => `<path class="pl-alarm" d="M${x} ${y - 7}l7 12h-14z"/>`;

function racks(x0, cls = '') {
  let out = '';
  for (const y of [100, 156, 212]) for (const dy of [0, 13]) for (let i = 0; i < 11; i++) out += R(x0 + 28 + i * 23, y + dy, 21, 13, 'pl-rack ' + cls);
  return out;
}

function base() {
  const doors = [[118, 284, 1], [452, 284, 1], [420, 316, -1], [604, 316, -1]].map(([x, y, s]) =>
    `<path class="pl-door" d="M${x} ${y}h24"/><path class="pl-swing" d="M${x + 24} ${y} a24 24 0 0 ${s > 0 ? 0 : 1} -24 ${-24 * s}"/>`).join('');
  return `
  <g class="pl-base">
    ${R(16, 8, 968, 624, 'pl-property')}
    ${R(60, 64, 640, 400, 'pl-wall')}
    <path class="pl-part" d="M60 284H700M60 316H700M380 64V284M380 316V464M540 316V464"/>
    ${doors}
    <g class="pl-hall pl-hall1">${racks(60)}</g>
    <g class="pl-hall pl-hall2">${racks(380)}</g>
    ${R(268, 250, 54, 22, 'pl-unit pl-crah1')}${T(295, 266, 'CRAH-01', 'pl-tag', 'text-anchor="middle"')}
    ${R(588, 250, 54, 22, 'pl-unit pl-crah2')}${T(615, 266, 'CRAH-02', 'pl-tag', 'text-anchor="middle"')}
    ${R(84, 334, 150, 24, 'pl-unit pl-msg')}<path class="pl-thin" d="M109 334v24M134 334v24M159 334v24M184 334v24M209 334v24"/>${T(84, 377, 'MAIN SWITCHGEAR')}
    ${R(84, 392, 66, 48, 'pl-unit pl-upsa')}${T(117, 421, 'UPS-A', 'pl-tag', 'text-anchor="middle"')}
    ${R(166, 392, 66, 48, 'pl-unit pl-upsb')}${T(199, 421, 'UPS-B', 'pl-tag', 'text-anchor="middle"')}
    ${R(262, 392, 48, 48, 'pl-unit pl-pdua')}${T(286, 421, 'PDU-A', 'pl-tag', 'text-anchor="middle"')}
    ${R(318, 392, 48, 48, 'pl-unit pl-pdub')}${T(342, 421, 'PDU-B', 'pl-tag', 'text-anchor="middle"')}
    <path class="pl-desk" d="M408 376q52-26 104 0M408 424q52-26 104 0"/>
    <path class="pl-thin" d="M560 464v-14M600 464v-14M640 464v-14M680 464v-14"/>
    ${R(556, 334, 66, 34, 'pl-unit pl-stores')}${T(589, 356, 'STORES', 'pl-tag', 'text-anchor="middle"')}
    ${T(76, 88, 'HALL 01', 'pl-room')}${T(396, 88, 'HALL 02', 'pl-room')}
    ${T(392, 305, 'CORRIDOR', 'pl-room pl-room-sm')}
    ${T(76, 454, 'ELECTRICAL', 'pl-room pl-room-sm')}${T(396, 454, 'CONTROL ROOM', 'pl-room pl-room-sm')}${T(556, 454, 'LOADING DOCK', 'pl-room pl-room-sm')}
    <g class="pl-future">${R(724, 64, 220, 220, 'pl-future-wall')}<path class="pl-future-wall" d="M700 284H724M700 316H724V284"/>${T(740, 90, 'HALL 03', 'pl-room')}${T(740, 108, 'PROPOSED · CONCEPT ONLY')}</g>
    <g class="pl-north" transform="translate(944 590)"><circle r="20"/><path d="M0 -15L7 9 0 4-7 9z"/>${T(0, -26, 'N', 'pl-tag', 'text-anchor="middle"')}</g>
    <g class="pl-scale" transform="translate(744 576)"><path d="M0 8h120M0 2v12M40 4v8M80 4v8M120 2v12"/>${R(0, 6, 40, 4, 'pl-scale-fill')}${R(80, 6, 40, 4, 'pl-scale-fill')}${T(0, 32, 'SCALE: NOT TO SCALE')}</g>
    ${T(60, 586, 'NORTH CAMPUS / DC-01 — FLOOR PLAN', 'pl-title')}${T(60, 606, 'ILLUSTRATIVE FACILITY · FICTIONAL RECORDS')}
  </g>`;
}

const routes = `<g class="pl-routes"><path class="pl-route pl-route-b" d="M199 392V306H540V284"/></g>`;

function moments() {
  const stops = [[159, 346], [199, 392], [615, 261], [220, 160], [834, 174]];
  const recs = [['DAY 01', 'Accepted into service'], ['MONTH 03', 'Maintenance completed'], ['MONTH 08', 'Incident reviewed'], ['YEAR 02', 'Facility management transferred'], ['YEAR 04', 'Expansion proposed']];
  return `
  <g class="pl-m pl-m0">
    <g class="pl-pending">${racks(60, 'pl-await')}</g>
    ${callout({ slot: 'b1', title: 'Electrical tests ✓', detail: 'ACCEPTANCE EVIDENCE ATTACHED', cls: 'is-ok', from: [159, 358] })}
    <g class="pl-only-pre">${cloud(578, 240, 74, 42)}
      ${callout({ slot: 'r1', title: 'Cooling acceptance test', detail: '4 CHECKS AWAITING A WITNESS', cls: 'is-warn', from: [642, 262] })}
      ${person(150, 142, 'crew')}${person(196, 198, 'crew')}${person(246, 142, 'crew')}
      ${callout({ slot: 'top', title: 'Racks awaiting acceptance · 3 crew', from: [196, 64] })}
      <g class="pl-temp"><path d="M430 142h40v12h-40zM520 198h40v12h-40z"/></g>${T(478, 152, 'TEMPORARY TEST EQUIPMENT', 'pl-tag pl-temp-tag')}</g>
    <g class="pl-only-post">${callout({ slot: 'r1', title: 'Witness record accepted ✓', detail: 'COOLING ONLINE', cls: 'is-ok', from: [642, 262] })}
      ${callout({ slot: 'top', title: 'Tests accepted · first racks live', cls: 'is-ok', from: [196, 64] })}</g>
  </g>
  <g class="pl-m pl-m1">
    <g class="pl-work-ups">${R(166, 392, 66, 48, 'pl-hot')}${person(247, 416, 'tech')}
      ${callout({ slot: 'b1', title: 'WO-041 · Inspect UPS-B', detail: 'MOP-024 REV C · TEST INSTRUMENT', from: [199, 440] })}
      <g class="pl-work-open">${callout({ slot: 'b2', title: 'Work in progress', detail: 'TECHNICIAN ON SITE', cls: 'is-warn' })}</g>
      <g class="pl-work-done">${callout({ slot: 'b2', title: 'Readings & sign-off captured ✓', detail: 'RECORD STAYS WITH UPS-B', cls: 'is-ok' })}</g></g>
    <g class="pl-work-cooling">${R(588, 250, 54, 22, 'pl-hot')}${person(668, 261, 'tech')}
      ${callout({ slot: 'r1', title: 'WO-042 · Cooling plant', detail: 'MOP-031 REV B · FILTER KIT', from: [668, 271] })}
      <g class="pl-work-open">${callout({ slot: 'r2', title: 'Work in progress', detail: 'COOLING SPECIALIST ON SITE', cls: 'is-warn' })}</g>
      <g class="pl-work-done">${callout({ slot: 'r2', title: 'Service recorded ✓', detail: 'FILTER REPLACED · SIGN-OFF', cls: 'is-ok' })}</g></g>
  </g>
  <g class="pl-m pl-m2">
    <g class="pl-fault">${R(381, 65, 318, 218, 'pl-heat')}${cloud(578, 240, 74, 42)}
      ${alarm(470, 140)}${alarm(560, 140)}${alarm(650, 140)}${alarm(470, 196)}${alarm(560, 196)}${alarm(650, 196)}${alarm(520, 246)}
      ${person(470, 300, 'resp')}${person(498, 300, 'resp')}
      ${callout({ slot: 'r1', title: 'Cooling fan stopped', detail: '7 ALARMS → 1 ISSUE · HALL 02', cls: 'is-warn', from: [642, 262] })}
      ${callout({ slot: 'top2', title: 'Heat building · supply 31.2 °C', cls: 'is-warn', from: [540, 64] })}
      ${callout({ slot: 'r2', title: '2 responders dispatched', detail: 'EOP-003 · RESPONSE REFERENCE', from: [512, 300] })}</g>
    <g class="pl-recovered">${callout({ slot: 'r1', title: 'Fans restarted ✓', detail: 'RECOVERY VERIFIED · 22.6 °C', cls: 'is-ok', from: [642, 262] })}</g>
  </g>
  <g class="pl-m pl-m3">
    <g class="pl-out">${person(574, 404, 'out')}${person(602, 404, 'out')}${person(630, 404, 'out')}${T(566, 434, 'OUTGOING')}</g>
    <g class="pl-in">${person(426, 404, 'in')}${person(454, 404, 'in')}${person(482, 404, 'in')}${T(416, 434, 'INCOMING')}</g>
    <path class="pl-leader pl-dash pl-handover" d="M560 404H498"/>
    ${callout({ slot: 'r1', title: '248 site records retained', detail: 'THE HISTORY STAYS WITH THE SITE', cls: 'pl-records' })}
    <g class="pl-view-people">${callout({ slot: 'top', title: 'Site induction & handover · 2 open', from: [196, 64] })}</g>
    <g class="pl-view-vendors">${R(596, 482, 50, 24, 'pl-van')}${T(621, 499, 'VAN', 'pl-tag', 'text-anchor="middle"')}${callout({ slot: 'r2', title: 'Approved service partner', detail: '1 ESCALATION HANDOVER', from: [646, 494] })}</g>
    <g class="pl-view-parts">${R(556, 334, 66, 34, 'pl-hot')}${callout({ slot: 'r2', title: 'Critical spares inventory', detail: '1 STOCK VERIFICATION', from: [622, 351] })}</g>
    <g class="pl-handed">${callout({ slot: 'r2', title: 'Incoming team on duty ✓', detail: 'RESPONSIBILITIES TRANSFERRED', cls: 'is-ok', from: [482, 404] })}</g>
  </g>
  <g class="pl-m pl-m4">
    ${R(381, 65, 318, 218, 'pl-customer')}${T(396, 108, 'CUSTOMER A', 'pl-room pl-room-sm')}
    ${callout({ slot: 'r1', title: 'Customer A demand', detail: '<tspan class="pl-demand">800</tspan> kW OF 1,000 kW CONTRACT', from: [660, 230] })}
    <g class="pl-fitout">${R(725, 65, 218, 218, 'pl-hatch')}${callout({ slot: 'r2', title: 'Hall 03 · fit-out (concept)', detail: 'EXISTING HALLS REMAIN LIVE', cls: 'is-warn', from: [834, 284] })}</g>
  </g>
  <g class="pl-m pl-m5">
    <path class="pl-trail" d="M${stops.map(([x, y]) => `${x} ${y}`).join(' L')}"/>
    ${stops.map(([x, y], i) => `<g class="pl-stop" data-stop="${i}" transform="translate(${x} ${y})"><circle r="13"/><text class="pl-stop-num" y="4.5" text-anchor="middle">${i + 1}</text></g>`).join('')}
    ${recs.map(([w, t], i) => `<g class="pl-rec" data-rec="${i}">${callout({ slot: 'b1', title: `${i + 1} · ${t}`, detail: w, w: 340 })}</g>`).join('')}
  </g>`;
}

export function plan({ id = 'plan' } = {}) {
  return `<svg class="plan" viewBox="0 0 1000 640" role="img" aria-labelledby="${id}-t ${id}-d" focusable="false">
  <title id="${id}-t">North Campus / DC-01, illustrative floor plan</title>
  <desc id="${id}-d">Two data halls side by side, Hall 01 and Hall 02, each with three double rows of racks and a cooling unit. Below them a corridor, then the electrical room with the main switchgear, UPS-A, UPS-B, PDU-A and PDU-B, the control room, and the loading dock with stores. A proposed Hall 03 is drawn dashed to the east. The annotations change with the selected lifecycle moment and are described in the panel beside the plan.</desc>
  <defs>
    <pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V8" class="pl-hatch-line"/></pattern>
    <pattern id="${id}-heat" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V7" class="pl-heat-line"/></pattern>
  </defs>
  ${base()}
  ${routes}
  ${moments()}
</svg>`;
}
