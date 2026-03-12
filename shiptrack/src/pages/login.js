// Login Page
import { api } from '../api.js';
import { setUser } from '../app.js';

const DEMO_ACCOUNTS = [
  { email: 'customer@demo.com', password: 'demo', role: 'customer', icon: '📦', name: 'Customer', desc: 'Track your orders' },
  { email: 'shipper@demo.com',  password: 'demo', role: 'shipper',  icon: '🏭', name: 'Shipper',  desc: 'Manage all shipments' },
  { email: 'ops@demo.com',      password: 'demo', role: 'ops',      icon: '🎛️', name: 'Ops Team', desc: 'Full platform access' },
];

export async function renderLogin(container) {
  container.innerHTML = `
    <div class="login-page">
      <div class="login-bg-glow"></div>
      <div class="login-bg-glow-2"></div>
      <div class="login-card animate-in">
        <div class="login-logo">
          <span class="login-logo-icon">📦</span>
          <span class="login-logo-text">ShipTrack</span>
        </div>
        <p class="login-subtitle">Real-time shipment visibility platform. Sign in to access live tracking, alerts, and analytics.</p>

        <div class="form-group">
          <label class="form-label">Select your role</label>
          <div class="role-grid">
            ${DEMO_ACCOUNTS.map((a, i) => `
              <div class="role-btn ${i === 0 ? 'selected' : ''}" data-idx="${i}">
                <div class="role-btn-icon">${a.icon}</div>
                <div class="role-btn-name">${a.name}</div>
                <div class="role-btn-desc">${a.desc}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="login-email" class="input" type="email" value="${DEMO_ACCOUNTS[0].email}" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input id="login-password" class="input" type="password" value="demo" />
        </div>

        <div id="login-error" class="login-error" style="display:none"></div>

        <button id="login-btn" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px">
          <span>Sign In</span> <span>→</span>
        </button>

        <p style="text-align:center;font-size:12px;color:var(--text-3);margin-top:16px">
          All credentials are pre-filled for demo purposes
        </p>
      </div>
    </div>`;

  let selectedIdx = 0;

  container.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedIdx = +btn.dataset.idx;
      const acc = DEMO_ACCOUNTS[selectedIdx];
      document.getElementById('login-email').value = acc.email;
      document.getElementById('login-password').value = acc.password;
    });
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>';

    try {
      const { token, user } = await api.login(email, password);
      setUser(user, token);
      window.navigate('#/shipments');
      location.reload(); // refresh to re-init WS with auth
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span> <span>→</span>';
    }
  });
}
