/* Forms on this preview are deliberately disconnected: nothing is sent anywhere. Each form
   validates, then says so plainly and offers the same details as an email instead. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  document.querySelectorAll('[data-today]').forEach(el => { el.textContent = today; });

  // Prefill the demo request from the link that brought you here (?workflow=…&context=…&request=…).
  const params = new URLSearchParams(location.search);
  const demo = $('#demo-form');
  if (demo) {
    const wf = params.get('workflow'), ctx = params.get('context'), req = params.get('request');
    const sel = $('#f-workflow');
    if (wf && sel) {
      // A workflow the list doesn't name yet (Site model, Portfolio performance) is added rather than lost.
      const name = wf.trim().slice(0, 80);
      let opt = [...sel.options].find(o => o.textContent.trim().toLowerCase() === name.toLowerCase());
      if (!opt) { opt = new Option(name, name); sel.insertBefore(opt, [...sel.options].find(o => o.textContent.trim() === 'Something else') || null); }
      sel.value = opt.value || opt.textContent;
    }
    if (ctx) $('#f-context').value = ctx.slice(0, 1800);
    const re = $('[data-tx-re]');
    if (re) re.textContent = (req || wf || 'Site demo').slice(0, 80);
  }

  const clean = (v, max = 1800) => String(v || '').trim().slice(0, max);
  document.querySelectorAll('[data-preview-form]').forEach(form => {
    const result = $('[data-form-result]', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (clean(data.get('_honey'))) return;
      const kind = form.dataset.previewForm;
      const subject = kind === 'report' ? 'Annual outage report request (2025/2026)' : kind === 'session' ? 'Entangl site session request' : `Entangl site demo request — ${clean(data.get('company'), 150)}`;
      const lines = [['Name', data.get('name')], ['Email', data.get('email')], ['Company', data.get('company')], ['Phone', data.get('phone')], ['Workflow', data.get('workflow')], ['Request type', params.get('request')], ['Priorities', data.getAll('interest').join(', ')], ['Message', data.get('context')], ['Role', data.get('role')], ['Number of sites', data.get('sites')], ['Current systems', data.get('systems')]]
        .filter(([, v]) => clean(v)).map(([k, v]) => `${k}: ${clean(v)}`).join('\n');
      const mail = `mailto:shapol@entangl.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      result.innerHTML = `<p class="label">Not sent · preview copy</p><h3 class="h3">Nothing has left your browser.</h3><p>This preview of the new site isn’t connected to Entangl’s inbox yet, so your request was checked but not sent. Your details are still in the form.</p><p><a class="tlink" href="${mail}"><span>Email the same details to Entangl instead</span><svg class="i" aria-hidden="true"><use href="/assets/img/icons.svg#i-mail"></use></svg></a></p>`;
      result.hidden = false; result.focus();
      window.entangl?.announce('Preview only. Your request was not sent.');
    });
  });
})();
