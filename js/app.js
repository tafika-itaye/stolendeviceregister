/* ============================================================
   DeviceWatch — Shared Application Logic v2.0
   ============================================================ */

const DW = (() => {
  'use strict';

  // --- MOCK DATABASE ---
  const mockDB = {
    '352099001761481': {
      stolen: true,
      make: 'Samsung Galaxy A54 5G',
      imei: '352099001761481',
      reportNo: 'MW/BT/2025/04521',
      date: '2025-11-12',
      marks: 'Cracked bottom-left corner, blue silicone case'
    },
    '490154203237518': {
      stolen: true,
      make: 'iPhone 14 Pro',
      imei: '490154203237518',
      reportNo: 'MW/LL/2025/00831',
      date: '2025-09-03',
      marks: 'Tempered glass screen protector, silver back'
    },
    '867530012345678': {
      stolen: true,
      make: 'TECNO Spark 10 Pro',
      imei: '867530012345678',
      reportNo: 'MW/MZ/2026/00112',
      date: '2026-01-18',
      marks: 'Red case, small dent on top edge'
    },
    '012345678912345': { stolen: false }
  };

  // --- TOAST ---
  function toast(msg, type = 'error') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast ' + type;
    el.style.display = 'block';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.display = 'none'; }, 3200);
  }

  // --- MOBILE MENU ---
  function toggleMenu() {
    const links = document.querySelector('.nav-links');
    const burger = document.querySelector('.hamburger');
    if (!links || !burger) return;
    links.classList.toggle('open');
    burger.classList.toggle('open');
  }

  // --- AUTH STATE ---
  function isLoggedIn() {
    return sessionStorage.getItem('dw_auth') === '1';
  }

  function login(email) {
    sessionStorage.setItem('dw_auth', '1');
    sessionStorage.setItem('dw_email', email || 'user@email.com');
    applyAuthState();
  }

  function logout() {
    sessionStorage.removeItem('dw_auth');
    sessionStorage.removeItem('dw_email');
    // Redirect to index
    const depth = document.querySelector('meta[name="page-depth"]');
    const prefix = depth ? depth.content : '';
    window.location.href = prefix + 'index.html';
  }

  function applyAuthState() {
    if (isLoggedIn()) {
      document.body.classList.add('logged-in');
      const badge = document.querySelector('.user-badge');
      if (badge) badge.textContent = sessionStorage.getItem('dw_email') || 'user';
    } else {
      document.body.classList.remove('logged-in');
    }
  }

  // --- IMEI SEARCH ---
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function checkDevice() {
    const input = document.getElementById('searchInput');
    const area = document.getElementById('result-area');
    if (!input || !area) return;

    const val = input.value.trim().replace(/[\s-]/g, '');
    if (!val) { area.innerHTML = ''; return; }

    const safeVal = sanitize(val);
    const found = mockDB[val] || mockDB[val.toUpperCase()] || mockDB[val.toLowerCase()];

    if (found === undefined) {
      area.innerHTML =
        '<div class="result-card result-not-found">' +
          '<div class="result-title neutral">&#x1F50D; NOT FOUND IN REGISTRY</div>' +
          '<div class="result-body">The identifier <strong>' + safeVal + '</strong> does not appear in the stolen device registry. This device has not been reported stolen. Always verify ownership with the seller before purchasing.</div>' +
          '<div class="result-tags"><span class="tag info">QUERY: ' + safeVal + '</span><span class="tag success">NO REPORT FOUND</span></div>' +
        '</div>';
      return;
    }

    if (!found.stolen) {
      area.innerHTML =
        '<div class="result-card result-clean">' +
          '<div class="result-title clean">&#x2705; DEVICE IS CLEAN</div>' +
          '<div class="result-body">No stolen report found for <strong>' + safeVal + '</strong>. This device has not been flagged in the registry.</div>' +
          '<div class="result-tags"><span class="tag success">STATUS: CLEAN</span></div>' +
        '</div>';
    } else {
      area.innerHTML =
        '<div class="result-card result-stolen">' +
          '<div class="result-title stolen">&#x1F6A8; STOLEN DEVICE FLAGGED</div>' +
          '<div class="result-body">' +
            '<strong>' + sanitize(found.make) + '</strong> was reported stolen on <strong>' + sanitize(found.date) + '</strong>.<br>' +
            'Police Report: <strong>' + sanitize(found.reportNo) + '</strong><br>' +
            'Identifying Marks: ' + sanitize(found.marks) +
          '</div>' +
          '<div class="result-tags">' +
            '<span class="tag stolen">STOLEN</span>' +
            '<span class="tag info">IMEI: ' + sanitize(found.imei) + '</span>' +
            '<span class="tag info">REPORT VERIFIED</span>' +
          '</div>' +
        '</div>';
    }
  }

  // --- ANIMATED COUNTERS ---
  function animCount(id, target, suffix) {
    suffix = suffix || '';
    const el = document.getElementById(id);
    if (!el) return;

    let current = 0;
    const duration = 1200;
    const steps = 50;
    const increment = target / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      el.textContent = Math.floor(current).toLocaleString() + suffix;
      if (current >= target) {
        el.textContent = target.toLocaleString() + suffix;
        clearInterval(timer);
      }
    }, interval);
  }

  // --- INIT ---
  function init() {
    applyAuthState();

    // Bind search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkDevice();
      });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        const links = document.querySelector('.nav-links');
        const burger = document.querySelector('.hamburger');
        if (links) links.classList.remove('open');
        if (burger) burger.classList.remove('open');
      });
    });
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    checkDevice,
    toggleMenu,
    toast,
    login,
    logout,
    isLoggedIn,
    animCount,
    sanitize
  };
})();
