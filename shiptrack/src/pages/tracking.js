// Live Tracking Map Page — Leaflet.js + OpenStreetMap
import { api } from '../api.js';
import { onWsMessage, currentUser } from '../app.js';
import { renderUpdateStatusModal } from './update-status.js';

const STATUS_LABELS = {
  in_transit: 'In Transit', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', delayed: 'Delayed',
  awaiting_customs: 'Awaiting Customs', exception: 'Exception',
};
const STATUS_ICONS = {
  in_transit: '🚚', out_for_delivery: '📬', delivered: '✅',
  delayed: '⚠️', awaiting_customs: '🛃', exception: '🚨',
};

const TIMELINE_ICONS = {
  in_transit: '🚚', out_for_delivery: '📬', delivered: '✅',
  delayed: '⚠️', awaiting_customs: '🛃', exception: '🚨',
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatETA(iso) {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date();
  const diffH = (d - now) / 3600000;
  if (diffH < 0) return 'Past due';
  if (diffH < 1) return `~${Math.round(diffH * 60)} min`;
  if (diffH < 24) return `~${Math.round(diffH * 10) / 10}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildTimeline(events) {
  const sorted = [...events].reverse();
  return sorted.map((e, i) => `
    <div class="timeline-item ${i === 0 ? 'timeline-latest' : ''}">
      <div class="timeline-dot ${e.status}">${TIMELINE_ICONS[e.status] || '📌'}</div>
      <div class="timeline-content">
        <div class="timeline-event">${e.description}</div>
        <div class="timeline-meta">${e.location} · ${formatTime(e.timestamp)}</div>
      </div>
    </div>`).join('');
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shareableLink(tn) {
  return `${location.origin}${location.pathname}#/track/${tn}`;
}

export async function renderTracking(container, shipmentId) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>Loading tracking data…</span></div>`;

  let ship;
  try {
    ship = await api.shipment(shipmentId);
  } catch (e) {
    container.innerHTML = `<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${e.message}</span></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('#/shipments')">← Back</button>
        <div>
          <div class="page-title">${ship.trackingNumber}</div>
          <div class="page-subtitle">${ship.description} · ${ship.carrierName || ship.carrier}</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        ${['shipper', 'ops'].includes(currentUser?.role) ? `<button class="btn btn-secondary btn-sm" id="update-status-btn" title="Update status">✏️ Update Status</button>` : ''}
        <a class="btn btn-primary btn-sm" href="https://www.google.com/maps/search/?api=1&query=${ship.currentPosition.lat},${ship.currentPosition.lng}" target="_blank" title="View Current Location on Google Maps">🗺️ Open in Google Maps</a>
        <button class="btn btn-secondary btn-sm" id="share-btn" title="Copy shareable link">🔗 Share Track</button>
        <span class="status-badge ${ship.status} pulsing"><span class="dot"></span>${STATUS_LABELS[ship.status]}</span>
      </div>
    </div>

    <div class="tracking-layout">
      <!-- Map -->
      <div class="map-container">
        <div id="tracking-map"></div>
        <div class="map-overlay-card">
          <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Live Status</div>
          <div class="map-stat-row">
            <div class="map-stat">
              <div class="map-stat-val" id="map-eta">${formatETA(ship.estimatedDelivery)}</div>
              <div class="map-stat-lbl">ETA</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val" id="map-km">${ship.remainingKm ?? '—'}</div>
              <div class="map-stat-lbl">km left</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val">${ship.traffic || 'N/A'}</div>
              <div class="map-stat-lbl">Traffic</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val">${ship.weather || 'N/A'}</div>
              <div class="map-stat-lbl">Weather</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Panel -->
      <div class="timeline-panel">
        <div class="timeline-header">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">Event Timeline</div>
          <div style="font-size:12px;color:var(--text-3)">${ship.events.length} events recorded</div>
          <div style="margin-top:14px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">ROUTE</div>
            <div style="font-size:13px;font-weight:500;display:flex;gap:8px;align-items:center">
              <span>${ship.origin.name}</span>
              <span style="color:var(--text-3)">→</span>
              <span>${ship.destination.name}</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:6px">${ship.service} · ${ship.weight} · ${ship.dimensions}</div>
          </div>
          ${ship.customer ? `
          <div style="margin-top:10px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">CUSTOMER</div>
            <div style="font-size:13px;font-weight:500">${escapeHtml(ship.customer.name)}</div>
            <div style="font-size:12px;color:var(--text-3)">${escapeHtml(ship.customer.email)}</div>
          </div>
          ` : ''}
        </div>
        <div class="timeline-scroll">
          <div class="timeline" id="event-timeline">${buildTimeline(ship.events)}</div>
        </div>
      </div>
    </div>`;

  // ── Share & Update buttons ───────────────────────────────────────────────
  document.getElementById('share-btn')?.addEventListener('click', () => {
    const link = shareableLink(ship.trackingNumber);
    navigator.clipboard.writeText(link).then(() => {
      const btn = document.getElementById('share-btn');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.innerHTML = '🔗 Share Track'; }, 2000);
    });
  });

  const updateBtn = document.getElementById('update-status-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      renderUpdateStatusModal(shipmentId, ship.status, () => renderTracking(container, shipmentId));
    });
  }

  // ── Leaflet Map ──────────────────────────────────────────────────────────
  await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js')
    .catch(() => null); // already loaded via CDN

  const L = window.L;
  if (!L) { console.error('Leaflet not loaded'); return; }

  const map = L.map('tracking-map', {
    center: [ship.currentPosition.lat, ship.currentPosition.lng],
    zoom: 10,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd', maxZoom: 19,
  }).addTo(map);

  // Route polyline
  if (ship.routeWaypoints?.length) {
    const points = ship.routeWaypoints.map(w => [w[0], w[1]]);
    L.polyline(points, { color: '#5b6ef5', weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(map);

    // Completed portion (blue solid)
    const done = points.slice(0, (ship.currentWaypointIndex || 0) + 1);
    if (done.length > 1) {
      L.polyline(done, { color: '#5b6ef5', weight: 4, opacity: 0.9 }).addTo(map);
    }
  }

  // Origin marker
  const originIcon = L.divIcon({
    className: '',
    html: `<div style="background:#1e2535;border:2px solid #5b6ef5;border-radius:50%;width:14px;height:14px;box-shadow:0 0 8px rgba(91,110,245,0.5)"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
  L.marker([ship.origin.lat, ship.origin.lng], { icon: originIcon })
    .bindPopup(`<strong>Origin</strong><br>${ship.origin.name}`).addTo(map);

  // Destination marker
  const destIcon = L.divIcon({
    className: '',
    html: `<div style="background:#10b981;border:2px solid #34d399;border-radius:50%;width:16px;height:16px;box-shadow:0 0 10px rgba(52,211,153,0.6)"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
  L.marker([ship.destination.lat, ship.destination.lng], { icon: destIcon })
    .bindPopup(`<strong>Destination</strong><br>${ship.destination.name}`).addTo(map);

  // Delivery zone circle
  L.circle([ship.destination.lat, ship.destination.lng], {
    radius: 8000, color: '#10b981', fillColor: '#10b981',
    fillOpacity: 0.07, weight: 1.5, dashArray: '6,4',
  }).addTo(map);

  // Animated shipment marker
  const shipIcon = L.divIcon({
    className: '',
    html: `<div style="
      background:linear-gradient(135deg,#5b6ef5,#a78bfa);
      border-radius:50%;width:34px;height:34px;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 0 0 6px rgba(91,110,245,0.25),0 4px 16px rgba(0,0,0,0.5);
      border:2px solid rgba(255,255,255,0.2)
    ">${STATUS_ICONS[ship.status] || '📦'}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  });

  let shipMarker = L.marker([ship.currentPosition.lat, ship.currentPosition.lng], { icon: shipIcon })
    .bindPopup(`<strong>${ship.trackingNumber}</strong><br>${STATUS_LABELS[ship.status] || ship.status}`)
    .addTo(map)
    .openPopup();

  // Nearby hub markers (simulated)
  const hubs = [
    { lat: ship.currentPosition.lat + 0.15, lng: ship.currentPosition.lng - 0.1, name: 'Distribution Hub A' },
    { lat: ship.currentPosition.lat - 0.1, lng: ship.currentPosition.lng + 0.2, name: 'Sorting Facility B' },
  ];
  const hubIcon = L.divIcon({
    className: '',
    html: `<div style="background:var(--bg-3,#1e2535);border:1px solid #374151;border-radius:6px;padding:4px 8px;font-size:10px;color:#9ca3af;white-space:nowrap">🏭</div>`,
    iconSize: [null, null],
  });
  hubs.forEach(h => L.marker([h.lat, h.lng], { icon: hubIcon }).bindPopup(h.name).addTo(map));

  // ── WebSocket — live position updates ────────────────────────────────────
  const unsub = onWsMessage((msg) => {
    if (msg.shipment?.id !== shipmentId && msg.shipment?.id !== ship.id) return;

    if (msg.type === 'position_update' || msg.type === 'shipment_update') {
      const s = msg.shipment;
      if (s.currentPosition) {
        shipMarker.setLatLng([s.currentPosition.lat, s.currentPosition.lng]);
        map.panTo([s.currentPosition.lat, s.currentPosition.lng], { animate: true, duration: 1.5 });
      }
      if (s.estimatedDelivery) document.getElementById('map-eta').textContent = formatETA(s.estimatedDelivery);
      if (s.remainingKm !== undefined) document.getElementById('map-km').textContent = s.remainingKm;
    }

    if (msg.type === 'shipment_update' && msg.shipment?.events) {
      const tl = document.getElementById('event-timeline');
      if (tl) tl.innerHTML = buildTimeline(msg.shipment.events);
    }
  });

  window.addEventListener('hashchange', () => { unsub(); map.remove(); }, { once: true });
}
