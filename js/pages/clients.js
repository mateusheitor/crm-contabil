/* ============================================
   CRM Contábil — Clients Page
   ============================================ */

var ClientsPage = (() => {
  let currentPage = 1;
  let filters = { search: '', type: '', status: '', regime: '' };
  let viewMode = 'list'; // 'list' or 'detail'
  let selectedClientId = null;
  let detailTab = 'info';

  function render() {
    if (viewMode === 'detail' && selectedClientId) {
      return renderDetail();
    }
    return renderList();
  }

  function renderList() {
    const clients = getFilteredClients();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Clientes</h2>
          <p>${Store.getCollection('clients').length} clientes cadastrados</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="ClientsPage.copyRegisterLink()" data-tooltip="Copiar link para auto-cadastro">
            ${Components.Icons.user} Link de Cadastro
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ClientsPage.exportCSV()">
            ${Components.Icons.download} Exportar
          </button>
          <button class="btn btn-primary btn-sm" onclick="ClientsPage.openForm()">
            ${Components.Icons.plus} Novo Cliente
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-search">
          ${Components.Icons.search}
          <input type="text" placeholder="Buscar por nome, CNPJ, CPF..." 
            value="${filters.search}" 
            oninput="ClientsPage.onFilter('search', this.value)"
            id="client-search-input">
        </div>
        <select class="form-select" onchange="ClientsPage.onFilter('type', this.value)" style="width:140px">
          <option value="">Todos os tipos</option>
          <option value="PJ" ${filters.type === 'PJ' ? 'selected' : ''}>Pessoa Jurídica</option>
          <option value="PF" ${filters.type === 'PF' ? 'selected' : ''}>Pessoa Física</option>
          <option value="MEI" ${filters.type === 'MEI' ? 'selected' : ''}>MEI</option>
        </select>
        <select class="form-select" onchange="ClientsPage.onFilter('status', this.value)" style="width:140px">
          <option value="">Todos os status</option>
          <option value="active" ${filters.status === 'active' ? 'selected' : ''}>Ativos</option>
          <option value="inactive" ${filters.status === 'inactive' ? 'selected' : ''}>Inativos</option>
        </select>
        <select class="form-select" onchange="ClientsPage.onFilter('regime', this.value)" style="width:180px">
          <option value="">Todos os regimes</option>
          <option value="Simples Nacional" ${filters.regime === 'Simples Nacional' ? 'selected' : ''}>Simples Nacional</option>
          <option value="Lucro Presumido" ${filters.regime === 'Lucro Presumido' ? 'selected' : ''}>Lucro Presumido</option>
          <option value="Lucro Real" ${filters.regime === 'Lucro Real' ? 'selected' : ''}>Lucro Real</option>
          <option value="MEI" ${filters.regime === 'MEI' ? 'selected' : ''}>MEI</option>
        </select>
      </div>

      <!-- Table -->
      ${_renderTable(clients)}
    `;
  }

  function getFilteredClients() {
    return Store.query('clients', c => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const searchable = [c.razaoSocial, c.nomeFantasia, c.nome, c.cnpj, c.cpf, c.email].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(s)) return false;
      }
      if (filters.type) {
        if (filters.type === 'MEI' && c.regimeTributario !== 'MEI') return false;
        if (filters.type !== 'MEI' && c.type !== filters.type) return false;
      }
      if (filters.status && c.status !== filters.status) return false;
      if (filters.regime && c.regimeTributario !== filters.regime) return false;
      return true;
    });
  }

  function _renderTable(clients) {
    const columns = [
      {
        label: 'Cliente', key: 'name',
        render: (c) => {
          const name = c.nomeFantasia || c.razaoSocial || c.nome;
          const sub = c.type === 'PF' ? (c.cpf || '') : (c.cnpj || '');
          return `
            <div class="flex items-center gap-md">
              ${Components.avatar(name)}
              <div>
                <div class="font-semibold text-primary">${name}</div>
                <div class="text-xs text-secondary">${sub}</div>
              </div>
            </div>
          `;
        }
      },
      {
        label: 'Tipo', key: 'type', width: '100px',
        render: (c) => {
          const regime = c.regimeTributario || c.type;
          const info = Utils.REGIME_MAP[regime] || { badge: 'badge-neutral', short: c.type };
          return `<span class="badge ${info.badge}">${info.short}</span>`;
        }
      },
      {
        label: 'Responsável', key: 'responsible', width: '150px',
        render: (c) => {
          const emp = Store.getById('employees', c.responsibleId);
          return emp ? `
            <div class="flex items-center gap-sm">
              ${Components.avatar(emp.name, 'sm', emp.color)}
              <span class="text-sm">${emp.name.split(' ')[0]}</span>
            </div>
          ` : '<span class="text-secondary text-sm">—</span>';
        }
      },
      {
        label: 'Honorários', key: 'honorarios', width: '130px',
        render: (c) => `<span class="font-semibold">${Utils.formatCurrency(c.honorarios)}</span>`
      },
      {
        label: 'Status', key: 'status', width: '100px',
        render: (c) => c.status === 'active'
          ? '<span class="badge badge-success"><span class="badge-dot"></span>Ativo</span>'
          : '<span class="badge badge-neutral">Inativo</span>'
      },
      {
        label: 'Ações', key: 'actions', width: '120px',
        render: (c) => `
          <div class="flex gap-xs">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="ClientsPage.viewDetail('${c.id}')" data-tooltip="Ver detalhes">
              ${Components.Icons.eye}
            </button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="ClientsPage.openForm('${c.id}')" data-tooltip="Editar">
              ${Components.Icons.edit}
            </button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="ClientsPage.deleteClient('${c.id}')" data-tooltip="Excluir">
              ${Components.Icons.trash}
            </button>
          </div>
        `
      }
    ];

    return Components.dataTable({ columns, data: clients, page: currentPage, perPage: 8, emptyMessage: 'Nenhum cliente encontrado' });
  }

  // ---- Detail View ----
  function renderDetail() {
    const c = Store.getById('clients', selectedClientId);
    if (!c) { viewMode = 'list'; return renderList(); }

    const name = c.nomeFantasia || c.razaoSocial || c.nome;
    const emp = Store.getById('employees', c.responsibleId);
    const services = Store.query('services', s => s.clientId === c.id);
    const invoices = Store.query('invoices', i => i.clientId === c.id);
    const documents = Store.query('documents', d => d.clientId === c.id);

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div class="flex items-center gap-md mb-sm">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="ClientsPage.backToList()">
              ${Components.Icons.chevronLeft}
            </button>
            <h2>${name}</h2>
            ${c.status === 'active'
              ? '<span class="badge badge-success"><span class="badge-dot"></span>Ativo</span>'
              : '<span class="badge badge-neutral">Inativo</span>'}
          </div>
          <p>${c.type === 'PF' ? c.cpf : c.cnpj}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="ClientsPage.openForm('${c.id}')">
            ${Components.Icons.edit} Editar
          </button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${detailTab === 'info' ? 'active' : ''}" onclick="ClientsPage.setTab('info')">Informações</div>
        <div class="tab ${detailTab === 'services' ? 'active' : ''}" onclick="ClientsPage.setTab('services')">Serviços (${services.length})</div>
        <div class="tab ${detailTab === 'financial' ? 'active' : ''}" onclick="ClientsPage.setTab('financial')">Financeiro (${invoices.length})</div>
        <div class="tab ${detailTab === 'documents' ? 'active' : ''}" onclick="ClientsPage.setTab('documents')">Documentos (${documents.length})</div>
      </div>

      ${detailTab === 'info' ? _renderInfoTab(c, emp) : ''}
      ${detailTab === 'services' ? _renderServicesTab(services) : ''}
      ${detailTab === 'financial' ? _renderFinancialTab(invoices) : ''}
      ${detailTab === 'documents' ? _renderDocumentsTab(documents) : ''}
    `;
  }

  function _renderInfoTab(c, emp) {
    const isPJ = c.type !== 'PF';
    return `
      <div class="client-detail-grid">
        <div class="client-info-card">
          <div class="client-info-header">
            <div class="client-avatar-large" style="background: ${Utils.getAvatarColor(c.razaoSocial || c.nome)}">
              ${Utils.getInitials(c.nomeFantasia || c.razaoSocial || c.nome)}
            </div>
            <div>
              <h3 class="text-lg font-bold">${c.nomeFantasia || c.razaoSocial || c.nome}</h3>
              ${isPJ ? `<p class="text-sm text-secondary">${c.razaoSocial || ''}</p>` : ''}
            </div>
          </div>
          ${isPJ ? `
            <div class="client-info-field"><label>CNPJ</label><p>${c.cnpj}</p></div>
            <div class="client-info-field"><label>Regime Tributário</label><p>${Components.badge(c.regimeTributario, Utils.REGIME_MAP[c.regimeTributario]?.badge?.replace('badge-', '') || 'neutral')}</p></div>
            <div class="client-info-field"><label>CNAE</label><p>${c.cnae || '—'}</p></div>
            ${c.inscricaoEstadual ? `<div class="client-info-field"><label>Inscrição Estadual</label><p>${c.inscricaoEstadual}</p></div>` : ''}
            ${c.inscricaoMunicipal ? `<div class="client-info-field"><label>Inscrição Municipal</label><p>${c.inscricaoMunicipal}</p></div>` : ''}
<<<<<<< HEAD
            ${c.socios ? `<div class="client-info-field mt-sm"><label>Quadro Societário</label><p style="white-space: pre-wrap;" class="text-sm">${c.socios}</p></div>` : ''}
=======
>>>>>>> 873a5fafbd1bb05de4461b7f765cfe8a45b3ff9b
          ` : `
            <div class="client-info-field"><label>CPF</label><p>${c.cpf}</p></div>
          `}
          <div class="client-info-field"><label>Honorários</label><p class="text-lg font-bold text-accent">${Utils.formatCurrency(c.honorarios)}</p></div>
        </div>
        <div>
          <div class="client-info-card mb-lg">
            <h3 class="text-md font-bold mb-md">Contato</h3>
            <div class="client-info-field">
              <label>${Components.Icons.mapPin} Endereço</label>
              <p>${c.address || '—'}</p>
            </div>
            <div class="client-info-field">
              <label>${Components.Icons.phone} Telefone</label>
              <p>${c.phone || '—'}</p>
            </div>
            <div class="client-info-field">
              <label>${Components.Icons.mail} E-mail</label>
              <p>${c.email || '—'}</p>
            </div>
            ${isPJ && c.contactName ? `
              <div class="client-info-field">
                <label>${Components.Icons.user} Contato Principal</label>
                <p>${c.contactName} — ${c.contactPhone || ''}</p>
              </div>
            ` : ''}
          </div>
          <div class="client-info-card">
            <h3 class="text-md font-bold mb-md">Responsável no Escritório</h3>
            ${emp ? `
              <div class="flex items-center gap-md">
                ${Components.avatar(emp.name, '', emp.color)}
                <div>
                  <div class="font-semibold">${emp.name}</div>
                  <div class="text-sm text-secondary">${emp.role}</div>
                </div>
              </div>
            ` : '<p class="text-secondary">Não atribuído</p>'}
            ${c.notes ? `
              <div class="client-info-field mt-lg">
                <label>Observações</label>
                <p>${c.notes}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function _renderServicesTab(services) {
    if (!services.length) return Components.emptyState('services', 'Nenhum serviço', 'Este cliente ainda não tem serviços cadastrados.');
    const columns = [
      { label: 'Serviço', render: (s) => `<span class="font-semibold">${s.title}</span>` },
      { label: 'Tipo', render: (s) => { const t = Utils.SERVICE_TYPE_MAP[s.type]; return t ? `<span class="badge ${t.badge}">${t.label}</span>` : s.type; } },
      { label: 'Status', render: (s) => { const st = Utils.SERVICE_STATUS_MAP[s.status]; return st ? `<span class="badge ${st.badge}">${st.label}</span>` : s.status; } },
      { label: 'Prazo', render: (s) => { const days = Utils.daysUntil(s.dueDate); const cls = days < 0 ? 'text-danger' : days <= 3 ? 'text-warning' : ''; return `<span class="${cls}">${Utils.formatDate(s.dueDate)}</span>`; } },
    ];
    return Components.dataTable({ columns, data: services, perPage: 5 });
  }

  function _renderFinancialTab(invoices) {
    if (!invoices.length) return Components.emptyState('financial', 'Nenhuma fatura', 'Este cliente ainda não tem faturas.');
    const columns = [
      { label: 'Descrição', render: (i) => `<span class="font-medium">${i.description}</span>` },
      { label: 'Valor', render: (i) => `<span class="font-semibold">${Utils.formatCurrency(i.amount)}</span>` },
      { label: 'Vencimento', render: (i) => Utils.formatDate(i.dueDate) },
      { label: 'Status', render: (i) => { const st = Utils.INVOICE_STATUS_MAP[i.status]; return st ? `<span class="badge ${st.badge}">${st.label}</span>` : i.status; } },
    ];
    return Components.dataTable({ columns, data: invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), perPage: 5 });
  }

  function _renderDocumentsTab(documents) {
    if (!documents.length) return Components.emptyState('documents', 'Nenhum documento', 'Este cliente ainda não tem documentos.');
    const columns = [
      { label: 'Documento', render: (d) => `<span class="font-medium">${d.name}</span>` },
      { label: 'Categoria', render: (d) => { const cat = Utils.DOC_CATEGORY_MAP[d.category]; return cat ? `<span class="badge badge-primary">${cat.label}</span>` : d.category; } },
      { label: 'Data', render: (d) => Utils.formatDate(d.date) },
      { label: 'Observações', render: (d) => `<span class="text-secondary text-sm">${d.notes || '—'}</span>` },
    ];
    return Components.dataTable({ columns, data: documents, perPage: 5 });
  }

  // ---- Actions ----
  function onFilter(key, value) {
    filters[key] = value;
    currentPage = 1;
    App.renderCurrentPage();
  }

  function setTab(tab) {
    detailTab = tab;
    App.renderCurrentPage();
  }

  function viewDetail(id) {
    selectedClientId = id;
    viewMode = 'detail';
    detailTab = 'info';
    App.renderCurrentPage();
  }

  function backToList() {
    viewMode = 'list';
    selectedClientId = null;
    App.renderCurrentPage();
  }

  function openForm(id = null) {
    const client = id ? Store.getById('clients', id) : null;
    const isEdit = !!client;
    const employees = Store.getCollection('employees');

    const content = `
      <form id="client-form">
        <div class="form-group">
          <label class="form-label">Tipo de Cliente</label>
          <select class="form-select" id="cf-type" onchange="ClientsPage.toggleFormFields()">
            <option value="PJ" ${client?.type === 'PJ' || !client ? 'selected' : ''}>Pessoa Jurídica</option>
            <option value="PF" ${client?.type === 'PF' ? 'selected' : ''}>Pessoa Física</option>
          </select>
        </div>

        <!-- PJ Fields -->
        <div id="pj-fields">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">CNPJ *</label>
              <input class="form-input" id="cf-cnpj" placeholder="00.000.000/0001-00" value="${client?.cnpj || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Regime Tributário *</label>
              <select class="form-select" id="cf-regime">
                <option value="Simples Nacional" ${client?.regimeTributario === 'Simples Nacional' ? 'selected' : ''}>Simples Nacional</option>
                <option value="Lucro Presumido" ${client?.regimeTributario === 'Lucro Presumido' ? 'selected' : ''}>Lucro Presumido</option>
                <option value="Lucro Real" ${client?.regimeTributario === 'Lucro Real' ? 'selected' : ''}>Lucro Real</option>
                <option value="MEI" ${client?.regimeTributario === 'MEI' ? 'selected' : ''}>MEI</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Razão Social *</label>
            <input class="form-input" id="cf-razao" placeholder="Razão Social" value="${client?.razaoSocial || ''}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome Fantasia</label>
              <input class="form-input" id="cf-fantasia" placeholder="Nome Fantasia" value="${client?.nomeFantasia || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">CNAE</label>
              <input class="form-input" id="cf-cnae" placeholder="0000-0/00" value="${client?.cnae || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Inscrição Estadual</label>
              <input class="form-input" id="cf-ie" value="${client?.inscricaoEstadual || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Inscrição Municipal</label>
              <input class="form-input" id="cf-im" value="${client?.inscricaoMunicipal || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contato Principal</label>
              <input class="form-input" id="cf-contact-name" placeholder="Nome" value="${client?.contactName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Telefone do Contato</label>
              <input class="form-input" id="cf-contact-phone" placeholder="(00) 00000-0000" value="${client?.contactPhone || ''}">
            </div>
          </div>
<<<<<<< HEAD
          <div class="form-group">
            <label class="form-label">Quadro Societário</label>
            <textarea class="form-textarea" id="cf-socios" placeholder="Sócios da empresa..." rows="3">${client?.socios || ''}</textarea>
          </div>
=======
>>>>>>> 873a5fafbd1bb05de4461b7f765cfe8a45b3ff9b
        </div>

        <!-- PF Fields -->
        <div id="pf-fields" style="display:none">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">CPF *</label>
              <input class="form-input" id="cf-cpf" placeholder="000.000.000-00" value="${client?.cpf || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Nome Completo *</label>
              <input class="form-input" id="cf-nome" placeholder="Nome completo" value="${client?.nome || ''}">
            </div>
          </div>
        </div>

        <!-- Common Fields -->
        <div class="form-group">
          <label class="form-label">Endereço</label>
          <input class="form-input" id="cf-address" placeholder="Rua, número, bairro, cidade/UF" value="${client?.address || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input class="form-input" id="cf-phone" placeholder="(00) 0000-0000" value="${client?.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input class="form-input" id="cf-email" placeholder="email@empresa.com.br" value="${client?.email || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Responsável no Escritório</label>
            <select class="form-select" id="cf-responsible">
              <option value="">Selecione...</option>
              ${employees.map(e => `<option value="${e.id}" ${client?.responsibleId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Honorários (R$)</label>
            <input class="form-input" id="cf-honorarios" type="number" step="0.01" placeholder="0,00" value="${client?.honorarios || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="cf-status">
            <option value="active" ${client?.status !== 'inactive' ? 'selected' : ''}>Ativo</option>
            <option value="inactive" ${client?.status === 'inactive' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="cf-notes" placeholder="Anotações sobre o cliente...">${client?.notes || ''}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="ClientsPage.saveClient('${id || ''}')">${isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
    `;

    Components.openModal({ title: isEdit ? 'Editar Cliente' : 'Novo Cliente', content, footer, size: 'lg' });

    // Toggle fields based on type
<<<<<<< HEAD
    setTimeout(() => {
      toggleFormFields();
      setupFormListeners();
    }, 50);
  }

  function setupFormListeners() {
    const cnpjInput = document.getElementById('cf-cnpj');
    if (cnpjInput) {
      cnpjInput.addEventListener('blur', async (e) => {
        const cnpj = e.target.value;
        if (cnpj.replace(/\D/g, '').length === 14) {
          const btn = document.querySelector('#client-form').closest('.modal').querySelector('.btn-primary');
          const originalText = btn.textContent;
          btn.textContent = 'Buscando...';
          btn.disabled = true;
          
          const data = await Utils.fetchCNPJData(cnpj);
          btn.textContent = originalText;
          btn.disabled = false;
          
          if (data) {
            document.getElementById('cf-razao').value = data.razao_social || '';
            document.getElementById('cf-fantasia').value = data.nome_fantasia || '';
            document.getElementById('cf-cnae').value = data.cnae_fiscal_descricao ? `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}` : data.cnae_fiscal || '';
            
            if (data.logradouro) {
              const address = `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio}/${data.uf}`;
              document.getElementById('cf-address').value = address;
            }
            if (data.ddd_telefone_1) {
              document.getElementById('cf-phone').value = data.ddd_telefone_1;
            }
            if (data.email) {
              document.getElementById('cf-email').value = data.email;
            }
            if (data.qsa && data.qsa.length > 0) {
              const socios = data.qsa.map(s => `${s.nome_socio} (${s.qualificacao_socio})`).join('\n');
              document.getElementById('cf-socios').value = socios;
            }
            Components.toast('Dados preenchidos via CNPJ', 'success');
          } else {
            Components.toast('Não foi possível buscar dados do CNPJ', 'warning');
          }
        }
      });
    }
=======
    setTimeout(() => toggleFormFields(), 50);
>>>>>>> 873a5fafbd1bb05de4461b7f765cfe8a45b3ff9b
  }

  function toggleFormFields() {
    const type = document.getElementById('cf-type')?.value;
    const pjFields = document.getElementById('pj-fields');
    const pfFields = document.getElementById('pf-fields');
    if (pjFields) pjFields.style.display = type === 'PJ' ? 'block' : 'none';
    if (pfFields) pfFields.style.display = type === 'PF' ? 'block' : 'none';
  }

  function saveClient(id) {
    const type = document.getElementById('cf-type').value;
    const data = {
      type,
      status: document.getElementById('cf-status').value,
      address: document.getElementById('cf-address').value,
      phone: document.getElementById('cf-phone').value,
      email: document.getElementById('cf-email').value,
      responsibleId: document.getElementById('cf-responsible').value,
      honorarios: parseFloat(document.getElementById('cf-honorarios').value) || 0,
      notes: document.getElementById('cf-notes').value,
    };

    if (type === 'PJ') {
      data.cnpj = document.getElementById('cf-cnpj').value;
      data.regimeTributario = document.getElementById('cf-regime').value;
      data.razaoSocial = document.getElementById('cf-razao').value;
      data.nomeFantasia = document.getElementById('cf-fantasia').value;
      data.cnae = document.getElementById('cf-cnae').value;
      data.inscricaoEstadual = document.getElementById('cf-ie').value;
      data.inscricaoMunicipal = document.getElementById('cf-im').value;
      data.contactName = document.getElementById('cf-contact-name').value;
      data.contactPhone = document.getElementById('cf-contact-phone').value;
<<<<<<< HEAD
      data.socios = document.getElementById('cf-socios')?.value || '';
=======
>>>>>>> 873a5fafbd1bb05de4461b7f765cfe8a45b3ff9b

      if (!data.cnpj || !data.razaoSocial) {
        Components.toast('Preencha CNPJ e Razão Social', 'warning');
        return;
      }
    } else {
      data.cpf = document.getElementById('cf-cpf').value;
      data.nome = document.getElementById('cf-nome').value;

      if (!data.cpf || !data.nome) {
        Components.toast('Preencha CPF e Nome', 'warning');
        return;
      }
    }

    if (id) {
      Store.update('clients', id, data);
      Components.toast('Cliente atualizado com sucesso!', 'success');
    } else {
      data.createdAt = Utils.formatDateISO(new Date());
      Store.add('clients', data);
      Components.toast('Cliente cadastrado com sucesso!', 'success');
    }

    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteClient(id) {
    const client = Store.getById('clients', id);
    const name = client?.nomeFantasia || client?.razaoSocial || client?.nome || 'este cliente';
    const confirmed = await Components.confirm({
      title: 'Excluir Cliente',
      message: `Tem certeza que deseja excluir <strong>${name}</strong>? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
    });

    if (confirmed) {
      Store.remove('clients', id);
      Components.toast('Cliente excluído com sucesso!', 'success');
      if (selectedClientId === id) backToList();
      else App.renderCurrentPage();
    }
  }

  function copyRegisterLink() {
    const baseUrl = window.location.href.split('#')[0].replace('index.html', '');
    const url = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'register.html';
    
    // Fallback if clipboard API is not available
    if (!navigator.clipboard) {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      Components.toast('Link copiado: ' + url, 'success');
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      Components.toast('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
      prompt('Copie o link de cadastro abaixo:', url);
    });
  }

  function exportCSV() {
    const clients = getFilteredClients();
    const data = clients.map(c => ({
      Tipo: c.type,
      'CNPJ/CPF': c.cnpj || c.cpf || '',
      'Razão Social / Nome': c.razaoSocial || c.nome || '',
      'Nome Fantasia': c.nomeFantasia || '',
      'Regime Tributário': c.regimeTributario || '',
      Telefone: c.phone || '',
      Email: c.email || '',
      Endereço: c.address || '',
      Honorários: c.honorarios || 0,
      Status: c.status === 'active' ? 'Ativo' : 'Inativo',
    }));
    Utils.exportCSV(data, 'clientes_crm.csv');
    Components.toast('Exportação concluída!', 'success');
  }

  function afterRender() {
    // Setup pagination clicks
    document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (p > 0) {
          currentPage = p;
          App.renderCurrentPage();
        }
      });
    });
  }

  function onLeave() {
    viewMode = 'list';
    selectedClientId = null;
    filters = { search: '', type: '', status: '', regime: '' };
    currentPage = 1;
  }

  return { render, afterRender, onLeave, onFilter, setTab, viewDetail, backToList, openForm, toggleFormFields, saveClient, deleteClient, exportCSV, copyRegisterLink };
})();
