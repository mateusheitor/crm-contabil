/* ============================================
   CRM Contábil — Main App Router & Shell
   ============================================ */

var App = (() => {
  const routes = {
    'dashboard': { title: 'Dashboard', module: DashboardPage },
    'clients': { title: 'Clientes', module: ClientsPage },
    'services': { title: 'Serviços', module: ServicesPage },
    'financial': { title: 'Financeiro', module: FinancialPage },
    'documents': { title: 'Documentos', module: DocumentsPage },
    'calendar': { title: 'Calendário', module: CalendarPage },
    'settings': { title: 'Configurações', module: SettingsPage }
  };

  let currentPage = 'dashboard';

  async function init() {
    // Initialize Data Store (Now Async)
    await Store.init();

    // Setup Navigation
    window.addEventListener('hashchange', handleRouteChange);
    
    // Sidebar toggles
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', toggleSidebar);

    // Initial Route
    handleRouteChange();
    
    // User info
    updateUserInfo();
  }

  function handleRouteChange() {
    let hash = window.location.hash.substring(1);
    if (!hash || !routes[hash]) {
      navigate('dashboard');
      return;
    }

    if (currentPage && routes[currentPage] && routes[currentPage].module.onLeave) {
      routes[currentPage].module.onLeave();
    }

    currentPage = hash;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('href') === `#${hash}`) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update Header
    document.getElementById('header-title').textContent = routes[hash].title;

    // Render Page
    renderCurrentPage();

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('active');
    }
  }

  function renderCurrentPage() {
    const pageContent = document.getElementById('page-content');
    const module = routes[currentPage].module;
    
    // Render HTML
    pageContent.innerHTML = module.render();
    
    // Run afterRender hook (e.g. for charts)
    if (module.afterRender) {
      setTimeout(() => module.afterRender(), 0);
    }
  }

  function navigate(path) {
    window.location.hash = path;
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
  }

  function updateUserInfo() {
    const office = Store.getOffice();
    // In a real app, this would be the logged in user. We'll pick the first employee or a default.
    const emp = Store.getCollection('employees')[0] || { name: 'Admin', role: 'Administrador' };
    
    document.getElementById('office-name').textContent = office.name || 'ContaPlus';
    
    const userContainer = document.getElementById('user-info-container');
    userContainer.innerHTML = `
      ${Components.avatar(emp.name, '', emp.color || '#6c63ff')}
      <div class="sidebar-user-info">
        <div class="name">${emp.name}</div>
        <div class="role">${emp.role}</div>
      </div>
    `;
  }

  return { init, navigate, renderCurrentPage, routes };
})();

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});
