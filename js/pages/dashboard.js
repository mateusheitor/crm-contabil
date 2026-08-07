/* ============================================
   CRM Contábil — Dashboard Page
   ============================================ */

var DashboardPage = (() => {
  function render() {
    const clients = Store.getCollection('clients');
    const activeClients = clients.filter(c => c.status === 'active');
    const invoices = Store.getCollection('invoices');
    const services = Store.getCollection('services');
    const activities = Store.getCollection('activities');
    const events = Store.getCollection('events');

    // KPIs
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.createdAt + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthRevenue = monthInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pendingTasks = services.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
    const overdueTasks = services.filter(s => s.status === 'overdue').length;

    // Trend calculations (simple - compare with previous month)
    const prevMonthInvoices = invoices.filter(inv => {
      const d = new Date(inv.createdAt + 'T00:00:00');
      return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
    });
    const prevRevenue = prevMonthInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const revenueTrend = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : 0;

    // Upcoming obligations
    const upcoming = events
      .map(e => {
        const client = e.clientId ? Store.getById('clients', e.clientId) : null;
        return { ...e, clientName: client ? (client.nomeFantasia || client.razaoSocial || client.nome) : 'Todos os clientes' };
      })
      .filter(e => Utils.daysUntil(e.date) >= 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Dashboard</h2>
          <p>Visão geral do escritório</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="DashboardPage.refresh()">
            ${Components.Icons.refresh} Atualizar
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="dashboard-grid stagger-children">
        ${_kpiCard('Clientes Ativos', activeClients.length, 'clients', 'primary', 'accent-primary', '+2', 'up')}
        ${_kpiCard('Receita Mensal', Utils.formatCurrency(monthRevenue), 'financial', 'success', 'accent-success', `${revenueTrend > 0 ? '+' : ''}${revenueTrend}%`, revenueTrend >= 0 ? 'up' : 'down')}
        ${_kpiCard('Tarefas Pendentes', pendingTasks, 'services', 'warning', 'accent-warning', '', '')}
        ${_kpiCard('Serviços Atrasados', overdueTasks, 'clock', 'danger', 'accent-danger', '', '', overdueTasks > 0)}
      </div>

      <!-- Charts -->
      <div class="dashboard-charts">
        <div class="chart-card">
          <div class="chart-card-header">
            <h3>Receita dos Últimos 6 Meses</h3>
          </div>
          <div class="chart-canvas-container">
            <canvas id="revenue-chart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <h3>Clientes por Regime</h3>
          </div>
          <div class="chart-canvas-container">
            <canvas id="regime-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="dashboard-bottom">
        <div class="chart-card">
          <div class="chart-card-header">
            <h3>Atividades Recentes</h3>
          </div>
          <div class="activity-list">
            ${activities.map(act => `
              <div class="activity-item">
                <div class="activity-dot ${act.type}"></div>
                <div class="activity-content">
                  <p>${act.text}</p>
                  <span>${Utils.timeAgo(act.time)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <h3>Próximas Obrigações</h3>
          </div>
          <div class="upcoming-list">
            ${upcoming.map(evt => {
              const d = new Date(evt.date + 'T00:00:00');
              const typeInfo = Utils.EVENT_TYPE_MAP[evt.type] || {};
              return `
                <div class="upcoming-item">
                  <div class="upcoming-date">
                    <div class="day">${d.getDate()}</div>
                    <div class="month">${Utils.getMonthShort(d.getMonth())}</div>
                  </div>
                  <div class="upcoming-info">
                    <div class="title">${evt.title}</div>
                    <div class="client">${evt.clientName}</div>
                  </div>
                  <span class="badge badge-${_eventBadge(evt.type)}">${typeInfo.label || evt.type}</span>
                </div>
              `;
            }).join('')}
            ${upcoming.length === 0 ? '<p class="text-sm text-secondary p-md">Nenhuma obrigação próxima</p>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  function _kpiCard(label, value, iconName, colorClass, accentClass, trend, trendDir, urgent = false) {
    const trendHtml = trend ? `
      <div class="kpi-trend ${trendDir}">
        ${trendDir === 'up' ? Components.Icons.arrowUp : Components.Icons.arrowDown}
        ${trend}
      </div>
    ` : '';

    return `
      <div class="kpi-card ${accentClass}">
        <div class="kpi-header">
          <div class="kpi-icon ${colorClass}">${Components.Icons[iconName] || ''}</div>
          ${trendHtml}
        </div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
      </div>
    `;
  }

  function _eventBadge(type) {
    const map = { fiscal: 'danger', meeting: 'info', internal: 'success', deadline: 'warning' };
    return map[type] || 'neutral';
  }

  function afterRender() {
    _drawRevenueChart();
    _drawRegimeChart();
  }

  function _drawRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const W = rect.width;
    const H = rect.height;

    const invoices = Store.getCollection('invoices');
    const now = new Date();

    // Get last 6 months data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const revenue = invoices
        .filter(inv => {
          const id = new Date(inv.createdAt + 'T00:00:00');
          return id.getMonth() === m && id.getFullYear() === y && inv.status === 'paid';
        })
        .reduce((s, inv) => s + inv.amount, 0);
      months.push({ label: Utils.getMonthShort(m), revenue });
    }

    const maxVal = Math.max(...months.map(m => m.revenue), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;
    const barWidth = chartW / months.length * 0.6;
    const barGap = chartW / months.length;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#8888aa';
      ctx.font = '11px Inter';
      ctx.textAlign = 'right';
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0), padding.left - 8, y + 4);
    }

    // Bars with gradient
    months.forEach((m, i) => {
      const barH = (m.revenue / maxVal) * chartH;
      const x = padding.left + i * barGap + (barGap - barWidth) / 2;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, '#6c63ff');
      gradient.addColorStop(1, '#4a45b3');

      ctx.beginPath();
      const radius = 6;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Glow
      ctx.shadowColor = 'rgba(108, 99, 255, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Month label
      ctx.fillStyle = '#8888aa';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + barWidth / 2, H - padding.bottom + 20);
    });
  }

  function _drawRegimeChart() {
    const canvas = document.getElementById('regime-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const W = rect.width;
    const H = rect.height;

    const clients = Store.getCollection('clients').filter(c => c.status === 'active' && c.type !== 'PF');
    const regimes = {};
    clients.forEach(c => {
      const r = c.regimeTributario || 'Outro';
      regimes[r] = (regimes[r] || 0) + 1;
    });

    const colors = {
      'Simples Nacional': '#6c63ff',
      'Lucro Presumido': '#ffa726',
      'Lucro Real': '#ef5350',
      'MEI': '#00d4aa'
    };

    const entries = Object.entries(regimes);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    const centerX = W / 2;
    const centerY = H / 2 - 10;
    const radius = Math.min(W, H) / 2 - 40;

    let startAngle = -Math.PI / 2;

    entries.forEach(([label, count]) => {
      const sliceAngle = (count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[label] || '#8888aa';
      ctx.fill();

      // Label
      const midAngle = startAngle + sliceAngle / 2;
      const labelR = radius * 0.65;
      const lx = centerX + Math.cos(midAngle) * labelR;
      const ly = centerY + Math.sin(midAngle) * labelR;

      ctx.fillStyle = 'white';
      ctx.font = 'bold 13px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (sliceAngle > 0.3) {
        ctx.fillText(count.toString(), lx, ly);
      }

      startAngle = endAngle;
    });

    // Inner circle (donut)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#12121f';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 6);
    ctx.fillStyle = '#8888aa';
    ctx.font = '11px Inter';
    ctx.fillText('clientes', centerX, centerY + 14);

    // Legend
    const legendY = H - 20;
    const legendW = entries.length * 120;
    let lx = (W - legendW) / 2;

    entries.forEach(([label]) => {
      ctx.fillStyle = colors[label] || '#8888aa';
      ctx.beginPath();
      ctx.arc(lx + 6, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8888aa';
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      const shortLabel = Utils.REGIME_MAP[label]?.short || label;
      ctx.fillText(shortLabel, lx + 16, legendY + 4);
      lx += 80;
    });
  }

  function refresh() {
    App.navigate('dashboard');
  }

  return { render, afterRender, refresh };
})();
