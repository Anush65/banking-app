import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency, formatDateTime, txTypeLabel, txTypeColor } from '../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => toast('Failed to load dashboard stats.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="loading-spinner"><div className="spinner" /> Loading dashboard…</div>
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Admin Overview</h1>
          <div style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="page-body">
          {/* KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card navy" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/customers')}>
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats?.total_customers ?? 0}</div>
              <div className="stat-label">Total Customers</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/accounts')}>
              <div className="stat-icon">💳</div>
              <div className="stat-value">{stats?.total_accounts ?? 0}</div>
              <div className="stat-label">Active Accounts</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/transactions')}>
              <div className="stat-icon">💸</div>
              <div className="stat-value">{stats?.monthly_transactions ?? 0}</div>
              <div className="stat-label">Transactions (30d)</div>
            </div>
            <div className="stat-card navy">
              <div className="stat-icon">🏦</div>
              <div className="stat-value">{formatCurrency(stats?.total_balance ?? 0)}</div>
              <div className="stat-label">Total Deposits</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Top Transactions */}
            <div className="card">
              <div className="card-header">
                <h3>🏆 Top 5 Transactions</h3>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/transactions')}>View All</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.top_transactions || []).map(tx => (
                      <tr key={tx.transaction_id}>
                        <td style={{ fontWeight: 500 }}>{tx.first_name} {tx.last_name}</td>
                        <td>
                          <span style={{ color: txTypeColor(tx.transaction_type), fontWeight: 600, fontSize: '0.82rem' }}>
                            {txTypeLabel(tx.transaction_type)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Balance Accounts */}
            <div className="card">
              <div className="card-header">
                <h3>⚠️ Low Balance Accounts</h3>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/accounts')}>View All</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Customer</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.low_balance_accounts || []).map(acc => (
                      <tr key={acc.account_id}>
                        <td>
                          <span className="badge badge-gray">#{acc.account_id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 6 }}>{acc.type_name}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{acc.first_name} {acc.last_name}</td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: parseFloat(acc.balance) <= parseFloat(acc.minimum_balance) * 1.2 ? 'var(--danger)' : 'var(--warning)'
                          }}>
                            {formatCurrency(acc.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header"><h3>⚡ Quick Actions</h3></div>
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/admin/customers')}>
                ➕ Add Customer
              </button>
              <button className="btn btn-gold" onClick={() => navigate('/admin/accounts')}>
                💳 Create Account
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/transactions')}>
                📊 All Transactions
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/audit-logs')}>
                📋 Audit Logs
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/admin/branches')}>
                🏦 Branch Data
              </button>
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}