(function () {
  'use strict';

  const STORAGE_KEY = 'restaurant_attendance_demo_v9';
  const SESSION_KEY = 'restaurant_attendance_demo_session_v1';
  const MAX_PORTABLE_QR_WINDOW_MS = 2 * 60 * 1000;

  function uidFromEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase()
      .replace(/[.#$\[\]\/]/g, '_');
  }

  function today() {
    const current = new Date();
    const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function toTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return iso;
    }
  }

  function formatDate(date) {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return date;
    }
  }

  function totalHours(timeIn, timeOut) {
    if (!timeIn || !timeOut) return '';
    const milliseconds = new Date(timeOut) - new Date(timeIn);
    if (milliseconds <= 0) return '';
    return (milliseconds / 3600000).toFixed(2);
  }

  function emptyState() {
    return {
      version: 1,
      users: {},
      attendance: {},
      settings: { currentQr: null },
      seeded: false
    };
  }

  function saveLocal(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();

    try {
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') throw new Error('Invalid demo data');
      state.users = state.users && typeof state.users === 'object' ? state.users : {};
      state.attendance = state.attendance && typeof state.attendance === 'object' ? state.attendance : {};
      state.settings = state.settings && typeof state.settings === 'object'
        ? state.settings
        : { currentQr: null };
      return state;
    } catch (error) {
      const freshState = emptyState();
      saveLocal(freshState);
      return freshState;
    }
  }

  function sessionUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active !== false,
      demo: user.demo === true
    };
  }

  async function init() {
    return 'local';
  }

  async function seedDefaults() {
    const state = loadLocal();
    const demoUsers = Array.isArray(window.APP_CONFIG.demoUsers)
      ? window.APP_CONFIG.demoUsers
      : [];

    demoUsers.forEach((user) => {
      if (!state.users[user.id]) {
        state.users[user.id] = {
          ...user,
          createdAt: nowIso()
        };
      }
    });

    state.seeded = true;
    saveLocal(state);
  }

  async function startDemo(role) {
    const state = loadLocal();
    const user = Object.values(state.users).find(
      (candidate) => candidate.demo === true && candidate.role === role
    );

    if (!user) throw new Error('That demo role is unavailable. Reset the demo and try again.');
    if (user.active === false) throw new Error('That demo role is disabled.');

    const safeUser = sessionUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  }

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.href = 'login.html';
  }

  function requireRole(role) {
    const user = currentUser();
    if (!user || (role && user.role !== role)) {
      location.href = 'login.html';
      return null;
    }
    return user;
  }

  async function getUsers() {
    return Object.values(loadLocal().users).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async function saveUser(user) {
    const name = String(user.name || '').trim();
    const email = String(user.email || '').trim().toLowerCase();

    if (name.length < 2) throw new Error('Enter the employee name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email address.');
    }

    const state = loadLocal();
    const requestedId = user.id ? String(user.id) : '';
    const id = requestedId || uidFromEmail(email);
    const duplicate = Object.values(state.users).find(
      (candidate) => candidate.email === email && candidate.id !== id
    );

    if (duplicate || (!requestedId && state.users[id])) {
      throw new Error('An employee with this email already exists.');
    }

    const existing = state.users[id];
    state.users[id] = {
      id,
      name,
      email,
      role: 'employee',
      active: user.active !== false,
      demo: false,
      createdAt: existing ? existing.createdAt : nowIso(),
      updatedAt: nowIso()
    };

    saveLocal(state);
    return state.users[id];
  }

  async function setUserActive(userId, active) {
    if (!userId) throw new Error('Missing employee ID.');

    const state = loadLocal();
    const user = state.users[userId];

    if (!user) throw new Error('Employee not found.');
    if (user.role === 'admin' || user.demo === true) {
      throw new Error('Protected demo accounts cannot be changed.');
    }

    user.active = Boolean(active);
    user.updatedAt = nowIso();
    saveLocal(state);
    return true;
  }

  async function deleteUser(userId) {
    if (!userId) throw new Error('Missing employee ID.');

    const state = loadLocal();
    const user = state.users[userId];

    if (!user) throw new Error('Employee not found.');
    if (user.role === 'admin' || user.demo === true) {
      throw new Error('Protected demo accounts cannot be deleted.');
    }

    delete state.users[userId];
    saveLocal(state);
    return true;
  }

  async function setCurrentQr(token, expiresAt) {
    const cleanToken = String(token || '').trim();
    const expiry = Number(expiresAt);

    if (cleanToken.length < 16 || !Number.isFinite(expiry)) {
      throw new Error('Could not create a valid demo QR.');
    }

    const state = loadLocal();
    state.settings.currentQr = {
      token: cleanToken,
      expiresAt: expiry,
      createdAt: nowIso()
    };
    saveLocal(state);
  }

  async function getCurrentQr() {
    return loadLocal().settings.currentQr || null;
  }

  function validPortableQr(token, expiresAt) {
    const expiry = Number(expiresAt);
    const currentTime = Date.now();
    const tokenLooksValid = /^[a-z0-9-]{16,200}$/i.test(token);

    return tokenLooksValid
      && Number.isFinite(expiry)
      && expiry >= currentTime
      && expiry <= currentTime + MAX_PORTABLE_QR_WINDOW_MS;
  }

  async function recordAttendance(user, action, token, portableExpiresAt) {
    if (!user || !user.id) throw new Error('Open the employee demo first.');
    if (!['time_in', 'time_out'].includes(action)) {
      throw new Error('Choose Time In or Time Out before scanning.');
    }

    const cleanToken = String(token || '').trim();
    const currentQr = await getCurrentQr();
    const currentTime = Date.now();
    const storedQrIsValid = Boolean(
      currentQr
      && currentQr.token === cleanToken
      && currentTime <= Number(currentQr.expiresAt)
    );
    const portableQrIsValid = validPortableQr(cleanToken, portableExpiresAt);

    if (!storedQrIsValid && !portableQrIsValid) {
      throw new Error('Invalid or expired demo QR. Scan the latest kiosk code.');
    }

    const state = loadLocal();
    const date = today();
    const id = date + '_' + user.id;
    const record = state.attendance[id] || {
      id,
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      date
    };

    if (action === 'time_in') {
      if (record.timeIn) throw new Error('You already timed in today.');
      record.timeIn = nowIso();
    } else {
      if (!record.timeIn) throw new Error('You need to Time In first.');
      if (record.timeOut) throw new Error('You already timed out today.');
      record.timeOut = nowIso();
    }

    record.updatedAt = nowIso();
    state.attendance[id] = record;
    saveLocal(state);
    return record;
  }

  async function getAttendance(date) {
    const selectedDate = date || today();
    return Object.values(loadLocal().attendance)
      .filter((record) => record.date === selectedDate)
      .sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));
  }

  async function getEmployeeToday(user) {
    const records = await getAttendance(today());
    return records.find((record) => record.employeeId === user.id) || null;
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('kioskOk');
    location.href = 'index.html';
  }

  function mode() {
    return 'Local demo · browser-only data';
  }

  window.DB = {
    init,
    seedDefaults,
    startDemo,
    logout,
    currentUser,
    requireRole,
    getUsers,
    saveUser,
    setUserActive,
    deleteUser,
    setCurrentQr,
    getCurrentQr,
    recordAttendance,
    getAttendance,
    getEmployeeToday,
    resetDemo,
    today,
    toTime,
    totalHours,
    formatDate,
    mode,
    uidFromEmail
  };
})();
