import { api } from '../api.js';
import { currentUser } from '../app.js';
import { renderCard } from './shipments.js';

export async function renderProfile(container) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>Loading profile…</span></div>`;

  try {
    // Fetch only delivered shipments for the "Past Orders" section
    const pastOrders = await api.shipments({ status: 'delivered' });

    const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const pastOrdersHTML = pastOrders.length === 0
      ? `<div class="empty-state" style="background:var(--surface); border:1px solid var(--border);">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">No past orders found</div>
          <div class="empty-desc">When your shipments are delivered, they will appear here.</div>
        </div>`
      : `<div class="shipments-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
          ${pastOrders.map((s, i) =>
        renderCard(s).replace('animate-in"', 'animate-in animate-in-delay-' + Math.min(i, 3) + '"')
      ).join('')}
        </div>`;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">My Profile</div>
          <div class="page-subtitle">Manage your personal information and view your past order history</div>
        </div>
      </div>
      
      <div style="padding: 0 20px 40px; display:flex; flex-direction:column; gap:24px; max-width:900px; margin:0 auto;">
        
        <!-- Profile Info Cards Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
          
          <!-- Personal Details -->
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
            <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:15px; font-weight:600;">Personal Information</h3>
              <button class="btn btn-ghost btn-sm">Edit</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
              
              <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
                <div style="width:64px; height:64px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700;">
                  ${initials}
                </div>
                <div>
                  <div style="font-size:18px; font-weight:600;">${currentUser.name}</div>
                  <div style="font-size:13px; color:var(--text-2); text-transform:capitalize;">${currentUser.role} Account</div>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:12px; color:var(--text-3); font-weight:600;">EMAIL ADDRESS</div>
                <div style="font-size:14px;">${currentUser.email}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:12px; color:var(--text-3); font-weight:600;">PHONE NUMBER</div>
                <div style="font-size:14px;">+1 (555) 019-9283</div>
              </div>
            </div>
          </div>

          <!-- Address Book -->
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
            <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:15px; font-weight:600;">Default Address</h3>
              <button class="btn btn-ghost btn-sm">Change</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:16px; height:100%;">
              <div style="display:flex; gap:12px;">
                <div style="font-size:20px;">📍</div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px;">Home (Primary)</div>
                  <div style="font-size:14px; color:var(--text-2); line-height:1.5;">
                    1234 Silicon Valley Blvd<br/>
                    Suite 400<br/>
                    San Jose, CA 95131<br/>
                    United States
                  </div>
                </div>
              </div>
              
              <div style="margin-top:auto; padding-top:16px; border-top:1px solid var(--border);">
                <button class="btn btn-secondary btn-sm" style="width:100%">+ Add New Address</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Past Orders Section -->
        <div>
          <h3 style="margin:0 0 16px 0; font-size:18px; font-weight:600; display:flex; align-items:center; gap:8px;">
            📦 Past Orders <span style="font-size:12px; font-weight:normal; background:var(--bg); padding:2px 8px; border-radius:12px; border:1px solid var(--border);">${pastOrders.length}</span>
          </h3>
          
          ${pastOrdersHTML}
        </div>

      </div>
    `;

    // Wire up tracking buttons in past orders (reusing the renderCard HTML output logic)
    const grid = container.querySelector('.shipments-grid');
    if (grid) {
      grid.querySelectorAll('.track-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.navigate(`#/tracking/${btn.dataset.id}`);
        });
      });
      grid.querySelectorAll('.shipment-card').forEach(card => {
        card.addEventListener('click', () => window.navigate(`#/tracking/${card.dataset.id}`));
      });
    }

  } catch (e) {
    container.innerHTML = `<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${e.message}</span></div>`;
  }
}