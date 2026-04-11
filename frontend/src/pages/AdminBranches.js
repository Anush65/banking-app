import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/api/admin/branches')
      .then(res => setBranches(res.data))
      .catch(() => toast('Failed to load branches.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const totalAccounts = branches.reduce((s, b) => s + parseInt(b.account_count || 0), 0);
  const totalDeposits = branches.reduce((s, b) => s + parseFloat(b.total_deposits || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Branch Network</h1>
          <span className="badge badge-success">{branches.length} Branches</span>
        </div>

        <div className="page-body">
          <div className="stats-grid">
            <div className="stat-card navy">
              <div className="stat-icon">🏦</div>
              <div className="stat-value">{branches.length}</div>
              <div className="stat-label">Total Branches</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-value">{totalAccounts}</div>
              <div className="stat-label">Total Accounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{formatCurrency(totalDeposits)}</div>
              <div className="stat-label">Total Deposits</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
            {branches.map(b => (
              <div key={b.branch_id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                        Branch #{b.branch_id}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginTop: 4 }}>{b.branch_name}</h3>
                    </div>
                    <span className="badge badge-info">{b.city}</span>
                  </div>

                  <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 2 }}>IFSC Code</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', fontSize: '1rem', letterSpacing: '0.05em' }}>
                      {b.ifsc_code}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', color: 'var(--navy)' }}>{b.account_count}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accounts</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1rem', color: 'var(--navy)' }}>{formatCurrency(b.total_deposits)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deposits</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><h3>Branch Summary Table</h3></div>
            <div className="table-wrap">
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /> Loading…</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Branch Name</th>
                      <th>City</th>
                      <th>IFSC Code</th>
                      <th>Accounts</th>
                      <th>Total Deposits</th>
                      <th>Avg Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.branch_id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>#{b.branch_id}</td>
                        <td style={{ fontWeight: 600 }}>{b.branch_name}</td>
                        <td>{b.city}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.ifsc_code}</td>
                        <td><span className="badge badge-purple">{b.account_count}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatCurrency(b.total_deposits)}</td>
                        <td style={{ color: 'var(--muted)' }}>
                          {b.account_count > 0 ? formatCurrency(b.total_deposits / b.account_count) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}