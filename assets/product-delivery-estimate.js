(function () {
  const STORAGE_KEY = 'daxton_delivery_zip';

  function parseConfig(root) {
    try {
      return JSON.parse(root.querySelector('[data-delivery-config]')?.textContent || '{}');
    } catch (e) {
      return {};
    }
  }

  function isValidZip(zip, country) {
    const z = String(zip || '').trim();
    if (!z) return false;
    if (country === 'US' || country === 'USA') return /^\d{5}(-\d{4})?$/.test(z);
    if (country === 'CA' || country === 'CAN') return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(z);
    return z.length >= 3 && z.length <= 12;
  }

  function normalizeZip(zip, country) {
    const z = String(zip || '').trim();
    if (country === 'CA' || country === 'CAN') return z.toUpperCase().replace(/\s+/g, ' ');
    return z.replace(/\D/g, '').slice(0, 5);
  }

  function addBusinessDays(start, days) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    let added = 0;
    const total = Math.max(0, parseInt(days, 10) || 0);
    while (added < total) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return date;
  }

  function transitDaysForZip(zip, config) {
    const base = parseInt(config.transitDays, 10) || 3;
    const z = String(zip || '').replace(/\D/g, '');
    if (!z || z.length < 3) return base;
    const prefix = parseInt(z.slice(0, 3), 10);
    if (Number.isNaN(prefix)) return base;
    if (prefix >= 900 && prefix <= 961) return base;
    if (prefix >= 100 && prefix <= 299) return base + 1;
    if (prefix >= 300 && prefix <= 599) return base + 2;
    if (prefix >= 600 && prefix <= 799) return base + 3;
    return base + 4;
  }

  function formatDeliveryDate(date, locale) {
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
    const month = date.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return weekday + ', ' + month + ' ' + day;
  }

  function computeDeliveryDate(zip, config) {
    const processing = parseInt(config.processingDays, 10) || 1;
    const transit = transitDaysForZip(zip, config);
    const afterProcessing = addBusinessDays(new Date(), processing);
    return addBusinessDays(afterProcessing, transit);
  }

  function init(root) {
    if (!root || root.dataset.deliveryBound === '1') return;
    root.dataset.deliveryBound = '1';

    const config = parseConfig(root);
    const locale = config.locale || 'en-US';
    const country = config.country || 'US';

    const zipPanel = root.querySelector('[data-delivery-zip-panel]');
    const zipToggle = root.querySelector('[data-delivery-zip-toggle]');
    const zipCaret = root.querySelector('[data-delivery-caret]');
    const zipDisplay = root.querySelector('[data-delivery-zip-display]');
    const zipInput = root.querySelector('[data-delivery-zip-input]');
    const updateBtn = root.querySelector('[data-delivery-zip-update]');
    const dateEl = root.querySelector('[data-delivery-date]');
    const errorEl = root.querySelector('[data-delivery-zip-error]');
    const unavailableEl = root.querySelector('[data-delivery-unavailable]');

    if (!zipInput || !dateEl) return;

    function setError(message) {
      if (!errorEl) return;
      if (message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      } else {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }

    function updateUI(zip) {
      const normalized = normalizeZip(zip, country);
      if (!isValidZip(normalized, country)) {
        setError(config.invalidZipMessage || 'Enter a valid ZIP code.');
        return;
      }
      setError('');
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (e) {}

      if (zipDisplay) zipDisplay.textContent = normalized;
      zipInput.value = normalized;

      const deliveryDate = computeDeliveryDate(normalized, config);
      dateEl.textContent = formatDeliveryDate(deliveryDate, locale);

      if (unavailableEl) unavailableEl.classList.add('hidden');
      dateEl.closest('[data-delivery-estimate-row]')?.classList.remove('hidden');
    }

    let initialZip = '';
    try {
      initialZip = localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {}
    if (!initialZip && config.defaultZip) initialZip = config.defaultZip;
    updateUI(initialZip);

    function setZipPanelOpen(open) {
      if (!zipPanel) return;
      zipPanel.classList.toggle('hidden', !open);
      if (zipToggle) zipToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (zipCaret) {
        zipCaret.classList.toggle('rotate-180', open);
        zipCaret.classList.toggle('rotate-0', !open);
      }
    }

    if (zipToggle && zipPanel) {
      setZipPanelOpen(config.startOpen !== false);
      zipToggle.addEventListener('click', function () {
        setZipPanelOpen(zipPanel.classList.contains('hidden'));
      });
    }

    if (updateBtn) {
      updateBtn.addEventListener('click', function () {
        updateUI(zipInput.value);
      });
    }

    zipInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateUI(zipInput.value);
      }
    });
  }

  function boot() {
    document.querySelectorAll('[data-product-delivery-estimate]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
