import { api } from '../api.js';

export async function renderPublicTracking(container, trackingNumber) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Tracking: ${trackingNumber}</div>
        <div class="page-subtitle">Public Tracking Page</div>
      </div>
    </div>
    <div class="loading-overlay" id="public-tracking-loader"><div class="spinner"></div><span>Loading tracking data…</span></div>
    <div id="public-tracking-content" style="display:none; padding: 20px;">
    </div>
  `;

  try {
    const ship = await api.publicTrack(trackingNumber);
    document.getElementById('public-tracking-loader').style.display = 'none';
    const content = document.getElementById('public-tracking-content');
    content.style.display = 'block';

    content.innerHTML = `
      <div class="card">
        <h3>Status: ${ship.status.replace('_', ' ').toUpperCase()}</h3>
        <p><strong>Description:</strong> ${ship.description}</p>
        <p><strong>Carrier:</strong> ${ship.carrier}</p>
        <p><strong>Origin:</strong> ${ship.origin.name}</p>
        <p><strong>Destination:</strong> ${ship.destination.name}</p>
        <p><strong>Estimated Delivery:</strong> ${new Date(ship.estimatedDelivery).toLocaleDateString()}</p>
        
        <h4>Events</h4>
        <ul>
          ${ship.events.map(e => `<li>${new Date(e.timestamp).toLocaleString()} - ${e.location} - <strong>${e.description}</strong></li>`).join('')}
        </ul>
      </div>
    `;
  } catch (e) {
    document.getElementById('public-tracking-loader').innerHTML = `<span style="color:red">❌ ${e.message}</span>`;
  }
}
