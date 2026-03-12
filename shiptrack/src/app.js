// Client-side router + WebSocket client + app shell controller
import { renderLogin } from './pages/login.js';
import { renderShipments } from './pages/shipments.js';
import { renderTracking } from './pages/tracking.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderNotifications } from './pages/notifications.js';
import { renderPublicTracking } from './pages/public-tracking.js';
import { renderProfile } from './pages/profile.js';

// ── State ──────────────────────────────────────────────────────────────────
export let currentUser = null;
let ws = null;
let wsReconnectTimer = null;
const wsListeners = new Set();

// ── Auth helpers ───────────────────────────────────────────────────────────
export function setUser(user, token) {
  currentUser = user;
  localStorage.setItem('shiptrack_token', token);
  localStorage.setItem('shiptrack_user', JSON.stringify(user));
}
export function clearUser() {
  currentUser = null;
  localStorage.removeItem('shiptrack_token');
  localStorage.removeItem('shiptrack_user');
}
function loadStoredUser() {
  try {
    const stored = localStorage.getItem('shiptrack_user');
    if (stored) currentUser = JSON.parse(stored);
  } catch { }
}

// ── WebSocket ──────────────────────────────────────────────────────────────
export function onWsMessage(fn) { wsListeners.add(fn); return () => wsListeners.delete(fn); }

function connectWs() {
  if (!currentUser) return;
  if (ws && ws.readyState < 2) return; // already open/connecting

  const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${wsProto}//${location.host}/ws?userId=${currentUser.id}&role=${currentUser.role}`;
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('🔌 WebSocket connected');
    document.getElementById('ws-indicator')?.classList.add('connected');
    clearTimeout(wsReconnectTimer);
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      wsListeners.forEach(fn => fn(msg));
    } catch { }
  };
  ws.onclose = () => {
    document.getElementById('ws-indicator')?.classList.remove('connected');
    wsReconnectTimer = setTimeout(connectWs, 3000);
  };
  ws.onerror = () => ws.close();
}

// ── Navigation ─────────────────────────────────────────────────────────────
function updateSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mobileNav = document.getElementById('mobile-nav');
  const userChip = document.getElementById('user-chip');
  const main = document.getElementById('main-content');

  if (!currentUser) {
    sidebar.classList.add('hidden');
    if (mobileNav) mobileNav.classList.add('hidden');
    main.classList.add('full-width');
    return;
  }

  sidebar.classList.remove('hidden');
  if (mobileNav) mobileNav.classList.remove('hidden');
  main.classList.remove('full-width');

  // Render user chip
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  userChip.innerHTML = `
    <div class="user-avatar">${initials}</div>
    <div class="user-info">
      <div class="user-name">${currentUser.name}</div>
      <div class="user-role">${currentUser.role}</div>
    </div>`;

  // Role-based nav visibility
  const opsItems = document.querySelectorAll('.nav-ops');
  const shipperItems = document.querySelectorAll('.nav-shipper');
  const customerItems = document.querySelectorAll('.nav-customer');
  opsItems.forEach(el => el.style.display = currentUser.role === 'ops' ? '' : 'none');
  shipperItems.forEach(el => el.style.display = ['ops', 'shipper'].includes(currentUser.role) ? '' : 'none');
  customerItems.forEach(el => el.style.display = currentUser.role === 'customer' ? '' : 'none');
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── Router ─────────────────────────────────────────────────────────────────
async function router() {
  const hash = location.hash || '#/';
  const app = document.getElementById('app');

  // Public tracking — no auth needed
  if (hash.startsWith('#/track/')) {
    document.getElementById('sidebar').classList.add('hidden');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.add('hidden');
    document.getElementById('main-content').classList.add('full-width');
    const tn = hash.replace('#/track/', '');
    app.innerHTML = '';
    await renderPublicTracking(app, tn);
    return;
  }

  // Auth guard
  if (!currentUser) {
    updateSidebar();
    app.innerHTML = '';
    await renderLogin(app);
    return;
  }

  updateSidebar();

  if (hash === '#/' || hash === '#/shipments') {
    setActiveNav('shipments');
    app.innerHTML = '';
    await renderShipments(app);
  } else if (hash.startsWith('#/tracking/')) {
    setActiveNav('shipments');
    const id = hash.replace('#/tracking/', '');
    app.innerHTML = '';
    await renderTracking(app, id);
  } else if (hash === '#/analytics') {
    if (!['ops', 'shipper'].includes(currentUser.role)) {
      location.hash = '#/shipments'; return;
    }
    setActiveNav('analytics');
    app.innerHTML = '';
    await renderAnalytics(app);
  } else if (hash === '#/notifications') {
    setActiveNav('notifications');
    app.innerHTML = '';
    await renderNotifications(app);
  } else if (hash === '#/profile') {
    if (currentUser.role !== 'customer') {
      location.hash = '#/shipments'; return;
    }
    setActiveNav('profile');
    app.innerHTML = '';
    await renderProfile(app);
  } else {
    location.hash = '#/shipments';
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────
loadStoredUser();
connectWs();

window.addEventListener('hashchange', () => router());

// ── Theme Toggle ───────────────────────────────────────────────────────────
const storedTheme = localStorage.getItem('shiptrack_theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

document.getElementById('btn-theme')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('shiptrack_theme', next);

  const btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = next === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
});

// Set initial button text based on stored theme
const themeBtn = document.getElementById('btn-theme');
if (themeBtn) themeBtn.innerHTML = storedTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';


document.getElementById('btn-logout')?.addEventListener('click', () => {
  clearUser();
  if (ws) ws.close();
  location.hash = '#/';
  router();
});

document.getElementById('btn-logout-mobile')?.addEventListener('click', () => {
  clearUser();
  if (ws) ws.close();
  location.hash = '#/';
  router();
});

// Expose navigate helper globally (used across pages)
window.navigate = (path) => { location.hash = path; };
window.getApp = () => ({ currentUser, onWsMessage, connectWs });

router();
