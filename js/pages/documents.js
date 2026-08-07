/* ============================================
   CRM Contábil — Documents Page
   ============================================ */

var DocumentsPage = (() => {
  let filters = { client: '', category: '' };

  function render() {
    const clients = Store.getCollection('clients').filter(c => c.status === 'active');
    const documents = getFilteredDocuments();

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Documentos</h2>
          <p>Repositório de documentos contábeis, contratos e procurações</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" onclick="DocumentsPage.openForm()">
            ${Components.Icons.upload} Novo Documento
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <select class="form-select" onchange="DocumentsPage.onFilter('client', this.value)" style="width:250px">
          <option value="">Todos os Clientes</option>
          ${clients.map(c => `<option value="${c.id}" ${filters.client === c.id ? 'selected' : ''}>${c.nomeFantasia || c.razaoSocial || c.nome}</option>`).join('')}
        </select>
        
        <select class="form-select" onchange="DocumentsPage.onFilter('category', this.value)" style="width:200px">
          <option value="">Todas as Categorias</option>
          ${Object.entries(Utils.DOC_CATEGORY_MAP).map(([val, info]) => `<option value="${val}" ${filters.category === val ? 'selected' : ''}>${info.label}</option>`).join('')}
        </select>
      </div>

      ${documents.length > 0 
        ? `<div class="documents-grid">${documents.map(d => _renderDocCard(d)).join('')}</div>`
        : Components.emptyState('documents', 'Nenhum documento encontrado', 'Não há documentos que correspondam aos filtros selecionados.')
      }
    `;
  }

  function getFilteredDocuments() {
    return Store.query('documents', d => {
      if (filters.client && d.clientId !== filters.client) return false;
      if (filters.category && d.category !== filters.category) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function _renderDocCard(d) {
    const c = Store.getById('clients', d.clientId);
    const cat = Utils.DOC_CATEGORY_MAP[d.category] || { label: d.category, icon: 'documents', class: 'other' };

    return `
      <div class="document-card" onclick="DocumentsPage.viewDoc('${d.id}')">
        <div class="document-icon ${cat.class}">
          ${Components.Icons[cat.icon] || Components.Icons.documents}
        </div>
        <div class="document-card-info">
          <div class="name" title="${d.name}">${d.name}</div>
          <div class="meta">${c ? (c.nomeFantasia || c.razaoSocial || c.nome) : 'Sem cliente'}</div>
          <div class="meta mt-xs">${Utils.formatDate(d.date)}</div>
        </div>
      </div>
    `;
  }

  function onFilter(key, val) {
    filters[key] = val;
    App.renderCurrentPage();
  }

  function viewDoc(id) {
    const d = Store.getById('documents', id);
    if (!d) return;

    const c = Store.getById('clients', d.clientId);
    const cat = Utils.DOC_CATEGORY_MAP[d.category];

    const content = `
      <div class="flex flex-col items-center justify-center p-xl bg-tertiary rounded-lg mb-md border border-color">
        <div class="document-icon ${cat?.class || 'other'} mb-md" style="width: 80px; height: 80px;">
          <div style="transform: scale(1.5)">${Components.Icons[cat?.icon] || Components.Icons.documents}</div>
        </div>
        <h3 class="text-lg font-bold text-center">${d.name}</h3>
        <p class="text-secondary">${cat?.label || d.category}</p>
      </div>

      <div class="grid grid-cols-2 gap-md">
        <div class="form-group">
          <label class="form-label text-xs">Cliente</label>
          <p class="font-medium">${c ? (c.nomeFantasia || c.razaoSocial || c.nome) : 'Nenhum'}</p>
        </div>
        <div class="form-group">
          <label class="form-label text-xs">Data</label>
          <p class="font-medium">${Utils.formatDate(d.date)}</p>
        </div>
        <div class="form-group" style="grid-column: 1 / -1">
          <label class="form-label text-xs">Observações</label>
          <p class="text-sm bg-tertiary p-md rounded-md">${d.notes || 'Nenhuma observação.'}</p>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost btn-icon text-danger mr-auto" onclick="DocumentsPage.deleteDoc('${id}')" data-tooltip="Excluir">${Components.Icons.trash}</button>
      <button class="btn btn-secondary" onclick="Components.closeModal()">Fechar</button>
      <button class="btn btn-primary" onclick="Components.toast('Download simulado com sucesso!', 'success')">${Components.Icons.download} Download</button>
    `;

    Components.openModal({ title: 'Detalhes do Documento', content, footer });
  }

  function openForm() {
    const clients = Store.getCollection('clients').filter(c => c.status === 'active');

    const content = `
      <form id="doc-form">
        <div class="form-group">
          <div class="p-xl bg-tertiary border border-color rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-base" style="border-style: dashed;" onclick="document.getElementById('df-file').click()">
            <div class="text-secondary mb-sm">${Components.Icons.upload}</div>
            <p class="text-sm font-medium">Clique para selecionar ou arraste o arquivo aqui</p>
            <p class="text-xs text-secondary mt-xs">PDF, JPG, PNG (Max. 10MB)</p>
            <input type="file" id="df-file" style="display: none" onchange="DocumentsPage.onFileSelect(event)">
          </div>
          <div id="df-file-name" class="text-sm text-center mt-sm text-primary font-medium" style="min-height: 20px"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Nome do Documento *</label>
          <input class="form-input" id="df-name" placeholder="Ex: Contrato Social - Alteração 03">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cliente</label>
            <select class="form-select" id="df-client">
              <option value="">Selecione o cliente...</option>
              ${clients.map(c => `<option value="${c.id}">${c.nomeFantasia || c.razaoSocial || c.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Categoria *</label>
            <select class="form-select" id="df-category">
              ${Object.entries(Utils.DOC_CATEGORY_MAP).map(([val, info]) => `<option value="${val}">${info.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Data do Documento</label>
          <input class="form-input" type="date" id="df-date" value="${Utils.formatDateISO(new Date())}">
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="df-notes" placeholder="Informações adicionais sobre o documento..."></textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="DocumentsPage.saveDoc()">Salvar Documento</button>
    `;

    Components.openModal({ title: 'Upload de Documento', content, footer });
  }

  function saveDoc() {
    const name = document.getElementById('df-name').value.trim();
    if (!name) {
      Components.toast('O nome do documento é obrigatório', 'warning');
      return;
    }

    const data = {
      name,
      clientId: document.getElementById('df-client').value || null,
      category: document.getElementById('df-category').value,
      date: document.getElementById('df-date').value || Utils.formatDateISO(new Date()),
      notes: document.getElementById('df-notes').value,
    };

    Store.add('documents', data);
    Components.toast('Documento salvo com sucesso!', 'success');
    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteDoc(id) {
    const confirmed = await Components.confirm({
      title: 'Excluir Documento',
      message: 'Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.'
    });

    if (confirmed) {
      Store.remove('documents', id);
      Components.toast('Documento excluído', 'success');
      Components.closeModal();
      App.renderCurrentPage();
    }
  }

  function onFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('df-file-name').textContent = file.name;
      const nameInput = document.getElementById('df-name');
      if (!nameInput.value) {
        nameInput.value = file.name.split('.').slice(0, -1).join('.') || file.name;
      }
    }
  }

  function afterRender() {}
  function onLeave() { filters = { client: '', category: '' }; }

  return { render, afterRender, onLeave, onFilter, openForm, saveDoc, viewDoc, deleteDoc, onFileSelect };
})();
