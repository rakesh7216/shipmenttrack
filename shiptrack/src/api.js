// API client — typed fetch helpers for all backend endpoints
const BASE = '/api';

function getToken() { return localStorage.getItem('shiptrack_token'); }

async function req(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email, password)        => req('POST', '/auth/login', { email, password }),
  me:    ()                        => req('GET',  '/auth/me'),

  // Shipments
  shipments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/shipments${qs ? '?' + qs : ''}`);
  },
  shipment:  (id)                  => req('GET',  `/shipments/${id}`),
  createShipment: (payload)        => req('POST', '/shipments', payload),
  deleteShipment: (id)             => req('DELETE', `/shipments/${id}`),
  injectEvent: (id, payload)       => req('POST', `/shipments/${id}/events`, payload),
  carriers:  ()                    => req('GET',  '/shipments/meta/carriers'),

  // Public tracking
  publicTrack: (tn) => fetch(`${BASE}/tracking/${tn}`).then(r => r.json()),

  // Notifications
  notifPrefs: ()             => req('GET',  '/shipments/notifications/prefs'),
  saveNotifPrefs: (prefs)    => req('PUT',  '/shipments/notifications/prefs', prefs),
  notifLog: ()               => req('GET',  '/shipments/notifications/log'),

  // Analytics
  // Analytics
  analyticsSummary: ()       => req('GET',  '/analytics/summary'),
  carrierSla:       ()       => req('GET',  '/analytics/carrier-sla'),
  volume:           ()       => req('GET',  '/analytics/volume'),
  routes:           ()       => req('GET',  '/analytics/routes'),

  // Chatbot
  chat:             (message)=> req('POST', '/chat', { message }),
};
