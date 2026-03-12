// Update Shipment Status Modal
import { api } from '../api.js';

export function renderUpdateStatusModal(shipmentId, currentStatus, onSuccess) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Update Shipment Status</div>
        <button class="btn btn-ghost btn-sm close-modal">✕</button>
      </div>
      <div class="modal-body">
        <form id="update-status-form">
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">New Status *</label>
            <select name="status" class="select" required style="width:100%">
              <option value="in_transit" ${currentStatus === 'in_transit' ? 'selected' : ''}>In Transit</option>
              <option value="out_for_delivery" ${currentStatus === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
              <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="delayed" ${currentStatus === 'delayed' ? 'selected' : ''}>Delayed</option>
              <option value="awaiting_customs" ${currentStatus === 'awaiting_customs' ? 'selected' : ''}>Awaiting Customs</option>
              <option value="exception" ${currentStatus === 'exception' ? 'selected' : ''}>Exception</option>
            </select>
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Event Description</label>
            <input name="description" class="input" placeholder="e.g. Package arrived at local facility" style="width:100%" />
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:20px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Location</label>
            <input name="location" class="input" placeholder="e.g. New York, NY" style="width:100%" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px">
            <button type="button" class="btn btn-ghost close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-status">Update Status</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelectorAll('.close-modal').forEach(b => b.onclick = close);
  
  const form = modal.querySelector('#update-status-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    
    // Convert status to rawCode mock for the backend logic
    const statusCodes = {
      'in_transit': 'IT',
      'out_for_delivery': 'OD',
      'delivered': 'DEL',
      'delayed': 'DLY',
      'awaiting_customs': 'AC',
      'exception': 'EX'
    };

    const payload = {
      code: statusCodes[fd.get('status')] || 'IT', // Using code matching backend ingest logic
      description: fd.get('description'),
      location: fd.get('location')
    };

    const btn = form.querySelector('#btn-submit-status');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      await api.injectEvent(shipmentId, payload);
      close();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Error updating status: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Update Status';
    }
  };
}
