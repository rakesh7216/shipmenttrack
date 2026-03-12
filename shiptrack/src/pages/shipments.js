// Shipments List Page
import { api } from '../api.js';
import { onWsMessage, currentUser } from '../app.js';
import { renderAddShipmentModal } from './add-shipment.js';

const STATUS_LABELS = {
  in_transit: 'In Transit', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', delayed: 'Delayed',
  awaiting_customs: 'Awaiting Customs', exception: 'Exception',
};

const STATUS_COLORS = {
  in_transit: '#60a5fa', out_for_delivery: '#34d399',
  delivered: '#10b981', delayed: '#fbbf24',
  awaiting_customs: '#a78bfa', exception: '#f87171',
};

function formatETA(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d - now) / 3600000;
  if (diffH < 0) return 'Past due';
  if (diffH < 1) return `~${Math.round(diffH * 60)} min`;
  if (diffH < 24) return `~${Math.round(diffH)}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status, pulse = false) {
  return `<span class="status-badge ${status} ${pulse && ['out_for_delivery','in_transit'].includes(status) ? 'pulsing' : ''}">
    <span class="dot"></span>${STATUS_LABELS[status] || status}
  </span>`;
}

export function renderCard(s) {
  return `
    <div class="shipment-card animate-in" data-id="${s.id}" style="--status-color:${STATUS_COLORS[s.status] || 'var(--accent)'}">
      <div class="ship-card-head">
        <div class="ship-carrier">
          <div class="carrier-badge">${s.carrierLogo || '📦'}</div>
          <div class="carrier-info">
            <div class="carrier-name">${s.carrierName || s.carrier.toUpperCase()}</div>
            <div class="tracking-id">${s.trackingNumber}</div>
          </div>
        </div>
        ${statusBadge(s.status, true)}
      </div>

      <div class="ship-card-desc">${s.description}</div>

      <div class="ship-card-route">
        <span class="route-city">${s.origin.name}</span>
        <span class="route-arrow">──▶</span>
        <span class="route-city">${s.destination.name}</span>
      </div>

      <div class="ship-card-footer">
        <div>
          <div class="eta-label">Est. Delivery</div>
          <div class="eta-value">${formatETA(s.estimatedDelivery)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${['shipper', 'ops'].includes(currentUser?.role) ? `<button class="btn btn-ghost btn-sm delete-btn" data-id="${s.id}" title="Delete Shipment">🗑️</button>` : ''}
          ${s.delayMinutes > 0 ? `<span style="font-size:11.5px;color:var(--clr-delayed)">⚠ +${Math.round(s.delayMinutes/60)}h delay</span>` : ''}
          <button class="btn btn-primary btn-sm track-btn" data-id="${s.id}">Track →</button>
        </div>
      </div>
    </div>`;
}

export async function renderShipments(container) {
  container.innerHTML = `
    <div class="page-header" style="justify-content:space-between">
      <div>
        <div class="page-title">Shipments</div>
        <div class="page-subtitle">Monitor all your active shipments in real-time</div>
      </div>
      <div style="text-align:right">
        ${['shipper', 'ops'].includes(currentUser?.role) ? `<button id="btn-add-shipment" class="btn btn-primary" style="margin-bottom:8px">➕ Add Shipment</button><br>` : ''}
        <div id="shipment-count" style="font-size:13px;color:var(--text-3)"></div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="input-group" style="flex:1;min-width:200px;max-width:340px">
        <span class="search-icon">🔍</span>
        <input id="search-input" class="input search-input" placeholder="Search tracking #, description…" />
      </div>
      <select id="status-filter" class="select">
        <option value="">All statuses</option>
        <option value="in_transit">In Transit</option>
        <option value="out_for_delivery">Out for Delivery</option>
        <option value="delayed">Delayed</option>
        <option value="awaiting_customs">Awaiting Customs</option>
        <option value="exception">Exception</option>
        <option value="delivered">Delivered</option>
      </select>
      <select id="carrier-filter" class="select">
        <option value="">All carriers</option>
        <option value="fedex">FedEx</option>
        <option value="ups">UPS</option>
        <option value="dhl">DHL</option>
        <option value="maersk">Maersk</option>
      </select>
    </div>

    <div id="shipments-grid" class="shipments-grid">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading shipments…</span>
      </div>
    </div>`;

  let allShipments = [];

  async function load(params = {}) {
    const grid = document.getElementById('shipments-grid');
    try {
      allShipments = await api.shipments(params);
      document.getElementById('shipment-count').textContent = `${allShipments.length} shipment${allShipments.length !== 1 ? 's' : ''}`;
      if (allShipments.length === 0) {
        grid.innerHTML = `<div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No shipments found</div>
          <div class="empty-desc">Try adjusting your filters or check back later.</div>
        </div>`;
        return;
      }
      grid.innerHTML = allShipments.map((s, i) =>
        renderCard(s).replace('animate-in"', 'animate-in animate-in-delay-' + Math.min(i, 3) + '"')
      ).join('');

      grid.querySelectorAll('.track-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.navigate(`#/tracking/${btn.dataset.id}`);
        });
      });
      grid.querySelectorAll('.shipment-card').forEach(card => {
        card.addEventListener('click', () => window.navigate(`#/tracking/${card.dataset.id}`));
      });
      grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this shipment?')) {
            try {
              btn.disabled = true;
              await api.deleteShipment(btn.dataset.id);
              load(getCurrentParams());
            } catch (err) {
              alert('Failed to delete shipment: ' + err.message);
              btn.disabled = false;
            }
          }
        });
      });
    } catch (e) {
      grid.innerHTML = `<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${e.message}</span></div>`;
    }
  }

  // Setup Add Shipment Form
  const btnAdd = document.getElementById('btn-add-shipment');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      renderAddShipmentModal(() => load(getCurrentParams()));
    });
  }

  // Filters
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 300);
  });
  document.getElementById('status-filter').addEventListener('change', applyFilters);
  document.getElementById('carrier-filter').addEventListener('change', applyFilters);

  function getCurrentParams() {
    const params = {};
    const s = document.getElementById('search-input').value.trim();
    const st = document.getElementById('status-filter').value;
    const ca = document.getElementById('carrier-filter').value;
    if (s)  params.search  = s;
    if (st) params.status  = st;
    if (ca) params.carrier = ca;
    return params;
  }

  function applyFilters() {
    load(getCurrentParams());
  }

  // WebSocket live updates — refresh cards
  const unsub = onWsMessage((msg) => {
    if (msg.type !== 'shipment_update' && msg.type !== 'position_update') return;
    const idx = allShipments.findIndex(s => s.id === msg.shipment?.id);
    if (idx === -1) return;
    allShipments[idx] = { ...allShipments[idx], ...msg.shipment };
    const card = document.querySelector(`.shipment-card[data-id="${msg.shipment.id}"]`);
    if (!card) return;
    const newCard = document.createElement('div');
    newCard.innerHTML = renderCard(allShipments[idx]);
    const newEl = newCard.firstElementChild;
    card.replaceWith(newEl);
    newEl.querySelector('.track-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.navigate(`#/tracking/${newEl.dataset.id}`);
    });
    newEl.addEventListener('click', () => window.navigate(`#/tracking/${newEl.dataset.id}`));
  });

  // Cleanup on navigation away
  window.addEventListener('hashchange', unsub, { once: true });

  load();
}
