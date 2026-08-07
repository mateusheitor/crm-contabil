/* ============================================
   CRM Contábil — Settings Page
   ============================================ */

var SettingsPage = (() => {

  let activeTab = 'office';

  function render() {
    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Configurações</h2>
          <p>Gerencie os dados do escritório e equipe</p>
        </div>
      </div>

      <div class="settings-layout">
        <div class="settings-nav">
          <div class="settings-nav-item ${activeTab === 'office' ? 'active' : ''}" onclick="SettingsPage.setTab('office')">
            ${Components.Icons.building} Dados do Escritório
          </div>
          <div class="settings-nav-item ${activeTab === 'team' ? 'active' : ''}" onclick="SettingsPage.setTab('team')">
            ${Components.Icons.users} Equipe
          </div>
          <div class="settings-nav-item ${activeTab === 'system' ? 'active' : ''}" onclick="SettingsPage.setTab('system')">
            ${Components.Icons.settings} Sistema
          </div>
        </div>

        <div class="settings-content">
          ${_renderContent()}
        </div>
      </div>
    `;
  }

  function _renderContent() {
    if (activeTab === 'office') return _renderOfficeSettings();
    if (activeTab === 'team') return _renderTeamSettings();
    if (activeTab === 'system') return _renderSystemSettings();
    return '';
  }

  // ---- Office Settings ----
  function _renderOfficeSettings() {
    const office = Store.getOffice();
    return `
      <div class="card">
        <div class="settings-section">
          <h3>Dados do Escritório</h3>
          <p>Informações que aparecerão em faturas e relatórios</p>
          
          <form id="office-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Razão Social / Nome</label>
                <input class="form-input" id="set-name" value="${office.name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">CNPJ</label>
                <input class="form-input" id="set-cnpj" value="${office.cnpj || ''}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Endereço Completo</label>
              <input class="form-input" id="set-address" value="${office.address || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input class="form-input" id="set-phone" value="${office.phone || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">E-mail de Contato</label>
                <input class="form-input" id="set-email" value="${office.email || ''}">
              </div>
            </div>
            <div class="flex justify-end mt-lg">
              <button type="button" class="btn btn-primary" onclick="SettingsPage.saveOffice()">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function saveOffice() {
    Store.updateOffice({
      name: document.getElementById('set-name').value,
      cnpj: document.getElementById('set-cnpj').value,
      address: document.getElementById('set-address').value,
      phone: document.getElementById('set-phone').value,
      email: document.getElementById('set-email').value,
    });
    Components.toast('Dados do escritório atualizados', 'success');
  }

  // ---- Team Settings ----
  function _renderTeamSettings() {
    const employees = Store.getCollection('employees');
    
    return `
      <div class="card">
        <div class="settings-section">
          <div class="flex items-center justify-between mb-sm">
            <div>
              <h3>Equipe</h3>
              <p>Gerencie os funcionários e responsáveis do escritório</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="SettingsPage.openEmpForm()">
              ${Components.Icons.plus} Adicionar
            </button>
          </div>
          
          <div class="table-wrapper mt-lg">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Cargo</th>
                  <th>Contato</th>
                  <th style="width: 80px">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${employees.map(e => `
                  <tr>
                    <td>
                      <div class="flex items-center gap-md">
                        ${Components.avatar(e.name, '', e.color)}
                        <span class="font-semibold">${e.name}</span>
                      </div>
                    </td>
                    <td>${e.role}</td>
                    <td>
                      <div class="text-xs text-secondary">${e.email}</div>
                      <div class="text-xs text-secondary">${e.phone}</div>
                    </td>
                    <td>
                      <div class="flex gap-xs">
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="SettingsPage.openEmpForm('${e.id}')">${Components.Icons.edit}</button>
                        <button class="btn btn-ghost btn-icon btn-sm text-danger" onclick="SettingsPage.deleteEmp('${e.id}')">${Components.Icons.trash}</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function openEmpForm(id = null) {
    const emp = id ? Store.getById('employees', id) : null;
    const isEdit = !!emp;

    const content = `
      <div class="form-group">
        <label class="form-label">Nome Completo *</label>
        <input class="form-input" id="ef-name" value="${emp?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Cargo / Função *</label>
        <input class="form-input" id="ef-role" value="${emp?.role || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input class="form-input" id="ef-email" value="${emp?.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input class="form-input" id="ef-phone" value="${emp?.phone || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Cor de Identificação</label>
        <input type="color" id="ef-color" value="${emp?.color || '#6c63ff'}" class="w-full h-[40px] cursor-pointer rounded-md border-0 p-0 bg-transparent">
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="SettingsPage.saveEmp('${id || ''}')">${isEdit ? 'Salvar' : 'Adicionar'}</button>
    `;

    Components.openModal({ title: isEdit ? 'Editar Funcionário' : 'Novo Funcionário', content, footer });
  }

  function saveEmp(id) {
    const name = document.getElementById('ef-name').value.trim();
    if (!name) return Components.toast('Nome obrigatório', 'warning');

    const data = {
      name,
      role: document.getElementById('ef-role').value,
      email: document.getElementById('ef-email').value,
      phone: document.getElementById('ef-phone').value,
      color: document.getElementById('ef-color').value,
    };

    if (id) {
      Store.update('employees', id, data);
      Components.toast('Funcionário atualizado', 'success');
    } else {
      Store.add('employees', data);
      Components.toast('Funcionário adicionado', 'success');
    }

    Components.closeModal();
    App.renderCurrentPage();
  }

  async function deleteEmp(id) {
    const confirmed = await Components.confirm({ title: 'Excluir', message: 'Deseja excluir este funcionário?' });
    if (confirmed) {
      Store.remove('employees', id);
      Components.toast('Excluído com sucesso', 'success');
      App.renderCurrentPage();
    }
  }

  // ---- System Settings ----
  function _renderSystemSettings() {
    return `
      <div class="card">
        <div class="settings-section">
          <h3>Sistema</h3>
          <p>Configurações de dados e armazenamento</p>
          
          <div class="mt-lg p-lg bg-tertiary rounded-lg border border-color">
            <div class="flex items-center gap-md mb-md">
              <div class="text-warning">${Components.Icons.warning}</div>
              <div>
                <h4 class="font-bold">Armazenamento Local</h4>
                <p class="text-sm text-secondary">Todos os dados deste CRM estão sendo salvos apenas no LocalStorage do seu navegador atual.</p>
              </div>
            </div>
            
            <div class="flex gap-sm mt-lg">
              <button class="btn btn-secondary" onclick="SettingsPage.resetDemoData()">
                ${Components.Icons.refresh} Restaurar Dados de Demonstração
              </button>
              <button class="btn btn-danger" onclick="SettingsPage.clearAllData()">
                ${Components.Icons.trash} Limpar Todos os Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function resetDemoData() {
    const confirmed = await Components.confirm({
      title: 'Restaurar Dados',
      message: 'Isso apagará todas as suas alterações e restaurará os dados iniciais de demonstração. Tem certeza?'
    });
    if (confirmed) {
      Store.resetData();
      Components.toast('Dados restaurados com sucesso!', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  }

  async function clearAllData() {
    const confirmed = await Components.confirm({
      title: 'Limpar TUDO',
      message: 'Isso apagará TODOS os clientes, serviços, faturas e configurações. O sistema ficará completamente vazio. Tem certeza absoluta?'
    });
    if (confirmed) {
      localStorage.removeItem('crm_contabil_data');
      Components.toast('Dados apagados com sucesso!', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  }

  function setTab(tab) {
    activeTab = tab;
    App.renderCurrentPage();
  }

  function afterRender() {}
  function onLeave() {}

  return { render, afterRender, onLeave, setTab, saveOffice, openEmpForm, saveEmp, deleteEmp, resetDemoData, clearAllData };
})();
