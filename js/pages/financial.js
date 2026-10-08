/* ============================================
   CRM Contábil — Financial Page
   ============================================ */

var FinancialPage = (() => {
  let currentFilter = 'all'; // all, pending, paid, overdue

  function render() {
    const invoices = Store.getCollection('invoices');
    
    // Calculate summaries
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalReceivable = 0;
    let totalReceived = 0;
    let totalOverdue = 0;

    invoices.forEach(inv => {
      const d = new Date(inv.dueDate + 'T00:00:00');
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      
      if (isCurrentMonth && inv.status !== 'cancelled') {
        totalReceivable += inv.amount;
        if (inv.status === 'paid') totalReceived += inv.amount;
      }
      if (inv.status === 'overdue') {
        totalOverdue += inv.amount;
      }
    });

    const pendingAmount = totalReceivable - totalReceived;

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Financeiro</h2>
          <p>Gestão de honorários e faturamento</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="FinancialPage.generateInvoices()">
            ${Components.Icons.refresh} Gerar Faturas do Mês
          </button>
          <button class="btn btn-primary btn-sm" onclick="FinancialPage.openForm()">
            ${Components.Icons.plus} Nova Fatura
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="financial-summary stagger-children">
        <div class="card card-hover">
          <div class="text-sm font-semibold text-secondary mb-xs">A Receber (Mês)</div>
          <div class="text-2xl font-bold text-primary">${Utils.formatCurrency(totalReceivable)}</div>
        </div>
        <div class="card card-hover">
          <div class="text-sm font-semibold text-secondary mb-xs">Recebido (Mês)</div>
          <div class="text-2xl font-bold text-success">${Utils.formatCurrency(totalReceived)}</div>
        </div>
        <div class="card card-hover">
          <div class="text-sm font-semibold text-secondary mb-xs">Pendente (Mês)</div>
          <div class="text-2xl font-bold text-warning">${Utils.formatCurrency(pendingAmount)}</div>
        </div>
        <div class="card card-hover" style="${totalOverdue > 0 ? 'border-color: var(--accent-danger-soft)' : ''}">
          <div class="text-sm font-semibold text-secondary mb-xs">Inadimplência Total</div>
          <div class="text-2xl font-bold ${totalOverdue > 0 ? 'text-danger' : 'text-primary'}">${Utils.formatCurrency(totalOverdue)}</div>
        </div>
      </div>

      <div class="invoice-status-bar">
        <div class="invoice-status-item ${currentFilter === 'all' ? 'active' : ''}" onclick="FinancialPage.setFilter('all')">Todas</div>
        <div class="invoice-status-item ${currentFilter === 'pending' ? 'active' : ''}" onclick="FinancialPage.setFilter('pending')">Pendentes</div>
        <div class="invoice-status-item ${currentFilter === 'overdue' ? 'active' : ''}" onclick="FinancialPage.setFilter('overdue')">Vencidas</div>
        <div class="invoice-status-item ${currentFilter === 'paid' ? 'active' : ''}" onclick="FinancialPage.setFilter('paid')">Pagas</div>
      </div>

      ${_renderTable()}
    `;
  }

  function setFilter(filter) {
    currentFilter = filter;
    App.renderCurrentPage();
  }

  function _renderTable() {
    let invoices = Store.getCollection('invoices');
    if (currentFilter !== 'all') {
      invoices = invoices.filter(i => i.status === currentFilter);
    }

    // Sort by due date (newest first)
    invoices.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    const columns = [
      {
        label: 'Fatura', key: 'id', width: '80px',
        render: (i) => `<span class="text-secondary text-xs">#${i.id.substring(0,6).toUpperCase()}</span>`
      },
      {
        label: 'Cliente', key: 'client',
        render: (i) => {
          const c = Store.getById('clients', i.clientId);
          const name = c ? (c.nomeFantasia || c.razaoSocial || c.nome) : 'Cliente Removido';
          return `<div class="font-semibold">${name}</div><div class="text-xs text-secondary">${i.description}</div>`;
        }
      },
      {
        label: 'Valor', key: 'amount', width: '130px',
        render: (i) => `<span class="font-semibold">${Utils.formatCurrency(i.amount)}</span>`
      },
      {
        label: 'Vencimento', key: 'dueDate', width: '120px',
        render: (i) => {
          const d = Utils.formatDate(i.dueDate);
          return i.status === 'overdue' ? `<span class="text-danger font-medium">${d}</span>` : d;
        }
      },
      {
        label: 'Status', key: 'status', width: '110px',
        render: (i) => {
          const st = Utils.INVOICE_STATUS_MAP[i.status];
          return st ? `<span class="badge ${st.badge}">${st.label}</span>` : i.status;
        }
      },
      {
        label: 'Ações', key: 'actions', width: '120px',
        render: (i) => {
          let actions = '';
          if (i.status === 'pending' || i.status === 'overdue') {
            actions += `<button class="btn btn-ghost btn-icon btn-sm text-success" onclick="FinancialPage.markAsPaid('${i.id}')" data-tooltip="Marcar como Pago">${Components.Icons.check}</button>`;
          }
          actions += `
            <button class="btn btn-ghost btn-icon btn-sm" onclick="FinancialPage.openForm('${i.id}')" data-tooltip="Editar">${Components.Icons.edit}</button>
            <button class="btn btn-ghost btn-icon btn-sm text-danger" onclick="FinancialPage.deleteInvoice('${i.id}')" data-tooltip="Excluir">${Components.Icons.trash}</button>
          `;
          return `<div class="flex gap-xs">${actions}</div>`;
        }
      }
    ];

    return Components.dataTable({ columns, data: invoices, perPage: 12 });
  }

  function markAsPaid(id) {
    Store.update('invoices', id, { status: 'paid', paidDate: Utils.formatDateISO(new Date()) });
    Components.toast('Fatura marcada como paga!', 'success');
    App.renderCurrentPage();
  }

  function openForm(id = null) {
    const inv = id ? Store.getById('invoices', id) : null;
    const isEdit = !!inv;
    const clients = Store.getCollection('clients').filter(c => c.status === 'active');

    const content = `
      <form id="invoice-form">
        <div class="form-group">
          <label class="form-label">Cliente *</label>
          <select class="form-select" id="inv-client">
            <option value="">Selecione...</option>
            ${clients.map(c => `<option value="${c.id}" ${inv?.clientId === c.id ? 'selected' : ''}>${c.nomeFantasia || c.razaoSocial || c.nome}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Descrição *</label>
          <input class="form-input" id="inv-desc" placeholder="Ex: Honorários contábeis - Mês 05/2026" value="${inv?.description || 'Honorários contábeis - ' + Utils.getMonthName(new Date().getMonth()) + '/' + new Date().getFullYear()}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Valor (R$) *</label>
            <input class="form-input" id="inv-amount" type="number" step="0.01" value="${inv?.amount || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Data de Vencimento *</label>
            <input class="form-input" type="date" id="inv-due" value="${inv?.dueDate || ''}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="inv-status">
              ${Object.entries(Utils.INVOICE_STATUS_MAP).map(([val, info]) => `<option value="${val}" ${inv?.status === val ? 'selected' : (val==='pending' && !inv ? 'selected' : '')}>${info.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data de Pagamento</label>
            <input class="form-input" type="date" id="inv-paid" value="${inv?.paidDate || ''}">
          </div>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="FinancialPage.saveInvoice('${id || ''}')">${isEdit ? 'Salvar Alterações' : 'Criar Fatura'}</button>
    `;

    Components.openModal({ title: isEdit ? 'Editar Fatura' : 'Nova Fatura', content, footer });

    // Auto-fill amount based on client if new
    if (!isEdit) {
      document.getElementById('inv-client').addEventListener('change', (e) => {
        const c = Store.getById('clients', e.target.value);
        if (c && c.honorarios) {
          document.getElementById('inv-amount').value = c.honorarios;
        }
      });
    }
  }

  function saveInvoice(id) {
    const clientId = document.getElementById('inv-client').value;
    const amount = parseFloat(document.getElementById('inv-amount').value);
    
    if (!clientId || !amount) {
      Components.toast('Preencha o cliente e o valor', 'warning');
      return;
    }

    const data = {
      clientId,
      description: document.getElementById('inv-desc').value,
      amount,
      dueDate: document.getElementById('inv-due').value,
      status: document.getElementById('inv-status').value,
      paidDate: document.getElementById('inv-paid').value || null,
    };

    if (id) {
      Store.update('invoices', id, data);
      Components.toast('Fatura atualizada', 'success');
    } else {
      data.createdAt = Utils.formatDateISO(new Date());
      Store.add('invoices', data);
      Components.toast('Fatura criada', 'success');
    }

    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteInvoice(id) {
    const confirmed = await Components.confirm({
      title: 'Excluir Fatura',
      message: 'Tem certeza que deseja excluir esta fatura?'
    });

    if (confirmed) {
      Store.remove('invoices', id);
      Components.toast('Fatura excluída', 'success');
      App.renderCurrentPage();
    }
  }

  async function generateInvoices() {
    const confirmed = await Components.confirm({
      title: 'Gerar Faturas do Mês',
      message: 'Esta ação irá criar faturas para todos os clientes ativos com honorários cadastrados, com vencimento para o dia 10 deste mês. Deseja continuar?',
      confirmText: 'Gerar Faturas',
      type: 'primary'
    });

    if (confirmed) {
      const clients = Store.getCollection('clients').filter(c => c.status === 'active' && c.honorarios > 0);
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const desc = `Honorários contábeis - ${Utils.getMonthName(m)}/${y}`;
      const due = Utils.formatDateISO(new Date(y, m, 10));
      const created = Utils.formatDateISO(now);

      let count = 0;
      clients.forEach(c => {
        Store.add('invoices', {
          clientId: c.id,
          description: desc,
          amount: c.honorarios,
          status: 'pending',
          dueDate: due,
          paidDate: null,
          createdAt: created
        });
        count++;
      });

      Components.toast(`${count} faturas geradas com sucesso!`, 'success');
      App.renderCurrentPage();
    }
  }

  function afterRender() {}
  function onLeave() { currentFilter = 'all'; }

  return { render, afterRender, onLeave, setFilter, markAsPaid, openForm, saveInvoice, deleteInvoice, generateInvoices };
})();
