/* ============================================================
   DeviceWatch — Production JavaScript
   Real: Auth, Registry, IMEI validation, session, data persistence
   Simulated: National ID API, police report verification
   ============================================================ */

const DW = (() => {
  'use strict';

  // ========== STORAGE KEYS ==========
  const KEYS = {
    USERS: 'dw_users',
    DEVICES: 'dw_devices',
    SESSION: 'dw_session',
    CHECKS: 'dw_check_count',
  };

  // ========== SEED DATA ==========
  const SEED_DEVICES = [
    { id: 'd001', imei: '352099001761481', serial: '', make: 'Samsung', model: 'Galaxy A54', color: 'Black', marks: 'Cracked bottom-left corner, blue case', status: 'stolen', reportNo: 'MW/BT/2025/04521', reportDate: '2025-11-12', registeredBy: 'seed', registeredAt: '2025-11-13T08:00:00Z', photo: null },
    { id: 'd002', imei: '490154203237518', serial: '', make: 'Apple', model: 'iPhone 14 Pro', color: 'Silver', marks: 'Screen protector, engraved initials JM on back', status: 'stolen', reportNo: 'MW/LL/2025/00831', reportDate: '2025-09-03', registeredBy: 'seed', registeredAt: '2025-09-05T14:00:00Z', photo: null },
    { id: 'd003', imei: '356938035643809', serial: 'RZ8R30BCXLJ', make: 'Samsung', model: 'Galaxy S23', color: 'Green', marks: 'No visible marks, original box available', status: 'recovered', reportNo: 'MW/MZ/2025/01204', reportDate: '2025-07-20', registeredBy: 'seed', registeredAt: '2025-07-21T10:00:00Z', photo: null },
    { id: 'd004', imei: '861536030196001', serial: '', make: 'TECNO', model: 'Spark 10 Pro', color: 'Blue', marks: 'Chipped top-right bezel', status: 'stolen', reportNo: 'MW/BT/2026/00189', reportDate: '2026-01-15', registeredBy: 'seed', registeredAt: '2026-01-16T09:00:00Z', photo: null },
    { id: 'd005', imei: '359405082467494', serial: 'F2LXJ3NNHG7J', make: 'Apple', model: 'iPhone 13', color: 'Midnight', marks: 'Deep scratch on left side', status: 'stolen', reportNo: 'MW/ZA/2026/00044', reportDate: '2026-02-28', registeredBy: 'seed', registeredAt: '2026-03-01T11:00:00Z', photo: null },
  ];

  // ========== INIT ==========
  function init() {
    // Seed devices if empty
    if (!localStorage.getItem(KEYS.DEVICES)) {
      localStorage.setItem(KEYS.DEVICES, JSON.stringify(SEED_DEVICES));
    }
    // Init users if empty
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([]));
    }
    // Init check counter
    if (!localStorage.getItem(KEYS.CHECKS)) {
      localStorage.setItem(KEYS.CHECKS, '0');
    }
    updateNavAuth();
  }

  // ========== IMEI VALIDATION (REAL — Luhn algorithm) ==========
  function isValidIMEI(imei) {
    if (!/^\d{15}$/.test(imei)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let d = parseInt(imei[i]);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function isValidSerial(serial) {
    return /^[A-Za-z0-9]{6,20}$/.test(serial);
  }

  function validateIdentifier(val) {
    const clean = val.replace(/[\s-]/g, '').toUpperCase();
    if (/^\d{15}$/.test(clean)) {
      return { type: 'imei', value: clean, valid: isValidIMEI(clean) };
    }
    if (/^[A-Z0-9]{6,20}$/.test(clean)) {
      return { type: 'serial', value: clean, valid: true };
    }
    return { type: 'unknown', value: clean, valid: false };
  }

  // ========== DEVICE REGISTRY (REAL — localStorage) ==========
  function getDevices() {
    return JSON.parse(localStorage.getItem(KEYS.DEVICES) || '[]');
  }

  function saveDevices(devices) {
    localStorage.setItem(KEYS.DEVICES, JSON.stringify(devices));
  }

  function lookupDevice(identifier) {
    const { value } = validateIdentifier(identifier);
    const devices = getDevices();
    return devices.find(d =>
      d.imei === value || d.serial.toUpperCase() === value
    ) || null;
  }

  function registerDevice(data) {
    const devices = getDevices();
    const id = 'd' + (Date.now().toString(36));
    const device = {
      id,
      imei: data.imei || '',
      serial: (data.serial || '').toUpperCase(),
      make: data.make,
      model: data.model,
      color: data.color || '',
      marks: data.marks || '',
      status: 'stolen',
      reportNo: data.reportNo,
      reportDate: data.reportDate,
      registeredBy: getCurrentUser()?.id || 'anon',
      registeredAt: new Date().toISOString(),
      photo: data.photo || null,
    };
    // Check for duplicate
    const existing = devices.find(d => d.imei === device.imei && device.imei);
    if (existing) return { success: false, error: 'This IMEI is already registered in the system.' };
    devices.push(device);
    saveDevices(devices);
    return { success: true, device };
  }

  function updateDeviceStatus(deviceId, newStatus) {
    const devices = getDevices();
    const idx = devices.findIndex(d => d.id === deviceId);
    if (idx === -1) return false;
    devices[idx].status = newStatus;
    saveDevices(devices);
    return true;
  }

  function deleteDevice(deviceId) {
    const devices = getDevices().filter(d => d.id !== deviceId);
    saveDevices(devices);
  }

  function getUserDevices() {
    const user = getCurrentUser();
    if (!user) return [];
    return getDevices().filter(d => d.registeredBy === user.id);
  }

  function incrementChecks() {
    const c = parseInt(localStorage.getItem(KEYS.CHECKS) || '0') + 1;
    localStorage.setItem(KEYS.CHECKS, c.toString());
    return c;
  }

  function getStats() {
    const devices = getDevices();
    const users = getUsers();
    return {
      totalDevices: devices.length,
      stolen: devices.filter(d => d.status === 'stolen').length,
      recovered: devices.filter(d => d.status === 'recovered').length,
      checks: parseInt(localStorage.getItem(KEYS.CHECKS) || '0'),
      users: users.length,
    };
  }

  // ========== AUTH (REAL — localStorage with hashed passwords) ==========
  function getUsers() {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  // Simple hash — NOT cryptographic, but functional for a client-side prototype.
  // In production, this moves to bcrypt on the server.
  function hashPassword(pw) {
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      const ch = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
  }

  function signup(data) {
    const users = getUsers();
    // Check duplicate email
    if (users.find(u => u.email === data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    // Check duplicate NID
    if (users.find(u => u.nid === data.nid)) {
      return { success: false, error: 'This National ID is already registered.' };
    }
    const user = {
      id: 'u' + Date.now().toString(36),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      nid: data.nid.trim(),
      nidVerified: false, // Would be verified via API
      password: hashPassword(data.password),
      createdAt: new Date().toISOString(),
    };
    // ---- SIMULATED: National ID verification ----
    // In production, this calls the national population registry API.
    // For now, accept any NID matching pattern: letters/numbers, 6-20 chars.
    if (/^[A-Za-z0-9]{6,20}$/.test(data.nid)) {
      user.nidVerified = true; // Simulated as verified
    }
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { success: true, user };
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) return { success: false, error: 'No account found with this email.' };
    if (user.password !== hashPassword(password)) return { success: false, error: 'Incorrect password.' };
    setSession(user);
    return { success: true, user };
  }

  function logout() {
    localStorage.removeItem(KEYS.SESSION);
    window.location.href = getBasePath() + 'index.html';
  }

  function setSession(user) {
    const session = { id: user.id, name: user.name, email: user.email, ts: Date.now() };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  }

  function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null');
    if (!session) return null;
    // Session expires after 24h
    if (Date.now() - session.ts > 86400000) { localStorage.removeItem(KEYS.SESSION); return null; }
    return session;
  }

  function isLoggedIn() { return !!getCurrentUser(); }

  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = getBasePath() + 'pages/login.html';
      return false;
    }
    return true;
  }

  // ========== POLICE REPORT VALIDATION (SIMULATED STUB) ==========
  // In production, this validates against Malawi Police Service API.
  // Format expected: MW/XX/YYYY/NNNNN (country/station/year/number)
  function validatePoliceReport(reportNo) {
    const pattern = /^MW\/[A-Z]{2,4}\/\d{4}\/\d{3,6}$/;
    if (!pattern.test(reportNo)) {
      return { valid: false, error: 'Format: MW/XX/YYYY/NNNNN (e.g. MW/BT/2026/00189)' };
    }
    // SIMULATED: In production, verify against police database
    return { valid: true, verified: true, message: 'Report format accepted. In production, this will be verified against the Malawi Police database.' };
  }

  // ========== NAV AUTH STATE ==========
  function updateNavAuth() {
    const user = getCurrentUser();
    document.querySelectorAll('.nav-guest').forEach(el => el.classList.toggle('hide', !!user));
    document.querySelectorAll('.nav-auth').forEach(el => {
      el.classList.toggle('show', !!user);
      const badge = el.querySelector('.user-badge');
      if (badge && user) badge.textContent = user.name;
    });
  }

  // ========== UTILITY ==========
  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) return '../';
    return '';
  }

  function toast(message, type = 'success') {
    let el = document.getElementById('dw-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dw-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `toast ${type}`;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => el.classList.remove('show'), 3500);
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

  function toggleMenu() {
    const nl = document.querySelector('.nav-links');
    if (nl) nl.classList.toggle('open');
  }

  // ========== ANIMATED COUNTERS ==========
  function animCount(el, target, suffix = '') {
    let n = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const iv = setInterval(() => {
      n = Math.min(n + step, target);
      el.textContent = n.toLocaleString() + suffix;
      if (n >= target) clearInterval(iv);
    }, 25);
  }

  // ========== PUBLIC API ==========
  return {
    init, isValidIMEI, isValidSerial, validateIdentifier,
    getDevices, lookupDevice, registerDevice, updateDeviceStatus, deleteDevice,
    getUserDevices, incrementChecks, getStats,
    signup, login, logout, getCurrentUser, isLoggedIn, requireAuth,
    validatePoliceReport, updateNavAuth,
    getBasePath, toast, formatDate, generateId, toggleMenu, animCount,
  };
})();

// Auto-init on every page
document.addEventListener('DOMContentLoaded', () => DW.init());
