/* ============================================
   CRM Contábil — Services / Kanban Page
   ============================================ */

var ServicesPage = (() => {
  let draggedCardId = null;

  function render() {
    const services = Store.getCollection('services');

    const pending = services.filter(s => s.status === 'pending');
    const inProgress = services.filter(s => s.status === 'in_progress');
    const done = services.filter(s => s.status === 'done');
    const overdue = services.filter(s => s.status === 'overdue');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Serviços e Obrigações</h2>
          <p>Kanban de tarefas fiscais, contábeis e folha</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" onclick="ServicesPage.openForm()">
            ${Components.Icons.plus} Novo Serviço
          </button>
        </div>
      </div>

      <div class="kanban-board">
        ${_renderColumn('pending', 'Pendentes', pending, 'text-warning')}
        ${_renderColumn('in_progress', 'Em Andamento', inProgress, 'text-info')}
        ${_renderColumn('overdue', 'Atrasados', overdue, 'text-danger')}
        ${_renderColumn('done', 'Concluídos', done, 'text-success')}
      </div>
    `;
  }

  function _renderColumn(status, title, items, titleColorCls) {
    return `
      <div class="kanban-column" data-status="${status}">
        <div class="kanban-column-header">
          <div class="kanban-column-title ${titleColorCls}">
            ${title}
            <div class="kanban-column-count">${items.length}</div>
          </div>
        </div>
        <div class="kanban-column-body" ondragover="ServicesPage.onDragOver(event)" ondragleave="ServicesPage.onDragLeave(event)" ondrop="ServicesPage.onDrop(event, '${status}')">
          ${items.map(s => _renderCard(s)).join('')}
        </div>
      </div>
    `;
  }

  function _renderCard(service) {
    const client = Store.getById('clients', service.clientId);
    const emp = Store.getById('employees', service.assignedTo);
    const typeInfo = Utils.SERVICE_TYPE_MAP[service.type] || { badge: 'badge-neutral', label: service.type };
    const priorityInfo = Utils.PRIORITY_MAP[service.priority] || { badge: 'badge-neutral' };

    const days = Utils.daysUntil(service.dueDate);
    let dueClass = '';
    let dueIcon = Components.Icons.clock;
    if (service.status === 'done') {
      dueClass = 'text-success';
      dueIcon = Components.Icons.check;
    } else if (days < 0) {
      dueClass = 'overdue';
      dueIcon = Components.Icons.warning;
    } else if (days <= 3) {
      dueClass = 'soon';
    }

    return `
      <div class="kanban-card" draggable="true" ondragstart="ServicesPage.onDragStart(event, '${service.id}')" ondragend="ServicesPage.onDragEnd(event)" onclick="ServicesPage.openForm('${service.id}')">
        <div class="flex justify-between items-start mb-sm">
          <span class="badge ${typeInfo.badge}">${typeInfo.label}</span>
          ${service.priority !== 'medium' ? `<span class="badge ${priorityInfo.badge} badge-dot"></span>` : ''}
        </div>
        <div class="kanban-card-title">${service.title}</div>
        <div class="kanban-card-client">${client ? (client.nomeFantasia || client.razaoSocial || client.nome) : 'Geral'}</div>
        
        <div class="kanban-card-footer">
          <div class="kanban-card-due ${dueClass}">
            ${dueIcon} ${Utils.formatDate(service.dueDate)}
          </div>
          ${emp ? Components.avatar(emp.name, 'sm', emp.color) : ''}
        </div>
      </div>
    `;
  }

  // ---- Drag & Drop ----
  function onDragStart(e, id) {
    draggedCardId = id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.kanban-column-body').forEach(el => el.classList.remove('drag-over'));
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const body = e.currentTarget;
    if (!body.classList.contains('drag-over')) {
      body.classList.add('drag-over');
    }
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onDrop(e, newStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (draggedCardId) {
      const service = Store.getById('services', draggedCardId);
      if (service && service.status !== newStatus) {
        Store.update('services', draggedCardId, { status: newStatus });
        App.renderCurrentPage();
      }
    }
    draggedCardId = null;
  }

  // ---- Form ----
  function openForm(id = null) {
    const s = id ? Store.getById('services', id) : null;
    const isEdit = !!s;
    
    const clients = Store.getCollection('clients').filter(c => c.status === 'active');
    const employees = Store.getCollection('employees');

    const content = `
      <form id="service-form">
        <div class="form-group">
          <label class="form-label">Título do Serviço / Obrigação *</label>
          <input class="form-input" id="sf-title" placeholder="Ex: Apuração Simples Nacional" value="${s?.title || ''}">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cliente</label>
            <select class="form-select" id="sf-client">
              <option value="">(Geral / Escritório)</option>
              ${clients.map(c => `<option value="${c.id}" ${s?.clientId === c.id ? 'selected' : ''}>${c.nomeFantasia || c.razaoSocial || c.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo *</label>
            <select class="form-select" id="sf-type">
              ${Object.entries(Utils.SERVICE_TYPE_MAP).map(([val, info]) => `<option value="${val}" ${s?.type === val ? 'selected' : ''}>${info.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data de Vencimento / Prazo *</label>
            <input class="form-input" type="date" id="sf-due" value="${s?.dueDate || Utils.formatDateISO(new Date())}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="sf-status">
              ${Object.entries(Utils.SERVICE_STATUS_MAP).map(([val, info]) => `<option value="${val}" ${s?.status === val ? 'selected' : (val==='pending' && !s ? 'selected' : '')}>${info.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Atribuído para</label>
            <select class="form-select" id="sf-assignee">
              <option value="">Não atribuído</option>
              ${employees.map(e => `<option value="${e.id}" ${s?.assignedTo === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade</label>
            <select class="form-select" id="sf-priority">
              ${Object.entries(Utils.PRIORITY_MAP).map(([val, info]) => `<option value="${val}" ${s?.priority === val ? 'selected' : (val==='medium' && !s ? 'selected' : '')}>${info.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descrição / Observações</label>
          <textarea class="form-textarea" id="sf-desc" placeholder="Detalhes do serviço...">${s?.description || ''}</textarea>
        </div>
      </form>
    `;

    const footer = `
      ${isEdit ? `<button class="btn btn-ghost btn-icon text-danger mr-auto" onclick="ServicesPage.deleteService('${id}')" data-tooltip="Excluir">${Components.Icons.trash}</button>` : ''}
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="ServicesPage.saveService('${id || ''}')">${isEdit ? 'Salvar' : 'Criar Serviço'}</button>
    `;

    Components.openModal({ title: isEdit ? 'Editar Serviço' : 'Novo Serviço', content, footer });
  }

  function saveService(id) {
    const title = document.getElementById('sf-title').value.trim();
    if (!title) {
      Components.toast('O título é obrigatório', 'warning');
      return;
    }

    const data = {
      title,
      clientId: document.getElementById('sf-client').value || null,
      type: document.getElementById('sf-type').value,
      dueDate: document.getElementById('sf-due').value,
      status: document.getElementById('sf-status').value,
      assignedTo: document.getElementById('sf-assignee').value || null,
      priority: document.getElementById('sf-priority').value,
      description: document.getElementById('sf-desc').value,
    };

    if (id) {
      Store.update('services', id, data);
      Components.toast('Serviço atualizado', 'success');
    } else {
      Store.add('services', data);
      Components.toast('Serviço criado', 'success');
    }

    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteService(id) {
    const confirmed = await Components.confirm({
      title: 'Excluir Serviço',
      message: 'Tem certeza que deseja excluir este serviço?'
    });

    if (confirmed) {
      Store.remove('services', id);
      Components.toast('Serviço excluído', 'success');
      App.renderCurrentPage();
    }
  }

  function afterRender() {}
  function onLeave() {}

  return { render, afterRender, onLeave, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, openForm, saveService, deleteService };
})();
