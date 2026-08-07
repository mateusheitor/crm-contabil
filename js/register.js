/* ============================================
   CRM Contábil — Client Auto-Registration
   ============================================ */

const RegisterApp = (() => {

  async function init() {
    await Store.init();
    
    // Set office title dynamically
    const office = Store.getOffice();
    if (office && office.name) {
      document.title = `Auto-cadastro — ${office.name}`;
      document.getElementById('office-title').textContent = `Bem-vindo(a) à ${office.name}`;
    }

    document.getElementById('register-form').addEventListener('submit', submitForm);
    
    // Masking simple fields could be added here, but for simplicity we rely on HTML5 placeholders
  }

  function toggleFields() {
    const type = document.getElementById('reg-type').value;
    const pjFields = document.getElementById('pj-fields');
    const pfFields = document.getElementById('pf-fields');
    
    if (type === 'PJ') {
      pjFields.style.display = 'block';
      pfFields.style.display = 'none';
      document.getElementById('reg-cnpj').required = true;
      document.getElementById('reg-razao').required = true;
      document.getElementById('reg-cpf').required = false;
      document.getElementById('reg-nome').required = false;
    } else {
      pjFields.style.display = 'none';
      pfFields.style.display = 'block';
      document.getElementById('reg-cnpj').required = false;
      document.getElementById('reg-razao').required = false;
      document.getElementById('reg-cpf').required = true;
      document.getElementById('reg-nome').required = true;
    }
  }

  function submitForm(e) {
    e.preventDefault();
    
    const type = document.getElementById('reg-type').value;
    
    const data = {
      type: type,
      status: 'active', // Default status for new self-registered clients
      phone: document.getElementById('reg-phone').value,
      email: document.getElementById('reg-email').value,
      address: document.getElementById('reg-address').value,
      createdAt: Utils.formatDateISO(new Date()),
      honorarios: 0,
      notes: 'Cadastro via formulário externo.'
    };

    if (type === 'PJ') {
      data.cnpj = document.getElementById('reg-cnpj').value;
      data.razaoSocial = document.getElementById('reg-razao').value;
      data.nomeFantasia = document.getElementById('reg-fantasia').value;
      data.regimeTributario = document.getElementById('reg-regime').value;
      data.cnae = document.getElementById('reg-cnae').value;
      
      // Basic validation
      if (!data.cnpj || !data.razaoSocial) {
        alert('Por favor, preencha o CNPJ e a Razão Social.');
        return;
      }
    } else {
      data.cpf = document.getElementById('reg-cpf').value;
      data.nome = document.getElementById('reg-nome').value;
      
      if (!data.cpf || !data.nome) {
        alert('Por favor, preencha o CPF e o Nome Completo.');
        return;
      }
    }

    // Save to LocalStorage using Store module
    Store.add('clients', data);

    // Show success message
    document.getElementById('form-card').classList.add('hidden');
    document.getElementById('success-card').classList.remove('hidden');
  }

  return { init, toggleFields };
})();

document.addEventListener('DOMContentLoaded', async () => {
  await RegisterApp.init();
});
