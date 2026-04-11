export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  export const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };
  
  export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };
  
  export const txTypeLabel = (type) => {
    const map = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      transfer_debit: 'Transfer Out',
      transfer_credit: 'Transfer In',
    };
    return map[type] || type;
  };
  
  export const txTypeColor = (type) => {
    const map = {
      deposit: '#22c55e',
      withdrawal: '#ef4444',
      transfer_debit: '#f97316',
      transfer_credit: '#3b82f6',
    };
    return map[type] || '#6b7280';
  };