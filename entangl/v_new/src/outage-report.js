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
    // Preview build: deliberately disconnected. Nothing is posted anywhere.
    event.preventDefault();
    status.textContent = 'This form isn’t ready to deliver requests. Your details are still here.';
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
