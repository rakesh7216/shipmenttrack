// Shipment Creation Form Modal
import { api } from '../api.js';

export function renderAddShipmentModal(onSuccess) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Create New Shipment</div>
        <button class="btn btn-ghost btn-sm close-modal">✕</button>
      </div>
      <div class="modal-body">
        <form id="add-shipment-form">
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Tracking Number *</label>
            <input name="trackingNumber" class="input" required placeholder="e.g. TRK-999" style="width:100%" />
          </div>
          
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Carrier *</label>
            <select name="carrier" class="select" required style="width:100%">
              <option value="fedex">FedEx</option>
              <option value="ups">UPS</option>
              <option value="dhl">DHL</option>
              <option value="maersk">Maersk</option>
            </select>
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Description</label>
            <input name="description" class="input" placeholder="e.g. Electronics" style="width:100%" />
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Customer Email (Optional)</label>
            <input name="customerEmail" type="email" class="input" placeholder="e.g. customer@demo.com" style="width:100%" />
          </div>

          <div style="display:flex;gap:12px;margin-bottom:12px">
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Origin City *</label>
              <input name="originName" class="input" required placeholder="e.g. New York, NY" style="width:100%" />
            </div>
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Dest. City *</label>
              <input name="destName" class="input" required placeholder="e.g. London, UK" style="width:100%" />
            </div>
          </div>
          
          <!-- Mocking coordinates for simplicity -->
          <input type="hidden" name="originLat" value="40.7128" />
          <input type="hidden" name="originLng" value="-74.0060" />
          <input type="hidden" name="destLat" value="51.5074" />
          <input type="hidden" name="destLng" value="-0.1278" />

          <div style="display:flex;gap:12px;margin-bottom:20px">
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Weight</label>
              <input name="weight" class="input" placeholder="e.g. 5 kg" style="width:100%" />
            </div>
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Dimensions</label>
              <input name="dimensions" class="input" placeholder="e.g. 10x10x10" style="width:100%" />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px">
            <button type="button" class="btn btn-ghost close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-shipment">Create Shipment</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelectorAll('.close-modal').forEach(b => b.onclick = close);
  
  const form = modal.querySelector('#add-shipment-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      trackingNumber: fd.get('trackingNumber'),
      carrier: fd.get('carrier'),
      description: fd.get('description'),
      customerEmail: fd.get('customerEmail'),
      origin: { name: fd.get('originName'), lat: parseFloat(fd.get('originLat')), lng: parseFloat(fd.get('originLng')) },
      destination: { name: fd.get('destName'), lat: parseFloat(fd.get('destLat')), lng: parseFloat(fd.get('destLng')) },
      weight: fd.get('weight'),
      dimensions: fd.get('dimensions'),
      service: 'Standard',
    };

    const btn = form.querySelector('#btn-submit-shipment');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    try {
      await api.createShipment(payload);
      close();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Error creating shipment: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Create Shipment';
    }
  };
}
