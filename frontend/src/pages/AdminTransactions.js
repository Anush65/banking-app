import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency, formatDateTime, txTypeLabel, txTypeColor } from '../utils/format';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    api.get('/api/admin/transactions?limit=200')
      .then(res => setTransactions(res.data))
      .catch(() => toast('Failed to load transactions.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t => {
    const matchSearch = `${t.first_name} ${t.last_name} ${t.account_id} ${t.transaction_id}`.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.transaction_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalAmount = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const isCredit = t => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_credit';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>All Transactions</h1>
          <span className="badge badge-info">{filtered.length} records</span>
        </div>

        <div className="page-body">
          {/* Summary */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {['deposit', 'withdrawal', 'transfer_debit', 'transfer_credit'].map(type => {
              const count = transactions.filter(t => t.transaction_type === type).length;
              const icons = { deposit: '💰', withdrawal: '🏧', transfer_debit: '↗️', transfer_credit: '↙️' };
              return (
                <div key={type} className="stat-card" style={{ cursor: 'pointer' }}
                  onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>
                  <div className="stat-icon">{icons[type]}</div>
                  <div className="stat-value">{count}</div>
                  <div className="stat-label">{txTypeLabel(type)}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Transaction History</h3>
              <div className="flex-gap">
                <select className="form-control" style={{ width: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="transfer_debit">Transfer Out</option>
                  <option value="transfer_credit">Transfer In</option>
                </select>
                <input
                  className="form-control"
                  style={{ width: 220 }}
                  placeholder="🔍 Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-wrap">
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /> Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💸</div>
                  <p>No transactions found.</p>
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>Customer</th>
                        <th>Account</th>
                        <th>Branch</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t => (
                        <tr key={t.transaction_id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>#{t.transaction_id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{t.first_name} {t.last_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Cust #{t.customer_id}</div>
                          </td>
                          <td>
                            <span className="badge badge-gray">#{t.account_id}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 5 }}>{t.account_type}</span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{t.branch_name}</td>
                          <td>
                            <span style={{ color: txTypeColor(t.transaction_type), fontWeight: 600, fontSize: '0.83rem' }}>
                              {txTypeLabel(t.transaction_type)}
                            </span>
                          </td>
                          <td>
                            <span className={isCredit(t) ? 'amount-positive' : 'amount-negative'}>
                              {isCredit(t) ? '+' : '−'}{formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{formatDateTime(t.transaction_time)}</td>
                          <td>
                            <span className={`badge badge-${t.status === 'success' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--cream-2)', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Showing {filtered.length} of {transactions.length} transactions</span>
                    <span>Total volume: <strong style={{ color: 'var(--navy)' }}>{formatCurrency(totalAmount)}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}