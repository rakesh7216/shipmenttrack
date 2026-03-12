export async function renderNotifications(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Settings & Alerts</div>
        <div class="page-subtitle">Manage your account preferences, notification channels, and delivery instructions</div>
      </div>
    </div>
    <div style="padding: 0 20px 40px; display:flex; flex-direction:column; gap:24px; max-width:800px; margin:0 auto;">
      
      <!-- Account Settings Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Account Defaults</h3>
        </div>
        <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; gap:16px;">
            <div class="input-group" style="flex:1; flex-direction:column; align-items:flex-start; gap:6px;">
              <label style="font-size:13px; font-weight:500; color:var(--text-2);">Timezone</label>
              <select class="select" style="width:100%">
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div class="input-group" style="flex:1; flex-direction:column; align-items:flex-start; gap:6px;">
              <label style="font-size:13px; font-weight:500; color:var(--text-2);">Language Preference</label>
              <select class="select" style="width:100%">
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Preferences Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Notification Channels</h3>
          <div style="font-size:12px; color:var(--text-3); margin-top:4px;">Choose how you want to be alerted.</div>
        </div>
        <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">Email Alerts</div>
              <div style="font-size:12px; color:var(--text-3);">Receive shipment tracking updates via email.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">SMS Text Messages</div>
              <div style="font-size:12px; color:var(--text-3);">Standard carrier texting rates may apply.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">Push Notifications</div>
              <div style="font-size:12px; color:var(--text-3);">Get alerts delivered directly to your device screen.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:16px; margin-top:8px;">
            <div>
              <div style="font-size:14px; font-weight:500;">Quiet Hours</div>
              <div style="font-size:12px; color:var(--text-3);">Silence non-urgent alerts between 10 PM and 7 AM.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Milestone Alerts Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Milestone Alerts</h3>
          <div style="font-size:12px; color:var(--text-3); margin-top:4px;">Select which tracking events should trigger a notification.</div>
        </div>
        <div style="padding:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Picked Up
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Out for Delivery
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Delivered
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Exceptions (🚨 Critical)
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Delayed
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" class="checkbox-custom"/> Customs Holds
          </label>
        </div>
      </div>

      <!-- Delivery Instructions -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Default Delivery Instructions</h3>
        </div>
        <div style="padding:20px;">
          <div class="input-group" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <label style="font-size:13px; font-weight:500; color:var(--text-2);">Where should carriers leave your packages?</label>
            <textarea class="input" style="width:100%; min-height:80px; resize:vertical; padding:12px;" placeholder="e.g. Please leave packages on the back porch behind the planter..."></textarea>
          </div>
          <div style="margin-top:16px; display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="gate-code" class="checkbox-custom"/>
            <label for="gate-code" style="font-size:14px; cursor:pointer;">My property has a gate code</label>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button class="btn btn-primary" style="padding:10px 24px; font-size:14px;" onclick="const btn=this; btn.textContent='Saving...'; setTimeout(() => { btn.textContent='Save Settings'; btn.style.background='var(--clr-delivered)'; setTimeout(()=> {btn.style.background='';}, 2000)}, 800)">Save Settings</button>
      </div>
    </div>
  `;
}
