(() => {
  'use strict';
  const form = document.getElementById('outage-report-form');
  if (!form) return;
  const name = form.elements.namedItem('name');
  const email = form.elements.namedItem('email');
  const phone = form.elements.namedItem('phone');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.report-form-status');
  let pending = false;

  function validatePhone() {
    const value = phone.value.trim();
    const digits = value.replace(/\D/g, '');
    phone.setCustomValidity(value && (!/^[+()\d .-]+$/.test(value) || digits.length < 7 || digits.length > 15)
      ? 'Enter a valid phone number, including your country code.' : '');
  }
  phone.addEventListener('input', validatePhone);
  name.addEventListener('input', () => name.setCustomValidity(''));
  form.addEventListener('submit', event => {
    if (pending || form.elements.namedItem('_honey').value) {
      event.preventDefault();
      return;
    }
    name.value = name.value.trim();
    email.value = email.value.trim();
    phone.value = phone.value.trim();
    name.setCustomValidity(name.value ? '' : 'Please enter your full name.');
    validatePhone();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    // Allow the browser's native POST. FormSubmit performs the spam check,
    // sends the lead notification and automatic reply, then redirects back.
    pending = true;
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    button.querySelector('span').textContent = 'Continuing…';
    status.textContent = 'Complete the quick spam check to receive your report.';
    status.hidden = false;
  });
  window.addEventListener('pageshow', () => {
    pending = false;
    form.removeAttribute('aria-busy');
    button.disabled = false;
    button.querySelector('span').textContent = 'Email me the report';
    status.hidden = true;
  });
})();
