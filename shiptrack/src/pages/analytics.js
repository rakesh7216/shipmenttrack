// Analytics Dashboard — Chart.js charts for OTP, delay causes, carrier SLA, volume
import { api } from '../api.js';

const CARRIER_COLORS = {
  fedex: '#4D148C', ups: '#351C15', dhl: '#FFCC00', maersk: '#003DA5', iot: '#00C7B7',
};

async function loadChartjs() {
  if (window.Chart) return window.Chart;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    s.onload = () => resolve(window.Chart);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const GRID_COLOR = 'rgba(255,255,255,0.06)';
const BASE_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#a0aec0', boxWidth: 12 } } },
};

export async function renderAnalytics(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Analytics</div>
        <div class="page-subtitle">On-time performance, delay trends, and carrier SLA compliance</div>
      </div>
    </div>
    <div class="loading-overlay" id="analytics-loader"><div class="spinner"></div><span>Loading analytics…</span></div>
    <div id="analytics-content" style="display:none"></div>`;

  try {
    const [Chart, summary, sla, volume] = await Promise.all([
      loadChartjs(),
      api.analyticsSummary(),
      api.carrierSla(),
      api.volume(),
    ]);

    Chart.defaults.color = '#a0aec0';

    document.getElementById('analytics-loader').style.display = 'none';
    const content = document.getElementById('analytics-content');
    content.style.display = 'block';

    content.innerHTML = `
      <!-- KPI Stats -->
      <div class="stats-grid">
        <div class="stat-card animate-in">
          <span class="stat-icon">🎯</span>
          <div class="stat-label">On-Time Rate</div>
          <div class="stat-value" style="color:${summary.otpRate >= 90 ? 'var(--clr-delivered)' : 'var(--clr-delayed)'}">${summary.otpRate}%</div>
          <div class="stat-change">Target: 95%</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-1">
          <span class="stat-icon">🚚</span>
          <div class="stat-label">Total Shipments</div>
          <div class="stat-value">${summary.total}</div>
          <div class="stat-change">${summary.inTransit} in transit</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-2">
          <span class="stat-icon">⚠️</span>
          <div class="stat-label">Delayed</div>
          <div class="stat-value" style="color:var(--clr-delayed)">${summary.delayed}</div>
          <div class="stat-change">Avg +${summary.avgDelayMinutes}min delay</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-3">
          <span class="stat-icon">🚨</span>
          <div class="stat-label">Exceptions</div>
          <div class="stat-value" style="color:var(--clr-exception)">${summary.exceptions}</div>
          <div class="stat-change">${summary.customs} in customs</div>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- OTP Donut -->
        <div class="card animate-in">
          <div class="card-header"><div class="card-title">On-Time Performance (OTP)</div></div>
          <div class="chart-wrapper"><canvas id="otp-chart"></canvas></div>
        </div>

        <!-- Delay Causes -->
        <div class="card animate-in animate-in-delay-1">
          <div class="card-header"><div class="card-title">Top Delay Causes</div></div>
          <div class="chart-wrapper"><canvas id="delay-chart"></canvas></div>
        </div>

        <!-- Volume Trend -->
        <div class="card analytics-full animate-in animate-in-delay-2">
          <div class="card-header"><div class="card-title">Daily Volume — Last 14 Days</div></div>
          <div class="chart-wrapper" style="height:220px"><canvas id="volume-chart"></canvas></div>
        </div>

        <!-- Carrier SLA Table -->
        <div class="card analytics-full animate-in animate-in-delay-3">
          <div class="card-header"><div class="card-title">Carrier SLA Compliance</div></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Carrier</th><th>Shipments</th><th>On Time</th>
                  <th>Delayed</th><th>SLA Target</th><th>Compliance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${sla.map(c => `
                  <tr>
                    <td><strong>${c.logo} ${c.name}</strong></td>
                    <td>${c.total}</td>
                    <td style="color:var(--clr-delivered)">${c.onTime}</td>
                    <td style="color:var(--clr-delayed)">${c.delayed}</td>
                    <td>${c.slaTarget}%</td>
                    <td>
                      <div class="sla-bar-wrapper">
                        <div class="sla-bar">
                          <div class="sla-fill ${c.slaStatus}" style="width:${c.compliance}%"></div>
                        </div>
                        <span style="min-width:38px;font-weight:600;font-size:13px">${c.compliance}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge ${c.slaStatus === 'met' ? 'delivered' : 'exception'}">
                        <span class="dot"></span>${c.slaStatus === 'met' ? 'Met' : 'Breached'}
                      </span>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    // ── Charts ─────────────────────────────────────────────────────────────
    // OTP Donut
    new Chart(document.getElementById('otp-chart'), {
      type: 'doughnut',
      data: {
        labels: ['On Time', 'Delayed', 'Exception', 'Customs'],
        datasets: [{
          data: [summary.onTime, summary.delayed, summary.exceptions, summary.customs],
          backgroundColor: ['#10b981','#fbbf24','#f87171','#a78bfa'],
          borderWidth: 2, borderColor: '#0d1117',
        }],
      },
      options: {
        ...BASE_OPTS, cutout: '72%',
        plugins: {
          ...BASE_OPTS.plugins,
          legend: { position: 'right', labels: { color: '#a0aec0', padding: 16, boxWidth: 12 } },
        },
      },
    });

    // Delay Causes Bar
    new Chart(document.getElementById('delay-chart'), {
      type: 'bar',
      data: {
        labels: summary.delayCauses.map(c => c.cause),
        datasets: [{
          label: 'Impact (%)',
          data: summary.delayCauses.map(c => c.percentage),
          backgroundColor: ['#fbbf24','#a78bfa','#60a5fa','#f87171','#34d399'],
          borderRadius: 8, borderSkipped: false,
        }],
      },
      options: {
        ...BASE_OPTS, indexAxis: 'y',
        plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: '#637085' } },
          y: { grid: { display: false }, ticks: { color: '#a0aec0' } },
        },
      },
    });

    // Volume Line
    new Chart(document.getElementById('volume-chart'), {
      type: 'line',
      data: {
        labels: volume.map(d => d.date.slice(5)),
        datasets: [
          {
            label: 'Total', data: volume.map(d => d.shipments),
            borderColor: '#5b6ef5', backgroundColor: 'rgba(91,110,245,0.1)',
            fill: true, tension: 0.4, pointRadius: 3,
          },
          {
            label: 'Delivered', data: volume.map(d => d.delivered),
            borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',
            fill: true, tension: 0.4, pointRadius: 3,
          },
          {
            label: 'Delayed', data: volume.map(d => d.delayed),
            borderColor: '#fbbf24', tension: 0.4, pointRadius: 3,
          },
        ],
      },
      options: {
        ...BASE_OPTS,
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: '#637085' } },
          y: { grid: { color: GRID_COLOR }, ticks: { color: '#637085' } },
        },
      },
    });

  } catch (e) {
    document.getElementById('analytics-loader').innerHTML =
      `<span style="color:var(--clr-exception)">❌ ${e.message}</span>`;
  }
}
