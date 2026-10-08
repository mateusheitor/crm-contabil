/* ============================================
   CRM Contábil — Calendar Page
   ============================================ */

var CalendarPage = (() => {
  let currentDate = new Date();

  function render() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Calendário de Obrigações</h2>
          <p>Visão mensal de prazos, reuniões e tarefas internas</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="CalendarPage.goToday()">Hoje</button>
          <button class="btn btn-primary btn-sm" onclick="CalendarPage.openForm()">
            ${Components.Icons.plus} Novo Evento
          </button>
        </div>
      </div>

      <div class="calendar-layout">
        <div class="calendar-container">
          <div class="calendar-header-nav">
            <button class="btn btn-ghost btn-icon" onclick="CalendarPage.prevMonth()">
              ${Components.Icons.chevronLeft}
            </button>
            <h3>${Utils.getMonthName(month)} ${year}</h3>
            <button class="btn btn-ghost btn-icon" onclick="CalendarPage.nextMonth()">
              ${Components.Icons.chevronRight}
            </button>
          </div>
          <div class="calendar-grid">
            ${Utils.WEEKDAYS.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
            ${_renderDays(year, month)}
          </div>
        </div>
        
        <div class="calendar-sidebar">
          <div class="card">
            <h3 class="text-md font-bold mb-md">Legenda</h3>
            <div class="calendar-legend">
              ${Object.entries(Utils.EVENT_TYPE_MAP).map(([type, info]) => `
                <div class="legend-item">
                  <div class="legend-dot ${info.class}"></div>
                  ${info.label}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function _renderDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0-6 (Sun-Sat)

    const events = Store.getCollection('events');
    const services = Store.getCollection('services').filter(s => s.status !== 'done');
    const invoices = Store.getCollection('invoices').filter(i => i.status === 'pending' || i.status === 'overdue');
    
    const today = new Date();
    today.setHours(0,0,0,0);

    let html = '';

    // Previous month empty days
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div class="calendar-day other-month"></div>`;
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const cellDate = new Date(year, month, i);
      const isToday = cellDate.getTime() === today.getTime();
      const dateStr = Utils.formatDateISO(cellDate);

      // Get events for this day
      const dayEvents = [];
      
      // Explicit events
      events.filter(e => e.date === dateStr).forEach(e => dayEvents.push({ ...e, type: e.type }));
      
      // Services mapped to events
      services.filter(s => s.dueDate === dateStr).forEach(s => {
        dayEvents.push({ id: `srv_${s.id}`, title: s.title, type: 'deadline', source: 'service', originalId: s.id });
      });

      // Invoices mapped to events
      invoices.filter(inv => inv.dueDate === dateStr).forEach(inv => {
        dayEvents.push({ id: `inv_${inv.id}`, title: `Fatura #${inv.id.substring(0,6)}`, type: 'deadline', source: 'invoice', originalId: inv.id });
      });

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''}" onclick="CalendarPage.onDayClick('${dateStr}')">
          <div class="calendar-day-number">${i}</div>
          <div class="flex flex-col gap-[2px]">
            ${dayEvents.slice(0, 4).map(e => `
              <div class="calendar-event ${Utils.EVENT_TYPE_MAP[e.type]?.class || 'internal'}" 
                   onclick="event.stopPropagation(); CalendarPage.viewEvent('${e.id}', '${e.source || 'event'}')" 
                   title="${e.title}">
                ${e.title}
              </div>
            `).join('')}
            ${dayEvents.length > 4 ? `<div class="text-[10px] text-secondary text-center mt-[2px]">+${dayEvents.length - 4} mais</div>` : ''}
          </div>
        </div>
      `;
    }

    // Next month empty days
    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = (Math.ceil(totalCells / 7) * 7) - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      html += `<div class="calendar-day other-month"></div>`;
    }

    return html;
  }

  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    App.renderCurrentPage();
  }

  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    App.renderCurrentPage();
  }

  function goToday() {
    currentDate = new Date();
    App.renderCurrentPage();
  }

  function onDayClick(dateStr) {
    openForm(null, dateStr);
  }

  function viewEvent(id, source) {
    if (source === 'service') {
      App.navigate('services');
      setTimeout(() => ServicesPage.openForm(Store.getById('services', id.replace('srv_', '')).id), 100);
      return;
    }
    if (source === 'invoice') {
      App.navigate('financial');
      setTimeout(() => FinancialPage.openForm(Store.getById('invoices', id.replace('inv_', '')).id), 100);
      return;
    }

    const evt = Store.getById('events', id);
    if (!evt) return;

    const client = evt.clientId ? Store.getById('clients', evt.clientId) : null;
    const typeInfo = Utils.EVENT_TYPE_MAP[evt.type];

    const content = `
      <div class="form-group">
        <label class="form-label text-xs">Título</label>
        <p class="font-bold text-md">${evt.title}</p>
      </div>
      <div class="grid grid-cols-2 gap-md mb-md">
        <div>
          <label class="form-label text-xs">Data</label>
          <p class="font-medium">${Utils.formatDate(evt.date)}</p>
        </div>
        <div>
          <label class="form-label text-xs">Tipo</label>
          <p>${Components.badge(typeInfo.label, typeInfo.class)}</p>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label text-xs">Cliente Relacionado</label>
        <p class="font-medium">${client ? (client.nomeFantasia || client.razaoSocial || client.nome) : 'Nenhum / Escritório'}</p>
      </div>
      <div class="form-group">
        <label class="form-label text-xs">Observações</label>
        <p class="text-sm bg-tertiary p-md rounded-md">${evt.notes || 'Nenhuma.'}</p>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost btn-icon text-danger mr-auto" onclick="CalendarPage.deleteEvent('${id}')" data-tooltip="Excluir">${Components.Icons.trash}</button>
      <button class="btn btn-secondary" onclick="Components.closeModal()">Fechar</button>
      <button class="btn btn-primary" onclick="CalendarPage.openForm('${id}')">Editar</button>
    `;

    Components.openModal({ title: 'Detalhes do Evento', content, footer });
  }

  function openForm(id = null, initialDate = null) {
    const evt = id ? Store.getById('events', id) : null;
    const isEdit = !!evt;
    const clients = Store.getCollection('clients').filter(c => c.status === 'active');
    const dateVal = evt?.date || initialDate || Utils.formatDateISO(new Date());

    const content = `
      <form id="event-form">
        <div class="form-group">
          <label class="form-label">Título do Evento *</label>
          <input class="form-input" id="ef-title" value="${evt?.title || ''}">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data *</label>
            <input class="form-input" type="date" id="ef-date" value="${dateVal}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo *</label>
            <select class="form-select" id="ef-type">
              ${Object.entries(Utils.EVENT_TYPE_MAP).map(([val, info]) => `<option value="${val}" ${evt?.type === val ? 'selected' : ''}>${info.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Cliente (Opcional)</label>
          <select class="form-select" id="ef-client">
            <option value="">Nenhum / Escritório</option>
            ${clients.map(c => `<option value="${c.id}" ${evt?.clientId === c.id ? 'selected' : ''}>${c.nomeFantasia || c.razaoSocial || c.nome}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="ef-notes">${evt?.notes || ''}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="CalendarPage.saveEvent('${id || ''}')">${isEdit ? 'Salvar' : 'Criar Evento'}</button>
    `;

    Components.openModal({ title: isEdit ? 'Editar Evento' : 'Novo Evento', content, footer });
  }

  function saveEvent(id) {
    const title = document.getElementById('ef-title').value.trim();
    if (!title) {
      Components.toast('O título é obrigatório', 'warning');
      return;
    }

    const data = {
      title,
      date: document.getElementById('ef-date').value,
      type: document.getElementById('ef-type').value,
      clientId: document.getElementById('ef-client').value || null,
      notes: document.getElementById('ef-notes').value,
    };

    if (id) {
      Store.update('events', id, data);
      Components.toast('Evento atualizado', 'success');
    } else {
      Store.add('events', data);
      Components.toast('Evento criado', 'success');
    }

    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteEvent(id) {
    const confirmed = await Components.confirm({
      title: 'Excluir Evento',
      message: 'Tem certeza que deseja excluir este evento?'
    });

    if (confirmed) {
      Store.remove('events', id);
      Components.toast('Evento excluído', 'success');
      Components.closeModal();
      App.renderCurrentPage();
    }
  }

  function afterRender() {}
  function onLeave() {}

  return { render, afterRender, onLeave, prevMonth, nextMonth, goToday, onDayClick, viewEvent, openForm, saveEvent, deleteEvent };
})();
