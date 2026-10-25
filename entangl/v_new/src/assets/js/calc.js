/* R-404 · Calculation sheets. Each keeps its working visible; none is added to another. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const read = id => { const i = document.getElementById('pz-' + id); if (!i || i.value === '' || !i.validity.valid) return null; const v = Number(i.value); return Number.isFinite(v) ? v : null; };
  const out = (c, k, t) => { const el = c.querySelector(`[data-o="${k}"]`); if (el) el.textContent = t; };
  const sheets = {
    'calc-value': c => {
      const v = ['v-count', 'v-hourly', 'v-current', 'v-expected', 'v-fees', 'v-setup', 'v-impl'].map(read);
      if (v.some(x => x === null)) { ['value', 'net', 'hours'].forEach(k => out(c, k, '—')); out(c, 'status', 'Enter every input, including zero for costs that do not apply, to calculate the estimate.'); c.classList.remove('is-negative'); return; }
      const [count, hourly, cur, exp, fees, setup, impl] = v, hours = 12 * count * (cur - exp), value = hours * hourly, net = value - fees - setup - impl * hourly;
      out(c, 'value', money(value)); out(c, 'net', money(net)); out(c, 'hours', num(hours));
      c.classList.toggle('is-negative', net < 0);
      out(c, 'status', net < 0 ? 'These assumptions produce a negative first-year estimate. Released time is capacity value, not automatically cash saved.' : 'Estimated value of released time. This is capacity to use elsewhere, not automatically a cash saving.');
    },
    'calc-exposure': c => { const m = read('x-min') ?? 0, r = read('x-rate') ?? 0; out(c, 'min', num(m)); out(c, 'rate', money(r)); out(c, 'exp', money(m * r)); },
    'calc-capacity': c => { const s = read('k-sites') ?? 0, p = read('k-proc') ?? 0, cu = read('k-cur') ?? 0, t = read('k-tgt') ?? 0, d = cu - t; out(c, 'sites', num(s)); out(c, 'proc', num(p)); out(c, 'diff', num(d)); out(c, 'rec', num(s * p * d)); out(c, 'cur', num(s * p * cu)); out(c, 'tgt', num(s * p * t)); },
    'calc-premium': c => { const pr = read('p-prem') ?? 0, pc = read('p-pct') ?? 0; out(c, 'prem', money(pr)); out(c, 'pct', num(pc)); out(c, 'red', money(pr * pc / 100)); out(c, 'scen', money(pr * (1 - pc / 100))); },
  };
  for (const [id, fn] of Object.entries(sheets)) {
    const c = document.getElementById(id); if (!c) continue;
    const defaults = [...c.querySelectorAll('input')].map(i => i.value);
    c.addEventListener('input', () => fn(c));
    c.addEventListener('click', e => {
      const b = e.target.closest('.step');
      if (b) { const i = document.getElementById(b.dataset.for), st = +i.step || 1; i.value = Math.min(+i.max, Math.max(+i.min, (+i.value || 0) + st * +b.dataset.step)); fn(c); }
      if (e.target.closest('[data-calc-reset]')) { c.querySelectorAll('input').forEach((i, k) => { i.value = defaults[k]; }); fn(c); window.entangl?.announce('Calculation reset.'); }
    });
    fn(c);
  }
})();
