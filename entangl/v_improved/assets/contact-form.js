(() => {
  'use strict';

  const endpoint = 'https://formsubmit.co/ajax/shapol@entangl.ai';
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
    const button = form.querySelector('button[type="submit"]');
    const buttonContent = button.innerHTML;
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

    pending.add(form);
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    button.textContent = 'Sending…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: controller.signal,
      });
      const result = await response.json();
      // The service can accept the request while still requiring the recipient
      // to activate delivery for this domain. That is not a sent enquiry.
      const message = typeof result?.message === 'string' ? result.message : '';
      const activationRequired = /activat|confirm.{0,30}email|verify.{0,30}email/i.test(message);
      if (activationRequired) {
        const failure = new Error('Contact delivery requires activation');
        failure.name = 'ActivationRequiredError';
        throw failure;
      }
      if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
        throw new Error('Submission not accepted');
      }
      return { email: payload.email };
    } catch (failure) {
      console.warn('Contact form delivery failed:', failure.message);
      const message = failure.name === 'ActivationRequiredError'
        ? 'This form isn’t ready to deliver requests. Your details are still here.'
        : 'We couldn’t confirm delivery. Your details are still here. You can try again in a moment or contact us directly.';
      showDeliveryError(error, message, payload);
      return null;
    } finally {
      clearTimeout(timeout);
      pending.delete(form);
      form.removeAttribute('aria-busy');
      button.disabled = false;
      button.innerHTML = buttonContent;
    }
  }

  window.EntanglContact = { submit };
})();
