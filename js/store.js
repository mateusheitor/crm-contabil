/* ============================================
   CRM Contábil — Data Store (LocalStorage)
   ============================================ */

var Store = (() => {
  let inMemoryData = null;
  let db = null;

  const firebaseConfig = {
    apiKey: "AIzaSyB_dmV19r3i9W1LwYt9MW5ZaDTZrUBzuvw",
    authDomain: "bluecrm-72db9.firebaseapp.com",
    projectId: "bluecrm-72db9",
    storageBucket: "bluecrm-72db9.firebasestorage.app",
    messagingSenderId: "226555814395",
    appId: "1:226555814395:web:6ea242389c428bd9496b5e",
    measurementId: "G-ZXVVW07PE4"
  };

  // ---- Internal helpers ----
  function _getAll() {
    return inMemoryData;
  }

  function _saveAll(data) {
    inMemoryData = data;
    if (db) {
      db.collection('crm_data').doc('main').set(data)
        .catch(err => console.error('Error syncing to Firebase:', err));
    }
  }

  function _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  // ---- Default Data Structure ----
  function _getDefaultData() {
    return {
      office: {
        name: 'blue Inteligência Contábil',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Empresas, 100 - Centro, São Paulo/SP',
        phone: '(11) 3456-7890',
        email: 'contato@bluecontabil.com.br'
      },
      employees: _defaultEmployees(),
      clients: _defaultClients(),
      services: _defaultServices(),
      invoices: _defaultInvoices(),
      documents: _defaultDocuments(),
      events: _defaultEvents(),
      activities: _defaultActivities()
    };
  }

  // ---- Demo Data ----
  function _defaultEmployees() {
    return [
      { id: 'emp1', name: 'Carlos Oliveira', role: 'Sócio Administrador', email: 'carlos@contaplus.com.br', phone: '(11) 99999-0001', color: '#6c63ff' },
      { id: 'emp2', name: 'Maria Santos', role: 'Contadora Sênior', email: 'maria@contaplus.com.br', phone: '(11) 99999-0002', color: '#00d4aa' },
      { id: 'emp3', name: 'Pedro Lima', role: 'Analista Fiscal', email: 'pedro@contaplus.com.br', phone: '(11) 99999-0003', color: '#ffa726' },
      { id: 'emp4', name: 'Ana Costa', role: 'Assistente Contábil', email: 'ana@contaplus.com.br', phone: '(11) 99999-0004', color: '#42a5f5' },
      { id: 'emp5', name: 'Lucas Ferreira', role: 'Analista de DP', email: 'lucas@contaplus.com.br', phone: '(11) 99999-0005', color: '#ef5350' }
    ];
  }

  function _defaultClients() {
    return [
      {
        id: 'cli1', type: 'PJ', status: 'active',
        cnpj: '11.222.333/0001-44', razaoSocial: 'Tech Solutions Ltda', nomeFantasia: 'TechSol',
        inscricaoEstadual: '123.456.789.000', inscricaoMunicipal: '12345',
        regimeTributario: 'Simples Nacional', cnae: '6201-5/00 - Desenvolvimento de software',
        address: 'Av. Paulista, 1000, São Paulo/SP', cep: '01310-100',
        phone: '(11) 3100-0001', email: 'financeiro@techsol.com.br',
        contactName: 'Roberto Silva', contactPhone: '(11) 98765-0001',
        responsibleId: 'emp2', notes: 'Cliente desde 2022. Faturamento mensal ~R$150k.',
        createdAt: '2024-01-15', honorarios: 2800
      },
      {
        id: 'cli2', type: 'PJ', status: 'active',
        cnpj: '22.333.444/0001-55', razaoSocial: 'Construtora Horizonte S/A', nomeFantasia: 'Horizonte',
        inscricaoEstadual: '234.567.890.000', inscricaoMunicipal: '23456',
        regimeTributario: 'Lucro Presumido', cnae: '4120-4/00 - Construção de edifícios',
        address: 'Rua Augusta, 500, São Paulo/SP', cep: '01304-000',
        phone: '(11) 3200-0002', email: 'contabilidade@horizonte.com.br',
        contactName: 'Fernando Gomes', contactPhone: '(11) 98765-0002',
        responsibleId: 'emp1', notes: 'Empresa de grande porte. Requer atenção especial na apuração.',
        createdAt: '2023-06-10', honorarios: 5500
      },
      {
        id: 'cli3', type: 'PJ', status: 'active',
        cnpj: '33.444.555/0001-66', razaoSocial: 'Restaurante Sabor & Arte Ltda', nomeFantasia: 'Sabor & Arte',
        inscricaoEstadual: '', inscricaoMunicipal: '34567',
        regimeTributario: 'Simples Nacional', cnae: '5611-2/01 - Restaurantes',
        address: 'Rua Oscar Freire, 200, São Paulo/SP', cep: '01426-000',
        phone: '(11) 3300-0003', email: 'adm@saborarte.com.br',
        contactName: 'Juliana Martins', contactPhone: '(11) 98765-0003',
        responsibleId: 'emp3', notes: 'Atenção ao eSocial — muitos colaboradores.',
        createdAt: '2023-09-20', honorarios: 1800
      },
      {
        id: 'cli4', type: 'PJ', status: 'active',
        cnpj: '44.555.666/0001-77', razaoSocial: 'Clínica Vida Plena Ltda', nomeFantasia: 'Vida Plena',
        inscricaoEstadual: '', inscricaoMunicipal: '45678',
        regimeTributario: 'Lucro Presumido', cnae: '8630-5/01 - Atividade médica ambulatorial',
        address: 'Rua Bela Cintra, 800, São Paulo/SP', cep: '01415-000',
        phone: '(11) 3400-0004', email: 'financeiro@vidaplena.med.br',
        contactName: 'Dr. Marcos Pereira', contactPhone: '(11) 98765-0004',
        responsibleId: 'emp2', notes: 'Regime de ISS fixo. Verificar retenções.',
        createdAt: '2024-03-01', honorarios: 3200
      },
      {
        id: 'cli5', type: 'PJ', status: 'active',
        cnpj: '55.666.777/0001-88', razaoSocial: 'AutoPeças Central Ltda', nomeFantasia: 'AutoPeças Central',
        inscricaoEstadual: '456.789.012.000', inscricaoMunicipal: '56789',
        regimeTributario: 'Simples Nacional', cnae: '4530-7/03 - Comércio de peças para veículos',
        address: 'Av. do Estado, 2000, São Paulo/SP', cep: '01516-000',
        phone: '(11) 3500-0005', email: 'contabil@autopecas.com.br',
        contactName: 'Ricardo Souza', contactPhone: '(11) 98765-0005',
        responsibleId: 'emp3', notes: 'Tem ICMS-ST. Controle rigoroso de estoque.',
        createdAt: '2024-02-14', honorarios: 2200
      },
      {
        id: 'cli6', type: 'MEI', status: 'active',
        cnpj: '66.777.888/0001-99', razaoSocial: 'João Carlos Barbosa MEI', nomeFantasia: 'JC Design',
        inscricaoEstadual: '', inscricaoMunicipal: '',
        regimeTributario: 'MEI', cnae: '7410-2/99 - Design',
        address: 'Rua Consolação, 100, São Paulo/SP', cep: '01302-000',
        phone: '(11) 3600-0006', email: 'jcdesign@email.com',
        contactName: 'João Carlos', contactPhone: '(11) 98765-0006',
        responsibleId: 'emp4', notes: 'MEI simples. Só DASN-SIMEI anual.',
        createdAt: '2024-06-01', honorarios: 350
      },
      {
        id: 'cli7', type: 'PJ', status: 'inactive',
        cnpj: '77.888.999/0001-00', razaoSocial: 'Importadora Global Ltda', nomeFantasia: 'Global Import',
        inscricaoEstadual: '567.890.123.000', inscricaoMunicipal: '67890',
        regimeTributario: 'Lucro Real', cnae: '4623-1/09 - Comércio atacadista de importados',
        address: 'Rua 25 de Março, 500, São Paulo/SP', cep: '01021-000',
        phone: '(11) 3700-0007', email: 'contabil@globalimport.com.br',
        contactName: 'Paulo Mendes', contactPhone: '(11) 98765-0007',
        responsibleId: 'emp1', notes: 'Cliente inativo desde 03/2025. Contrato encerrado.',
        createdAt: '2022-08-10', honorarios: 8500
      },
      {
        id: 'cli8', type: 'PF', status: 'active',
        cpf: '123.456.789-00', nome: 'Dra. Patricia Almeida',
        address: 'Al. Santos, 1200, São Paulo/SP', cep: '01418-100',
        phone: '(11) 98765-0008', email: 'patricia.almeida@email.com',
        responsibleId: 'emp4', notes: 'Declaração IRPF anual + carnê-leão mensal.',
        createdAt: '2024-04-15', honorarios: 900
      }
    ];
  }

  function _defaultServices() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return [
      { id: 'srv1', title: 'Apuração Simples Nacional', clientId: 'cli1', type: 'fiscal', status: 'done', assignedTo: 'emp2', dueDate: _dateStr(year, month, 20), description: 'Apuração e emissão do DAS mensal', priority: 'medium' },
      { id: 'srv2', title: 'Folha de Pagamento', clientId: 'cli3', type: 'dp', status: 'in_progress', assignedTo: 'emp5', dueDate: _dateStr(year, month, 28), description: 'Processamento da folha + encargos', priority: 'high' },
      { id: 'srv3', title: 'DCTF Mensal', clientId: 'cli2', type: 'fiscal', status: 'pending', assignedTo: 'emp3', dueDate: _dateStr(year, month + 1, 15), description: 'Declaração de Débitos e Créditos Tributários Federais', priority: 'high' },
      { id: 'srv4', title: 'Escrituração SPED Fiscal', clientId: 'cli5', type: 'fiscal', status: 'in_progress', assignedTo: 'emp3', dueDate: _dateStr(year, month + 1, 10), description: 'SPED Fiscal ICMS/IPI', priority: 'high' },
      { id: 'srv5', title: 'Balancete Mensal', clientId: 'cli4', type: 'contabil', status: 'pending', assignedTo: 'emp2', dueDate: _dateStr(year, month + 1, 5), description: 'Balancete de verificação mensal', priority: 'medium' },
      { id: 'srv6', title: 'IRPJ Trimestral', clientId: 'cli2', type: 'fiscal', status: 'pending', assignedTo: 'emp1', dueDate: _dateStr(year, month + 1, 30), description: 'Apuração do IRPJ trimestral - Lucro Presumido', priority: 'high' },
      { id: 'srv7', title: 'Apuração ISS', clientId: 'cli4', type: 'fiscal', status: 'done', assignedTo: 'emp3', dueDate: _dateStr(year, month, 15), description: 'Apuração e guia ISS mensal', priority: 'medium' },
      { id: 'srv8', title: 'eSocial - Eventos periódicos', clientId: 'cli3', type: 'dp', status: 'overdue', assignedTo: 'emp5', dueDate: _dateStr(year, month, 7), description: 'Envio dos eventos periódicos do eSocial', priority: 'critical' },
      { id: 'srv9', title: 'Carnê-Leão', clientId: 'cli8', type: 'fiscal', status: 'pending', assignedTo: 'emp4', dueDate: _dateStr(year, month + 1, 15), description: 'Cálculo do carnê-leão mensal', priority: 'low' },
      { id: 'srv10', title: 'DASN-SIMEI Anual', clientId: 'cli6', type: 'fiscal', status: 'done', assignedTo: 'emp4', dueDate: _dateStr(year, 4, 31), description: 'Declaração Anual do MEI', priority: 'medium' },
      { id: 'srv11', title: 'EFD Contribuições', clientId: 'cli2', type: 'fiscal', status: 'in_progress', assignedTo: 'emp3', dueDate: _dateStr(year, month + 1, 12), description: 'Escrituração Fiscal Digital PIS/COFINS', priority: 'high' },
      { id: 'srv12', title: 'Conciliação Bancária', clientId: 'cli1', type: 'contabil', status: 'pending', assignedTo: 'emp4', dueDate: _dateStr(year, month + 1, 8), description: 'Conciliação de extratos bancários', priority: 'medium' }
    ];
  }

  function _dateStr(y, m, d) {
    const date = new Date(y, m, d);
    return date.toISOString().split('T')[0];
  }

  function _defaultInvoices() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return [
      { id: 'inv1', clientId: 'cli1', description: 'Honorários contábeis - Mês atual', amount: 2800, status: 'paid', dueDate: _dateStr(y, m, 10), paidDate: _dateStr(y, m, 8), createdAt: _dateStr(y, m, 1) },
      { id: 'inv2', clientId: 'cli2', description: 'Honorários contábeis - Mês atual', amount: 5500, status: 'paid', dueDate: _dateStr(y, m, 10), paidDate: _dateStr(y, m, 10), createdAt: _dateStr(y, m, 1) },
      { id: 'inv3', clientId: 'cli3', description: 'Honorários contábeis - Mês atual', amount: 1800, status: 'pending', dueDate: _dateStr(y, m, 15), paidDate: null, createdAt: _dateStr(y, m, 1) },
      { id: 'inv4', clientId: 'cli4', description: 'Honorários contábeis - Mês atual', amount: 3200, status: 'paid', dueDate: _dateStr(y, m, 10), paidDate: _dateStr(y, m, 9), createdAt: _dateStr(y, m, 1) },
      { id: 'inv5', clientId: 'cli5', description: 'Honorários contábeis - Mês atual', amount: 2200, status: 'overdue', dueDate: _dateStr(y, m, 5), paidDate: null, createdAt: _dateStr(y, m, 1) },
      { id: 'inv6', clientId: 'cli6', description: 'Honorários contábeis - Mês atual', amount: 350, status: 'paid', dueDate: _dateStr(y, m, 15), paidDate: _dateStr(y, m, 12), createdAt: _dateStr(y, m, 1) },
      { id: 'inv7', clientId: 'cli8', description: 'Honorários contábeis - Mês atual', amount: 900, status: 'pending', dueDate: _dateStr(y, m, 20), paidDate: null, createdAt: _dateStr(y, m, 1) },
      // Mês anterior
      { id: 'inv8', clientId: 'cli1', description: 'Honorários contábeis - Mês anterior', amount: 2800, status: 'paid', dueDate: _dateStr(y, m - 1, 10), paidDate: _dateStr(y, m - 1, 9), createdAt: _dateStr(y, m - 1, 1) },
      { id: 'inv9', clientId: 'cli2', description: 'Honorários contábeis - Mês anterior', amount: 5500, status: 'paid', dueDate: _dateStr(y, m - 1, 10), paidDate: _dateStr(y, m - 1, 10), createdAt: _dateStr(y, m - 1, 1) },
      { id: 'inv10', clientId: 'cli3', description: 'Honorários contábeis - Mês anterior', amount: 1800, status: 'paid', dueDate: _dateStr(y, m - 1, 15), paidDate: _dateStr(y, m - 1, 14), createdAt: _dateStr(y, m - 1, 1) },
      { id: 'inv11', clientId: 'cli4', description: 'Honorários contábeis - Mês anterior', amount: 3200, status: 'paid', dueDate: _dateStr(y, m - 1, 10), paidDate: _dateStr(y, m - 1, 10), createdAt: _dateStr(y, m - 1, 1) },
      { id: 'inv12', clientId: 'cli5', description: 'Honorários contábeis - Mês anterior', amount: 2200, status: 'paid', dueDate: _dateStr(y, m - 1, 5), paidDate: _dateStr(y, m - 1, 5), createdAt: _dateStr(y, m - 1, 1) },
      // 2 meses atrás
      { id: 'inv13', clientId: 'cli1', description: 'Honorários contábeis', amount: 2800, status: 'paid', dueDate: _dateStr(y, m - 2, 10), paidDate: _dateStr(y, m - 2, 10), createdAt: _dateStr(y, m - 2, 1) },
      { id: 'inv14', clientId: 'cli2', description: 'Honorários contábeis', amount: 5500, status: 'paid', dueDate: _dateStr(y, m - 2, 10), paidDate: _dateStr(y, m - 2, 8), createdAt: _dateStr(y, m - 2, 1) },
      { id: 'inv15', clientId: 'cli3', description: 'Honorários contábeis', amount: 1800, status: 'paid', dueDate: _dateStr(y, m - 2, 15), paidDate: _dateStr(y, m - 2, 15), createdAt: _dateStr(y, m - 2, 1) },
      { id: 'inv16', clientId: 'cli4', description: 'Honorários contábeis', amount: 3200, status: 'paid', dueDate: _dateStr(y, m - 2, 10), paidDate: _dateStr(y, m - 2, 9), createdAt: _dateStr(y, m - 2, 1) },
    ];
  }

  function _defaultDocuments() {
    return [
      { id: 'doc1', name: 'Contrato de Prestação de Serviços', category: 'contract', clientId: 'cli1', date: '2024-01-15', notes: 'Contrato vigente até 2026' },
      { id: 'doc2', name: 'Procuração Eletrônica - eCAC', category: 'procuracao', clientId: 'cli2', date: '2024-06-10', notes: 'Procuração para acesso ao eCAC' },
      { id: 'doc3', name: 'Balanço Patrimonial 2024', category: 'financial', clientId: 'cli2', date: '2025-03-30', notes: 'Exercício social 2024' },
      { id: 'doc4', name: 'CND Federal', category: 'certidao', clientId: 'cli1', date: '2025-06-01', notes: 'Válida até 12/2025' },
      { id: 'doc5', name: 'Contrato Social', category: 'contract', clientId: 'cli3', date: '2023-09-20', notes: '5ª alteração contratual' },
      { id: 'doc6', name: 'DRE 2024', category: 'financial', clientId: 'cli4', date: '2025-03-30', notes: 'Demonstração de Resultado do Exercício' },
      { id: 'doc7', name: 'Procuração Eletrônica - eCAC', category: 'procuracao', clientId: 'cli5', date: '2024-08-15', notes: '' },
      { id: 'doc8', name: 'CCMEI', category: 'certidao', clientId: 'cli6', date: '2024-06-01', notes: 'Certificado da Condição de MEI' },
    ];
  }

  function _defaultEvents() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return [
      { id: 'evt1', title: 'DCTF Mensal', type: 'fiscal', date: _dateStr(y, m + 1, 15), clientId: 'cli2', notes: '' },
      { id: 'evt2', title: 'DAS - Simples Nacional', type: 'fiscal', date: _dateStr(y, m + 1, 20), clientId: null, notes: 'Todos os clientes SN' },
      { id: 'evt3', title: 'SPED Fiscal', type: 'fiscal', date: _dateStr(y, m + 1, 10), clientId: 'cli5', notes: '' },
      { id: 'evt4', title: 'EFD Contribuições', type: 'fiscal', date: _dateStr(y, m + 1, 12), clientId: 'cli2', notes: '' },
      { id: 'evt5', title: 'Reunião trimestral', type: 'meeting', date: _dateStr(y, m, now.getDate() + 3), clientId: 'cli2', notes: 'Revisão de resultados' },
      { id: 'evt6', title: 'Folha de Pagamento', type: 'deadline', date: _dateStr(y, m + 1, 5), clientId: null, notes: 'Prazo para envio de todas as folhas' },
      { id: 'evt7', title: 'eSocial - Periódicos', type: 'fiscal', date: _dateStr(y, m + 1, 7), clientId: null, notes: '' },
      { id: 'evt8', title: 'GPS / INSS', type: 'fiscal', date: _dateStr(y, m + 1, 20), clientId: null, notes: '' },
      { id: 'evt9', title: 'FGTS - GRF', type: 'fiscal', date: _dateStr(y, m + 1, 7), clientId: null, notes: '' },
      { id: 'evt10', title: 'Revisão processos internos', type: 'internal', date: _dateStr(y, m, now.getDate() + 5), clientId: null, notes: '' },
      { id: 'evt11', title: 'IRPJ/CSLL Trimestral', type: 'fiscal', date: _dateStr(y, m + 1, 30), clientId: 'cli2', notes: 'Lucro Presumido' },
      { id: 'evt12', title: 'ISS Mensal', type: 'fiscal', date: _dateStr(y, m + 1, 10), clientId: 'cli4', notes: '' },
    ];
  }

  function _defaultActivities() {
    const now = new Date();
    return [
      { id: 'act1', text: 'Fatura de <strong>Tech Solutions</strong> recebida', type: 'success', time: _timeAgo(1) },
      { id: 'act2', text: 'Novo serviço criado para <strong>Construtora Horizonte</strong>', type: 'primary', time: _timeAgo(3) },
      { id: 'act3', text: 'eSocial de <strong>Sabor & Arte</strong> marcado como atrasado', type: 'danger', time: _timeAgo(5) },
      { id: 'act4', text: 'DAS de <strong>Tech Solutions</strong> concluído', type: 'success', time: _timeAgo(8) },
      { id: 'act5', text: 'Documento adicionado para <strong>Vida Plena</strong>', type: 'primary', time: _timeAgo(12) },
      { id: 'act6', text: 'Fatura vencida de <strong>AutoPeças Central</strong>', type: 'warning', time: _timeAgo(24) },
    ];
  }

  function _timeAgo(hours) {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d.toISOString();
  }

  // ---- Public API ----
  async function init() {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();

    try {
      const docSnap = await db.collection('crm_data').doc('main').get();
      if (docSnap.exists) {
        inMemoryData = docSnap.data();
      } else {
        inMemoryData = _getDefaultData();
        await db.collection('crm_data').doc('main').set(inMemoryData);
      }
    } catch (err) {
      console.error("Firebase fetch failed, falling back to default data", err);
      inMemoryData = _getDefaultData();
    }
  }

  function resetData() {
    _saveAll(_getDefaultData());
  }

  function getCollection(name) {
    const data = _getAll();
    return data ? (data[name] || []) : [];
  }

  function getById(collection, id) {
    const items = getCollection(collection);
    return items.find(item => item.id === id) || null;
  }

  function add(collection, item) {
    const data = _getAll();
    if (!data[collection]) data[collection] = [];
    item.id = item.id || _generateId();
    data[collection].push(item);
    _saveAll(data);
    return item;
  }

  function update(collection, id, updates) {
    const data = _getAll();
    const items = data[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    data[collection] = items;
    _saveAll(data);
    return items[index];
  }

  function remove(collection, id) {
    const data = _getAll();
    const items = data[collection] || [];
    data[collection] = items.filter(item => item.id !== id);
    _saveAll(data);
  }

  function getOffice() {
    const data = _getAll();
    return (data && data.office) || {};
  }

  function updateOffice(updates) {
    const data = _getAll();
    data.office = { ...data.office, ...updates };
    _saveAll(data);
    return data.office;
  }

  function query(collection, filterFn) {
    const items = getCollection(collection);
    return filterFn ? items.filter(filterFn) : items;
  }

  return { init, resetData, getCollection, getById, add, update, remove, getOffice, updateOffice, query };
})();
