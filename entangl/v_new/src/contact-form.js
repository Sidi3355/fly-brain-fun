(() => {
  'use strict';

  // Preview build: deliberately disconnected. Nothing is sent; the original's own
  // "not ready to deliver" state is shown with its email fallback instead.
  const formUrl = ['entangl.com', 'www.entangl.com'].includes(location.hostname)
    ? 'https://entangl.com/'
    : 'https://entangl-living-facility-customer-first.entangl-0263.chatgpt.site/';
  const pending = new WeakSet();
  const clean = (value, max = 1800) => String(value || '').trim().slice(0, max);

  function showDeliveryError(error, message, payload) {
    const email = document.createElement('a');
    const details = Object.entries(payload)
      .filter(([key, value]) => !key.startsWith('_') && value)
      .map(([key, value]) => `${key}: ${value}`).join('\n');
    email.href = `mailto:shapol@entangl.ai?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(details)}`;
    email.textContent = 'Email your request to Shapol';
    error.replaceChildren(document.createTextNode(`${message} `), email,
      document.createTextNode(' using your email app.'));
    error.hidden = false;
    error.focus({ preventScroll: true });
  }

  // Recognize only the approved airport campaign. Never forward arbitrary
  // query strings, personal URL data, or duplicate campaign parameters.
  function airportCampaign() {
    if (!/^\/demo\/?$/.test(location.pathname)) return null;
    const params = new URLSearchParams(location.search);
    const expected = {
      utm_source: 'iad',
      utm_medium: 'airport_display',
      utm_campaign: 'ptcdc_2026',
      utm_content: 'arrivals_a',
    };
    if (!Object.entries(expected).every(([key, value]) =>
      params.getAll(key).length === 1 && params.get(key) === value)) return null;
    return { Campaign: 'ptcdc_2026', Source: 'iad', Medium: 'airport_display', Creative: 'arrivals_a' };
  }

  const campaign = airportCampaign();
  const demoForm = document.querySelector('#demo-form');
  if (campaign && demoForm) {
    const note = document.createElement('p');
    note.className = 'contact-campaign';
    const eventIsOver = Date.now() >= Date.parse('2026-09-18T04:00:00Z');
    note.textContent = eventIsOver
      ? 'Saw us at Dulles? Request a 15-minute conversation with Entangl. Tell us the workflow you want to improve and when you are available.'
      : "At PTC'DC? Request a 15-minute conversation with Entangl. Tell us the workflow you want to improve and when you are available.";
    demoForm.prepend(note);
  }

  function payloadFor(form, options = {}) {
    const data = new FormData(form);
    const name = clean(data.get('name'), 100);
    const email = clean(data.get('email'), 254);
    const company = clean(data.get('company'), 150);
    const request = clean(options.requestType || 'Site demo', 80);
    return {
      name,
      email,
      company,
      'Request type': request,
      Workflow: clean(options.workflow || data.get('workflow'), 150) || 'To discuss',
      Message: clean(data.get('context')) || 'Please help us identify a useful first conversation.',
      Role: clean(data.get('role'), 100),
      'Number of sites': clean(data.get('sites'), 6),
      'Current systems': clean(data.get('systems'), 240),
      Priorities: data.getAll('interest').map(value => clean(value, 100)).join(', '),
      'Example explored': clean(options.example, 160),
      'Suggested session': clean(options.session, 300),
      'Submitted from': location.origin + location.pathname,
      ...(campaign || {}),
      _subject: `${campaign ? '[PTC-IAD] ' : ''}Entangl ${request.toLowerCase()} — ${company}`.replace(/[\r\n]/g, ' '),
      _replyto: email,
      _template: 'table',
      _honey: clean(data.get('_honey'), 100),
      _url: formUrl,
    };
  }

  async function submit(form, options = {}) {
    if (pending.has(form) || !form.reportValidity()) return null;
    const error = form.querySelector('[data-contact-error]');
    const payload = payloadFor(form, options);
    error.hidden = true;
    error.textContent = '';
    if (payload._honey) return null;
    // A filled trap stops here; omit the untouched field from JSON submissions.
    delete payload._honey;
    if (!payload.name || !payload.company || !payload.email) {
      error.textContent = 'Please enter your name, work email, and company.';
      error.hidden = false;
      error.focus();
      return null;
    }

    showDeliveryError(error, 'This form isn’t ready to deliver requests. Your details are still here.', payload);
    return null;
  }

  window.EntanglContact = { submit };
})();
