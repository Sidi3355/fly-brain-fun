(() => {
  'use strict';
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"></use></svg>`;
  /* Six independent, illustrative problem explorations. No performance claims. */
  const pressure = {asset:'b',traced:false,sites:8,procedures:12,hours:4,grouped:false,reviewWait:180,fieldWait:240,history:2,audience:'auditor',load:465};
  const pressureCopy = {
    uptime:{nav:'Maintenance risk',title:'One change. What else does it touch?',pain:'The procedure names an asset. Your reviewer needs to see what depends on it.',help:'Connect procedure reviews to site drawings and equipment records, with unknowns visible.'},
    scale:{nav:'Stretched teams',title:'More sites. The same few experts.',pain:'See how repeated procedure work grows across a portfolio. Adjust the example to your operation.',help:'Generate and review site-specific procedures, and bring the relevant knowledge into field work.'},
    response:{nav:'Signal overload',title:'The readings are here. The response isn’t.',pain:'Three readings describe a situation. Someone still needs the context and responsibility to act.',help:'Connect telemetry to an issue, supporting records, and a response your operator can review.'},
    efficiency:{nav:'Work waiting',title:'The job takes 90 minutes. Why does it take all day?',pain:'Waiting between people can occupy more of the day than the work itself. Try your own handoff delays.',help:'Keep the issue, owner, approval state, and returned field evidence in one shared record.'},
    visibility:{nav:'Evidence chasing',title:'“Who approved this—and what happened next?”',pain:'Move through one event. See the evidence an auditor needs and the update a customer can see.',help:'Keep the chronology attached to the work, with relevant views for customers and auditors.'},
    growth:{nav:'Capacity pressure',title:'Your customer is growing. Does the account team know?',pain:'Move the demand level to see when a capacity conversation needs attention.',help:'Connect measured demand to contracted load so operations and the account owner can review the opportunity.'}
  };
  const pressureSource = {
    outage:'https://intelligence.uptimeinstitute.com/resource/annual-outage-analysis-2026',
    staffing:'https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf#page=25'
  };
  function pressureWorkload(sites, procedures, hours) {
    const reviews=sites*procedures, total=reviews*hours;
    return {reviews,hours:total,days:total/8};
  }
  function pressureDelays(review, field) {
    const waiting=review+field,total=90+waiting;
    return {waiting,total,percent:Math.round(waiting/total*100)};
  }
  function pressureCapacity(load) {
    return {load,percent:load/5,headroom:500-load,level:load>500?'over':load>=450?'near':'room'};
  }
  function pressureNum(n) {return Number(n).toLocaleString('en-US',{maximumFractionDigits:1});}
  function pressureTime(m) {const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h ${r}m`:`${h}h`):`${r}m`;}
  function pressureRange(key,label,min,max,step,value,unit) {
    return `<div class="pressure-control"><div><label for="pressure-${key}">${label}</label><span><input type="number" id="pressure-value-${key}" aria-label="${label}, ${unit}" min="${min}" max="${max}" step="${step}" value="${value}" data-pressure-value="${key}"><small>${unit}</small></span></div><input id="pressure-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-pressure-input="${key}"><div class="pressure-range-limits"><span>${min} ${unit}</span><span>${max} ${unit}</span></div></div>`;
  }
  function pressureCitation(kind) {
    return kind==='outage'?`<aside class="pressure-research"><span class="pressure-meta">INDUSTRY RESEARCH</span><strong>57<span>%</span></strong><p>of respondents reported their most recent major outage cost more than <b>$100,000.</b></p><details><summary>Source &amp; context ${icon('diagonal')}</summary><p>Uptime Institute, <em>Annual outage analysis 2026</em>, drawing on its 2025 annual survey. Self-reported outage costs; this is industry context, not an Entangl outcome.</p><a href="${pressureSource.outage}" target="_blank" rel="noopener noreferrer">Read the published finding ${icon('diagonal')}</a></details></aside>`:`<aside class="pressure-research"><span class="pressure-meta">INDUSTRY RESEARCH</span><strong>46<span>%</span></strong><p>of surveyed operators reported difficulty finding <b>qualified candidates.</b></p><details><summary>Source &amp; context ${icon('diagonal')}</summary><p>Uptime Institute, <em>Global Data Center Survey 2025</em>, Figure 15, page 24; 650 respondents to this question. This is a hiring indicator, not a measure of Entangl productivity.</p><a href="${pressureSource.staffing}" target="_blank" rel="noopener noreferrer">Read the survey ${icon('diagonal')}</a></details></aside>`;
  }
  function pressureUptime() {
    const names={a:'UPS-A',b:'UPS-B',cooling:'CRAH-02'},hall=pressure.asset==='a'?'Hall 01':'Hall 02';
    return `<div class="pressure-uptime-layout"><div class="pressure-network" data-asset="${pressure.asset}" data-traced="${pressure.traced}"><div class="pressure-visual-top"><span class="pressure-meta">SIMPLIFIED CONNECTION MAP</span><span class="pressure-tag">Illustrative</span></div><div class="pressure-equipment" role="group" aria-label="Choose equipment to trace">${Object.entries(names).map(([key,name])=>`<button data-pressure-asset="${key}" aria-pressed="${key===pressure.asset}">${icon(key==='cooling'?'wave':'grid')}${name}</button>`).join('')}</div>
      <svg class="pressure-map" viewBox="0 0 640 320" role="img" aria-labelledby="pressure-map-title"><title id="pressure-map-title">Simplified example: UPS-A connects to Hall 01 through PDU-A. UPS-B connects to Hall 02 through PDU-B. CRAH-02 serves Hall 02. Current operating states are not verified.</title><g class="pressure-map-grid" aria-hidden="true"><path d="M0 70H640M0 160H640M0 250H640M145 0V320M320 0V320M510 0V320"/></g>
      <g class="pressure-route route-a"><path class="pressure-wire" d="M157 71H260M374 71H485"/><rect x="22" y="42" width="135" height="58" rx="5"/><text x="90" y="77">UPS-A</text><rect x="260" y="42" width="114" height="58" rx="5"/><text x="317" y="77">PDU-A</text><rect x="485" y="42" width="133" height="58" rx="5"/><text x="551" y="77">Hall 01</text></g>
      <g class="pressure-route route-b"><path class="pressure-wire" d="M157 164H260M374 164H485"/><rect x="22" y="135" width="135" height="58" rx="5"/><text x="90" y="170">UPS-B</text><rect x="260" y="135" width="114" height="58" rx="5"/><text x="317" y="170">PDU-B</text><rect x="485" y="135" width="133" height="58" rx="5"/><text x="551" y="170">Hall 02</text></g>
      <g class="pressure-route route-cooling"><path class="pressure-wire" d="M157 256H436Q453 256 453 239V214Q453 191 485 185"/><rect x="22" y="227" width="135" height="58" rx="5"/><text x="90" y="262">CRAH-02</text><text class="pressure-map-note" x="302" y="281">Cooling connection</text></g></svg>
      <div class="pressure-map-result"><span class="pressure-result-number">${pressure.traced?'1':'?'}</span><span><strong>${pressure.traced?hall+' is connected.':'What depends on '+names[pressure.asset]+'?'}</strong><small>${pressure.traced?'Current operating state still needs verification.':'Trace the documented connection to find out.'}</small></span></div><button class="pressure-primary" data-pressure-action="trace" aria-pressed="${pressure.traced}">${pressure.traced?'Hide the traced connection':'Trace the connection'} ${icon('link')}</button></div><div class="pressure-side">${pressureCitation('outage')}<p class="pressure-caution">Connectivity is one part of a review. Confirm current states, redundancy, and approvals before real work.</p></div></div>`;
  }
  function pressureSiteTiles() {
    return Array.from({length:pressure.sites},(_,i)=>`<div class="pressure-site-tile"><span>Site ${String(i+1).padStart(2,'0')}</span><div style="--workload:${pressure.procedures/40*100}%"><i></i></div><small>${pressure.procedures} procedures</small></div>`).join('');
  }
  function pressureScale() {
    const d=pressureWorkload(pressure.sites,pressure.procedures,pressure.hours);
    return `<div class="pressure-scale-layout"><div><div class="pressure-workload"><span class="pressure-meta">MONTHLY PROCEDURE WORK · YOUR INPUTS</span><div class="pressure-large-number"><strong id="pressure-hours-total">${pressureNum(d.hours)}</strong><span>engineering<br>hours / month</span></div><p class="pressure-equation" id="pressure-equation">${pressure.sites} sites × ${pressure.procedures} procedures × ${pressure.hours} hours</p><div class="pressure-site-grid" id="pressure-sites-grid" aria-label="Workload by site">${pressureSiteTiles()}</div><div class="pressure-workload-bottom"><span><b id="pressure-reviews">${d.reviews}</b> procedures / month</span><span><b id="pressure-days">${pressureNum(d.days)}</b> eight-hour workdays</span></div></div><p class="pressure-footnote">Adjustable workload estimate. Preparation and review time per procedure is your assumption; no savings are predicted.</p></div><div class="pressure-inputs">${pressureRange('sites','Sites in your portfolio',1,24,1,pressure.sites,'sites')}${pressureRange('procedures','Procedures per site / month',1,40,1,pressure.procedures,'procedures')}${pressureRange('hours','Preparation + review per procedure',0.5,8,0.5,pressure.hours,'hours')}${pressureCitation('staffing')}</div></div>`;
  }
  function pressureResponse() {
    const readings=[['H02-INLET-02','Inlet temperature','29.4','°C','Above sample threshold'],['CRAH02-RETURN','Return temperature','33.1','°C','Related reading'],['CRAH02-FAN','Fan speed','82','%','Related reading']];
    return `<div class="pressure-response" data-grouped="${pressure.grouped}"><div class="pressure-visual-top"><span class="pressure-meta">HALL 02 · FICTIONAL SIGNALS</span><span class="pressure-tag">${pressure.grouped?'Context attached':'Awaiting context'}</span></div><div class="pressure-alerts">${readings.map((r,i)=>`<div class="pressure-alert"><span class="pressure-alert-icon">${icon(i===0?'wave':i===1?'grid':'bell')}</span><span class="pressure-meta">${r[0]}</span><strong>${r[2]}<small>${r[3]}</small></strong><p>${r[1]}</p><span class="pressure-alert-state">${r[4]}</span></div>`).join('')}</div><div class="pressure-converge" aria-hidden="true"><svg viewBox="0 0 600 65"><path d="M100 0V23Q100 34 112 34H288Q300 34 300 46V65M300 0V65M500 0V23Q500 34 488 34H312Q300 34 300 46"/></svg></div><div class="pressure-issue ${pressure.grouped?'has-context':''}"><span class="pressure-issue-symbol">${icon(pressure.grouped?'link':'wave')}</span><div><span class="pressure-meta">${pressure.grouped?'ISS-014 · OPERATOR REVIEW':'READINGS RECEIVED · NO RESPONSE ORGANIZED'}</span><h4>${pressure.grouped?'One issue. Three readings attached.':'Who is picking this up?'}</h4><p>${pressure.grouped?'CRAH-02 · source records attached · field inspection awaiting approval':'The numbers arrived. The asset records, review, and field task still need to come together.'}</p></div><span class="pressure-issue-count">${pressure.grouped?'1':'?'}</span></div><div class="pressure-response-bottom"><button class="pressure-primary" data-pressure-action="group" aria-pressed="${pressure.grouped}">${pressure.grouped?'Separate the signals again':'Bring the context together'} ${icon('link')}</button><span>${pressure.grouped?'Cause unconfirmed. Your operator decides the next step.':'Same sample signals. Watch the context change.'}</span></div><p class="pressure-footnote">Scripted example of readings attached to an issue. It does not diagnose a fault or control equipment.</p></div>`;
  }
  function pressureTimelineBars() {
    const d=pressureDelays(pressure.reviewWait,pressure.fieldWait);
    return [['Prepare',45,'work'],['Wait for review',pressure.reviewWait,'wait'],['Review',15,'work'],['Wait for field',pressure.fieldWait,'wait'],['Record',30,'work']].filter(x=>x[1]>0).map(([name,minutes,kind])=>`<span class="pressure-time-segment ${kind}" style="width:${minutes/d.total*100}%" title="${name}: ${pressureTime(minutes)}"><span>${minutes/d.total>=.15?pressureTime(minutes):''}</span><span class="sr-only">${name}, ${pressureTime(minutes)}</span></span>`).join('');
  }
  function pressureEfficiency() {
    const d=pressureDelays(pressure.reviewWait,pressure.fieldWait);
    return `<div class="pressure-delay-layout"><div class="pressure-day"><div class="pressure-visual-top"><span class="pressure-meta">ONE JOB · ADJUSTABLE EXAMPLE</span><span class="pressure-tag" id="pressure-total">${pressureTime(d.total)} elapsed</span></div><div class="pressure-large-number"><strong id="pressure-wait">${pressureTime(d.waiting)}</strong><span>waiting between<br>people</span></div><div class="pressure-day-track" id="pressure-day-track" role="img" aria-label="${d.waiting} minutes waiting and 90 minutes working">${pressureTimelineBars()}</div><div class="pressure-time-legend"><span><i class="work"></i>90 minutes of work</span><span><i class="wait"></i><b id="pressure-wait-percent">${d.percent}%</b> of elapsed time waiting</span></div><div class="pressure-handoffs"><div><span>Preparation</span><strong>45 min</strong></div><div class="is-wait"><span>Review queue</span><strong id="pressure-review-label">${pressureTime(pressure.reviewWait)}</strong></div><div><span>Review</span><strong>15 min</strong></div><div class="is-wait"><span>Field handoff</span><strong id="pressure-field-label">${pressureTime(pressure.fieldWait)}</strong></div><div><span>Record</span><strong>30 min</strong></div></div><p class="pressure-footnote">Sequential example; work time is fixed at 90 minutes. Adjust the two wait periods to see their share of elapsed time.</p></div><div class="pressure-inputs"><h4>Where does your work wait?</h4>${pressureRange('reviewWait','Waiting for a reviewer',0,480,15,pressure.reviewWait,'min')}${pressureRange('fieldWait','Waiting for a field handoff',0,480,15,pressure.fieldWait,'min')}<p class="pressure-caution">Use the picture to find a handoff worth improving. These timings are assumptions, not measured Entangl results.</p></div></div>`;
  }
  const pressureEvents=[
    {time:'09:41',title:'Issue created',owner:'Telemetry workflow',record:'ISS-014',detail:'Hall 02 inlet temperature crossed the sample threshold.'},
    {time:'09:43',title:'Response reviewed',owner:'Demo operator',record:'Review R-014',detail:'The operator reviewed the linked signal and asset context. The cause remained unconfirmed.'},
    {time:'09:45',title:'Field task approved',owner:'Demo operator',record:'Approval A-014',detail:'A non-invasive inspection was approved and assigned to the fictional field engineer.'},
    {time:'09:50',title:'Observations returned',owner:'Demo field engineer',record:'Task TSK-014',detail:'The field observations were attached to the issue for operator review.'},
    {time:'09:53',title:'Issue closed after review',owner:'Demo operator',record:'Closure C-014',detail:'The operator reviewed the returned record and closed the sample issue.'},
    {time:'09:55',title:'Customer update published',owner:'Demo operator',record:'Notice N-014',detail:'An approved closure update was made available in the customer view.'}
  ];
  function pressureEvidenceCard() {
    const event=pressureEvents[pressure.history];
    if(pressure.audience==='customer')return `<div class="pressure-record-heading"><span>${icon('lock')} CUSTOMER B · SUITE 02</span><span>Published information</span></div><div class="pressure-record-main"><span class="pressure-document-symbol">${icon('eye')}</span><h4>${pressure.history===5?'Your service update is available.':'No update published yet.'}</h4><p>${pressure.history===5?'The provider has closed this sample event after reviewing the returned field record.':'The internal work record exists. A customer notice becomes visible only after publication at 09:55 in this example.'}</p><div class="pressure-record-facts"><span>Latest notice<strong>${pressure.history===5?'N-014 · 09:55':'None published'}</strong></span><span>Scope<strong>Customer B only</strong></span></div></div>`;
    return `<div class="pressure-record-heading"><span>${icon('link')} ISS-014 · AUDIT HISTORY</span><span>${pressure.history+1} of 6 records available</span></div><div class="pressure-record-main"><span class="pressure-document-symbol">${icon(pressure.history===2?'shield':'file')}</span><div class="pressure-evidence-time">${event.time}</div><h4>${event.title}</h4><p>${event.detail}</p><div class="pressure-record-facts"><span>Recorded by<strong>${event.owner}</strong></span><span>Evidence reference<strong>${event.record}</strong></span></div></div>`;
  }
  function pressureVisibility() {
    return `<div class="pressure-evidence"><div class="pressure-evidence-controls"><div><span class="pressure-meta">ONE EVENT · TWO RESPONSIBILITIES</span><p>What can this person see at this moment?</p></div><div class="pressure-audience" role="group" aria-label="Choose an evidence audience"><button data-pressure-audience="auditor" aria-pressed="${pressure.audience==='auditor'}">${icon('file')}Auditor</button><button data-pressure-audience="customer" aria-pressed="${pressure.audience==='customer'}">${icon('eye')}Customer</button></div></div><div class="pressure-evidence-card" id="pressure-evidence-card">${pressureEvidenceCard()}</div><div class="pressure-history"><label for="pressure-history">Move through the event <output id="pressure-history-output">${pressureEvents[pressure.history].time} · ${pressureEvents[pressure.history].title}</output></label><input type="range" id="pressure-history" data-pressure-input="history" min="0" max="5" step="1" value="${pressure.history}" aria-valuetext="${pressureEvents[pressure.history].time}, ${pressureEvents[pressure.history].title}"><div class="pressure-history-marks">${pressureEvents.map((e,i)=>`<button data-pressure-history="${i}" aria-pressed="${i===pressure.history}"><span>${e.time}</span><small>${['Issue','Review','Approval','Field record','Closure','Publication'][i]}</small></button>`).join('')}</div></div><p class="pressure-footnote">Illustrative chronology and audience views. These sample records describe a fictional event; they are not live facility records.</p></div>`;
  }
  function pressureGrowthPath(load) {
    const points=[.62,.67,.64,.73,.76,.72,.83,.88,.9,1].map((f,i)=>[45+i*56,255-load*f/600*200]);
    return {line:points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),y:points[9][1].toFixed(1),area:points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')+' L549 255 L45 255Z'};
  }
  function pressureGrowthStatus(c) {return c.level==='over'?'Above the contracted limit':c.level==='near'?'A capacity conversation is worth starting':'Room below the contracted limit';}
  function pressureGrowth() {
    const c=pressureCapacity(pressure.load),plot=pressureGrowthPath(pressure.load);
    return `<div class="pressure-growth-layout"><div class="pressure-demand"><div class="pressure-visual-top"><span class="pressure-meta">CUSTOMER B · ILLUSTRATIVE DEMAND</span><span class="pressure-tag">500 kW contract</span></div><svg class="pressure-demand-chart" viewBox="0 0 630 300" role="img" aria-labelledby="pressure-demand-title"><title id="pressure-demand-title">Illustrative demand shape, with a selected peak of ${pressure.load} kilowatts and a contractual limit of 500 kilowatts. Not a forecast.</title><defs><linearGradient id="pressure-demand-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b5ce7d" stop-opacity=".5"/><stop offset="100%" stop-color="#b5ce7d" stop-opacity=".04"/></linearGradient></defs><g class="pressure-demand-grid"><path d="M45 255H584M45 188H584M45 122H584"/><text x="12" y="259">0</text><text x="7" y="192">200</text><text x="7" y="126">400</text><text x="45" y="286">30-day example</text><text x="505" y="286">Peak</text></g><path id="pressure-demand-area" d="${plot.area}" fill="url(#pressure-demand-fill)"/><path class="pressure-contract-line" d="M45 88.3H584"/><text class="pressure-contract-label" x="45" y="74">CONTRACTED LIMIT · 500 kW</text><path id="pressure-demand-line" d="${plot.line}"/><circle id="pressure-demand-end" cx="549" cy="${plot.y}" r="6"/></svg><div class="pressure-demand-presets" role="group" aria-label="Explore example demand levels"><button data-pressure-load="350" aria-pressed="${pressure.load===350}">350 kW<span>Room to plan</span></button><button data-pressure-load="465" aria-pressed="${pressure.load===465}">465 kW<span>Getting close</span></button><button data-pressure-load="525" aria-pressed="${pressure.load===525}">525 kW<span>Above the limit</span></button></div>${pressureRange('load','Highest measured demand in the period',250,550,5,pressure.load,'kW')}</div><aside class="pressure-capacity-reading" id="pressure-capacity-reading" data-level="${c.level}"><span class="pressure-meta">OF CONTRACTED LOAD</span><div class="pressure-large-number"><strong id="pressure-utilization">${pressureNum(c.percent)}</strong><span>%</span></div><h4 id="pressure-capacity-status">${pressureGrowthStatus(c)}</h4><p class="pressure-headroom"><strong id="pressure-headroom">${Math.abs(c.headroom)} kW</strong><span id="pressure-headroom-label">${c.headroom>=0?'below the contractual limit':'above the contractual limit'}</span></p><div class="pressure-account-note">${icon('capacity')}<p>Bring the demand pattern and the customer’s plans to the account owner.</p></div><p class="pressure-caution">Contractual headroom is not verified site capacity. Review power, cooling, and redundancy constraints before offering expansion.</p></aside></div>`;
  }
  const pressureSections = [
    {key:'uptime',number:'01',label:'Protect uptime',title:'Trace equipment dependencies.',copy:'Before a change, your team needs to know what depends on the equipment. Select an asset and follow its documented connection.',hint:'Select equipment, then trace the connection.',route:'/platform/site-model',action:'Explore your site model',status:'SITE CONTEXT',help:'Connect a procedure to the equipment and source drawings your reviewer needs.',render:pressureUptime},
    {key:'scale',number:'02',label:'Scale your team’s work',title:'Calculate workload as your portfolio grows.',copy:'Every new site adds procedure work. Change the inputs to see how much preparation and review time your portfolio requires.',hint:'Adjust the sites, procedures, and hours.',route:'/platform/procedures',action:'Explore procedure authoring',status:'PROCEDURES',help:'Bring site information into procedure preparation and review. Use your own workload to define a useful evaluation.',render:pressureScale},
    {key:'response',number:'03',label:'Make sense of signals',title:'Bring separate signals into one issue.',copy:'A reading alone does not organize a response. Connect three sample signals to the asset, evidence, and work that need attention.',hint:'Bring the readings together, then separate them.',route:'/platform/telemetry',action:'Explore telemetry',status:'EXPLORE THE SCOPE',help:'Explore how telemetry could connect a reading to an issue and an operator’s next decision.',render:pressureResponse},
    {key:'efficiency',number:'04',label:'Find time lost waiting',title:'Adjust delays and see where time goes.',copy:'The work takes 90 minutes in this example. See how waiting for a reviewer or a field handoff changes the whole day.',hint:'Move either delay slider to reshape the timeline.',route:'/platform/review',action:'Explore reviews & approvals',status:'REVIEWS & APPROVALS',help:'Keep the source evidence and outstanding decision alongside the procedure your reviewer needs to assess.',render:pressureEfficiency},
    {key:'visibility',number:'05',label:'Make the record clear',title:'Scrub through approvals and evidence.',copy:'Follow one event from the first signal to a published update. Switch audience to see which information is available at each moment.',hint:'Move through time. Switch between auditor and customer.',route:'/platform/visibility',action:'Explore shared visibility',status:'EXPLORE THE SCOPE',help:'Explore the evidence your customers and auditors need, within an agreed information boundary.',render:pressureVisibility},
    {key:'growth',number:'06',label:'Spot the capacity conversation',title:'Move demand toward a customer’s contract limit.',copy:'Your customer’s usage can become a commercial conversation. Move the measured demand to see how much contractual headroom remains.',hint:'Drag demand toward, or beyond, the 500 kW limit.',route:'/platform/portfolio',action:'Explore portfolio performance',status:'PLANNED WORKFLOW',help:'The portfolio direction connects operational records to decisions about the business. Define the capacity evidence your account team needs.',render:pressureGrowth}
  ];
  function renderPressureSection() {
    return `<section class="pressure-lab wrap" id="outcomes" aria-labelledby="pressures-title"><div class="pressure-heading"><div><span class="eyebrow">SIX PRESSURES. EXPLORE THE NUMBERS.</span><h2 id="pressures-title">Start with the pressure<br>you’re under.</h2></div><p>Protect uptime. Give your teams time back. Make growth visible. Choose a problem or explore all six.</p></div><nav class="pressure-index" aria-label="Six interactive operating problems">${pressureSections.map(s=>`<a href="#pressure-${s.key}"><span class="pressure-index-number">${s.number}</span><span><strong>${s.label}</strong><small>${s.title}</small></span>${icon('down')}</a>`).join('')}</nav><p class="pressure-context">Industry statistics include their sources. All facility records and adjustable calculations below are illustrative.</p><div class="pressure-sections">${pressureSections.map(s=>`<section class="pressure-chapter" id="pressure-${s.key}" aria-labelledby="pressure-heading-${s.key}"><header class="pressure-chapter-header"><span class="pressure-chapter-number" aria-hidden="true">${s.number}</span><div><span class="pressure-meta">${s.label.toUpperCase()}</span><h3 id="pressure-heading-${s.key}">${s.title}</h3><p>${s.copy}</p></div></header><p class="pressure-invitation">${icon(s.key==='uptime'?'link':s.key==='response'?'wave':s.key==='visibility'?'eye':'arrow')}<span>${s.hint}</span></p><div class="pressure-stage" data-pressure-stage="${s.key}">${s.render()}</div><div class="pressure-product-link"><div><span>ENTANGL · ${s.status}</span><p>${s.help}</p></div><a class="text-link" href="${s.route}">${s.action} ${icon('diagonal')}</a></div><a class="pressure-back" href="#outcomes">Back to all six ${icon('arrow')}</a></section>`).join('')}</div><p class="pressure-live sr-only" role="status" aria-live="polite" aria-atomic="true"></p></section>`;
  }
  // The static build and the browser use the same views and default numbers.
  if (typeof module === 'object' && module.exports) {
    module.exports = {renderPressureSection,pressureWorkload,pressureDelays,pressureCapacity,pressureGrowthPath,pressureEvents};
    return;
  }
  const root = document.getElementById('outcomes');
  if (!root) return;
  const $ = (selector,scope=root) => scope.querySelector(selector);
  const $$ = (selector,scope=root) => [...scope.querySelectorAll(selector)];
  const announce = message => {$('.pressure-live').textContent=message;};
  const sectionForInput = {sites:'scale',procedures:'scale',hours:'scale',reviewWait:'efficiency',fieldWait:'efficiency',history:'visibility',load:'growth'};
  // Demos patch their markup in place rather than rebuilding it, so the transitions declared in
  // pressure-lab.css (dimming routes, drawing wires, resizing tiles and bars) can actually play,
  // and only content that is genuinely new fades in.
  const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('reduce-motion');
  const arrive=node=>{if(node.nodeType===1&&!still())node.animate?.([{opacity:0},{opacity:1}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});return node;};
  function patch(current,fresh){
    for(let i=0;i<fresh.childNodes.length;i++){
      const next=fresh.childNodes[i],old=current.childNodes[i];
      if(!old){current.append(arrive(next.cloneNode(true)));continue;}
      if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(arrive(next.cloneNode(true)));continue;}
      if(next.nodeType===3){if(old.nodeValue!==next.nodeValue)old.nodeValue=next.nodeValue;continue;}
      if(next.nodeType!==1)continue;
      for(const a of [...old.attributes])if(!next.hasAttribute(a.name))old.removeAttribute(a.name);
      for(const a of [...next.attributes])if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
      if(/^(INPUT|SELECT|TEXTAREA)$/.test(old.nodeName)&&old!==document.activeElement&&old.value!==next.value)old.value=next.value;
      patch(old,next);
    }
    while(current.childNodes.length>fresh.childNodes.length)current.lastChild.remove();
  }
  function morph(el,html){const fresh=document.createElement('div');fresh.innerHTML=html;patch(el,fresh);}
  function renderDemo(key,focusSelector) {
    const section=pressureSections.find(s=>s.key===key);
    const stage=$(`[data-pressure-stage="${key}"]`);
    morph(stage,section.render());
    if(focusSelector)$(focusSelector,stage)?.focus({preventScroll:true});
  }
  function updatePressureNumbers(section) {
    if(section==='scale') {
      const d=pressureWorkload(pressure.sites,pressure.procedures,pressure.hours);
      $('#pressure-hours-total').textContent=pressureNum(d.hours);$('#pressure-reviews').textContent=d.reviews;$('#pressure-days').textContent=pressureNum(d.days);
      $('#pressure-equation').textContent=`${pressure.sites} sites × ${pressure.procedures} procedures × ${pressure.hours} hours`;
      morph($('#pressure-sites-grid'),pressureSiteTiles());
    }
    if(section==='efficiency') {
      const d=pressureDelays(pressure.reviewWait,pressure.fieldWait);
      $('#pressure-total').textContent=`${pressureTime(d.total)} elapsed`;$('#pressure-wait').textContent=pressureTime(d.waiting);$('#pressure-wait-percent').textContent=`${d.percent}%`;
      morph($('#pressure-day-track'),pressureTimelineBars());$('#pressure-day-track').setAttribute('aria-label',`${d.waiting} minutes waiting and 90 minutes working`);
      $('#pressure-review-label').textContent=pressureTime(pressure.reviewWait);$('#pressure-field-label').textContent=pressureTime(pressure.fieldWait);
    }
    if(section==='visibility') {
      const e=pressureEvents[pressure.history];morph($('#pressure-evidence-card'),pressureEvidenceCard());
      $('#pressure-history-output').textContent=`${e.time} · ${e.title}`;$('#pressure-history').setAttribute('aria-valuetext',`${e.time}, ${e.title}`);
      $$('[data-pressure-history]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.pressureHistory)===pressure.history)));
      $$('[data-pressure-audience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pressureAudience===pressure.audience)));
    }
    if(section==='growth') {
      const c=pressureCapacity(pressure.load),p=pressureGrowthPath(pressure.load);
      $('#pressure-demand-line').setAttribute('d',p.line);$('#pressure-demand-area').setAttribute('d',p.area);$('#pressure-demand-end').setAttribute('cy',p.y);
      $('#pressure-demand-title').textContent=`Illustrative demand shape, with a selected peak of ${pressure.load} kilowatts and a contractual limit of 500 kilowatts. Not a forecast.`;
      $('#pressure-capacity-reading').dataset.level=c.level;$('#pressure-utilization').textContent=pressureNum(c.percent);
      $('#pressure-capacity-status').textContent=pressureGrowthStatus(c);$('#pressure-headroom').textContent=`${Math.abs(c.headroom)} kW`;
      $('#pressure-headroom-label').textContent=c.headroom>=0?'below the contractual limit':'above the contractual limit';
      $$('[data-pressure-load]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.pressureLoad)===pressure.load)));
    }
  }
  function setPressureInput(input,commit=false) {
    const key=input.dataset.pressureInput||input.dataset.pressureValue;
    const bounds={sites:[1,24,1],procedures:[1,40,1],hours:[.5,8,.5],reviewWait:[0,480,15],fieldWait:[0,480,15],history:[0,5,1],load:[250,550,5]};
    if(!bounds[key])return;
    const [min,max,step]=bounds[key];let val=input.valueAsNumber;
    if(!Number.isFinite(val)){if(!commit)return;val=pressure[key];}
    if(!commit&&input.type==='number'&&!input.validity.valid)return;
    val=Math.max(min,Math.min(max,min+Math.round((val-min)/step)*step));pressure[key]=val;
    const range=$(`[data-pressure-input="${key}"]`),number=$(`[data-pressure-value="${key}"]`);
    if(range&&range!==input)range.value=String(val);if(number&&(number!==input||commit))number.value=String(val);
    if(commit)input.value=String(val);updatePressureNumbers(sectionForInput[key]);
    if(commit)announce(key==='history'?`${pressureEvents[val].time}. ${pressureEvents[val].title}.`:`${input.getAttribute('aria-label')||key}: ${val}. The example has updated.`);
  }
  root.addEventListener('click',e=>{
    const asset=e.target.closest('[data-pressure-asset]');
    if(asset){pressure.asset=asset.dataset.pressureAsset;pressure.traced=false;renderDemo('uptime',`[data-pressure-asset="${pressure.asset}"]`);return;}
    const action=e.target.closest('[data-pressure-action]');
    if(action){
      if(action.dataset.pressureAction==='trace'){
        pressure.traced=!pressure.traced;renderDemo('uptime','[data-pressure-action="trace"]');
        announce(pressure.traced?'The documented connection is highlighted. Current operating state remains unverified.':'Connection highlight hidden.');
      }
      if(action.dataset.pressureAction==='group'){
        pressure.grouped=!pressure.grouped;renderDemo('response','[data-pressure-action="group"]');
        announce(pressure.grouped?'Three sample readings are attached to one issue for operator review.':'The sample readings are separated.');
      }
      return;
    }
    const audience=e.target.closest('[data-pressure-audience]');
    if(audience){pressure.audience=audience.dataset.pressureAudience;updatePressureNumbers('visibility');announce(`${pressure.audience} view selected. ${$('#pressure-evidence-card h4').textContent}`);return;}
    const history=e.target.closest('[data-pressure-history]');
    if(history){pressure.history=Number(history.dataset.pressureHistory);$('#pressure-history').value=String(pressure.history);updatePressureNumbers('visibility');announce(pressureEvents[pressure.history].title);return;}
    const load=e.target.closest('[data-pressure-load]');
    if(load){pressure.load=Number(load.dataset.pressureLoad);$('#pressure-load').value=String(pressure.load);$('#pressure-value-load').value=String(pressure.load);updatePressureNumbers('growth');announce(`${pressure.load} kilowatts. ${pressureGrowthStatus(pressureCapacity(pressure.load))}.`);}
  });
  root.addEventListener('input',e=>{if(e.target.matches('[data-pressure-input],[data-pressure-value]'))setPressureInput(e.target);});
  root.addEventListener('change',e=>{if(e.target.matches('[data-pressure-input],[data-pressure-value]'))setPressureInput(e.target,true);});
})();
