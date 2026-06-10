(function () {
  const STORAGE_KEY = 'daxton_delivery_zip';
  const GEO_SESSION_KEY = 'daxton_delivery_geo_zip';
  let detectZipPromise = null;

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

  /**
   * Transit business days from Los Angeles warehouse (900xx).
   * `config.transitDays` is the SoCal local baseline; distant zones add on top.
   */
  function transitDaysForZip(zip, config) {
    const localBase = parseInt(config.transitDays, 10) || 2;
    const z = String(zip || '').replace(/\D/g, '');
    if (!z || z.length < 3) return localBase;
    const prefix = parseInt(z.slice(0, 3), 10);
    if (Number.isNaN(prefix)) return localBase;

    // SoCal / greater Los Angeles
    if (prefix >= 900 && prefix <= 935) return localBase;
    // Rest of CA, NV, AZ
    if (prefix >= 936 && prefix <= 961) return localBase + 1;
    if (prefix >= 890 && prefix <= 898) return localBase + 1;
    // Pacific NW, Mountain, Rockies
    if (prefix >= 970 && prefix <= 994) return localBase + 2;
    if (prefix >= 800 && prefix <= 816) return localBase + 2;
    // Central / South
    if (prefix >= 700 && prefix <= 799) return localBase + 2;
    if (prefix >= 600 && prefix <= 699) return localBase + 3;
    if (prefix >= 300 && prefix <= 599) return localBase + 3;
    // East Coast / Northeast
    if (prefix >= 100 && prefix <= 299) return localBase + 4;
    // Alaska & Hawaii
    if (prefix >= 995 && prefix <= 999) return localBase + 6;
    if (prefix >= 967 && prefix <= 968) return localBase + 6;

    return localBase + 3;
  }

  function formatDeliveryDate(date, locale) {
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
    const month = date.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return weekday + ', ' + month + ' ' + day;
  }

  function formatDeliveryRange(earliest, latest, locale) {
    const earlyStr = formatDeliveryDate(earliest, locale);
    const lateStr = formatDeliveryDate(latest, locale);
    if (earlyStr === lateStr) return earlyStr;
    return earlyStr + ' \u2013 ' + lateStr;
  }

  function computeDeliveryDates(zip, config) {
    const processing = parseInt(config.processingDays, 10) || 1;
    const transitMin = transitDaysForZip(zip, config);
    const rangeBuffer = Math.max(0, parseInt(config.transitRangeDays, 10) || 1);
    const transitMax = transitMin + rangeBuffer;
    const afterProcessing = addBusinessDays(new Date(), processing);
    return {
      earliest: addBusinessDays(afterProcessing, transitMin),
      latest: addBusinessDays(afterProcessing, transitMax),
    };
  }

  function detectZipFromIp(country) {
    if (detectZipPromise) return detectZipPromise;

    detectZipPromise = (async function () {
      try {
        const cached = sessionStorage.getItem(GEO_SESSION_KEY);
        if (cached) return cached;
      } catch (e) {}

      if (country !== 'US' && country !== 'USA') return '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
          controller.abort();
        }, 5000);
        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);
        if (!response.ok) return '';
        const data = await response.json();
        const zip = normalizeZip(data.postal || '', country);
        if (!isValidZip(zip, country)) return '';
        try {
          sessionStorage.setItem(GEO_SESSION_KEY, zip);
        } catch (e) {}
        return zip;
      } catch (e) {
        return '';
      }
    })();

    return detectZipPromise;
  }

  async function resolveInitialZip(config, country) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const normalized = normalizeZip(stored, country);
        if (isValidZip(normalized, country)) return normalized;
      }
    } catch (e) {}

    if (config.customerZip) {
      const customerZip = normalizeZip(config.customerZip, country);
      if (isValidZip(customerZip, country)) return customerZip;
    }

    if (config.autoDetectZip !== false) {
      const detected = await detectZipFromIp(country);
      if (detected) return detected;
    }

    return config.defaultZip || '';
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

    function updateUI(zip, persist) {
      const normalized = normalizeZip(zip, country);
      if (!isValidZip(normalized, country)) {
        setError(config.invalidZipMessage || 'Enter a valid ZIP code.');
        return;
      }
      setError('');
      if (persist !== false) {
        try {
          localStorage.setItem(STORAGE_KEY, normalized);
        } catch (e) {}
      }

      if (zipDisplay) zipDisplay.textContent = normalized;
      zipInput.value = normalized;

      const dates = computeDeliveryDates(normalized, config);
      dateEl.textContent = formatDeliveryRange(dates.earliest, dates.latest, locale);

      if (unavailableEl) unavailableEl.classList.add('hidden');
      dateEl.closest('[data-delivery-estimate-row]')?.classList.remove('hidden');
    }

    // Show fallback estimate immediately, then refine with saved/detected ZIP.
    updateUI(config.defaultZip || '', false);

    resolveInitialZip(config, country).then(function (zip) {
      if (!zip) return;
      const current = normalizeZip(zipInput.value, country);
      const resolved = normalizeZip(zip, country);
      if (resolved !== current) updateUI(resolved);
    });

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
      setZipPanelOpen(config.startOpen === true);
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
