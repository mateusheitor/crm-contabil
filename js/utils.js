/* ============================================
   CRM Contábil — Utility Functions
   ============================================ */

var Utils = (() => {
  // ---- Formatação ----
  function formatCPF(cpf) {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    const digits = cnpj.replace(/\D/g, '');
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  function formatPhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return phone;
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateISO(date) {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    return date.toISOString().split('T')[0];
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDate(dateStr);
  }

  // ---- Meses ----
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function getMonthName(month) { return MONTHS[month] || ''; }
  function getMonthShort(month) { return MONTHS_SHORT[month] || ''; }

  // ---- Validação ----
  function validateCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[9]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    return parseInt(digits[10]) === check;
  }

  function validateCNPJ(cnpj) {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
    let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(digits[12]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
    check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(digits[13]) === check;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ---- Helpers ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getAvatarColor(str) {
    const colors = ['#6c63ff', '#00d4aa', '#ffa726', '#42a5f5', '#ef5350', '#ab47bc', '#26a69a', '#ec407a', '#7e57c2', '#66bb6a'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.ceil((target - today) / 86400000);
  }

  // ---- Enums / Maps ----
  const REGIME_MAP = {
    'Simples Nacional': { badge: 'badge-primary', short: 'SN' },
    'Lucro Presumido': { badge: 'badge-warning', short: 'LP' },
    'Lucro Real': { badge: 'badge-danger', short: 'LR' },
    'MEI': { badge: 'badge-success', short: 'MEI' }
  };

  const SERVICE_STATUS_MAP = {
    'pending': { label: 'Pendente', badge: 'badge-warning', color: 'warning' },
    'in_progress': { label: 'Em Andamento', badge: 'badge-info', color: 'info' },
    'done': { label: 'Concluído', badge: 'badge-success', color: 'success' },
    'overdue': { label: 'Atrasado', badge: 'badge-danger', color: 'danger' }
  };

  const INVOICE_STATUS_MAP = {
    'pending': { label: 'Pendente', badge: 'badge-warning' },
    'paid': { label: 'Pago', badge: 'badge-success' },
    'overdue': { label: 'Vencido', badge: 'badge-danger' },
    'cancelled': { label: 'Cancelado', badge: 'badge-neutral' }
  };

  const SERVICE_TYPE_MAP = {
    'fiscal': { label: 'Fiscal', badge: 'badge-danger' },
    'contabil': { label: 'Contábil', badge: 'badge-primary' },
    'dp': { label: 'Depto. Pessoal', badge: 'badge-info' },
    'consultoria': { label: 'Consultoria', badge: 'badge-warning' }
  };

  const DOC_CATEGORY_MAP = {
    'contract': { label: 'Contrato', icon: 'contract', class: 'contract' },
    'procuracao': { label: 'Procuração', icon: 'fiscal', class: 'fiscal' },
    'certidao': { label: 'Certidão', icon: 'fiscal', class: 'fiscal' },
    'financial': { label: 'Financeiro', icon: 'financial', class: 'financial' },
    'fiscal': { label: 'Fiscal', icon: 'fiscal', class: 'fiscal' },
    'other': { label: 'Outros', icon: 'other', class: 'other' }
  };

  const PRIORITY_MAP = {
    'low': { label: 'Baixa', badge: 'badge-neutral' },
    'medium': { label: 'Média', badge: 'badge-warning' },
    'high': { label: 'Alta', badge: 'badge-danger' },
    'critical': { label: 'Crítica', badge: 'badge-danger' }
  };

  const EVENT_TYPE_MAP = {
    'fiscal': { label: 'Fiscal', class: 'fiscal', color: 'var(--accent-danger)' },
    'meeting': { label: 'Reunião', class: 'meeting', color: 'var(--accent-info)' },
    'internal': { label: 'Interno', class: 'internal', color: 'var(--accent-secondary)' },
    'deadline': { label: 'Prazo', class: 'deadline', color: 'var(--accent-warning)' }
  };

  // ---- CSV Export ----
  function exportCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(';'),
      ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return {
    formatCPF, formatCNPJ, formatPhone, formatCurrency, formatDate, formatDateTime, formatDateISO,
    timeAgo, getMonthName, getMonthShort, MONTHS, MONTHS_SHORT, WEEKDAYS,
    validateCPF, validateCNPJ, validateEmail,
    generateId, debounce, getInitials, getAvatarColor, escapeHtml, daysUntil,
    REGIME_MAP, SERVICE_STATUS_MAP, INVOICE_STATUS_MAP, SERVICE_TYPE_MAP, DOC_CATEGORY_MAP, PRIORITY_MAP, EVENT_TYPE_MAP,
    exportCSV
  };
})();
