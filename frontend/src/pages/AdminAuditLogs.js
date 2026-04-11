import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/format';

const actionColor = (action) => {
  const map = {
    DEPOSIT: 'success', WITHDRAWAL: 'danger',
    TRANSFER_DEBIT: 'warning', TRANSFER_CREDIT: 'info',
  };
  return map[action?.toUpperCase()] || 'gray';
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    api.get('/api/admin/audit-logs?limit=200')
      .then(res => setLogs(res.data))
      .catch(() => toast('Failed to load audit logs.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    `${l.action} ${l.remarks} ${l.first_name} ${l.last_name} ${l.log_id} ${l.transaction_id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Audit Logs</h1>
          <span className="badge badge-info">{filtered.length} entries</span>
        </div>

        <div className="page-body">
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            ℹ️ The audit log records every banking operation performed in the system. All entries are immutable.
          </div>

          <div className="card">
            <div className="card-header">
              <h3>System Audit Trail</h3>
              <input
                className="form-control"
                style={{ width: 280 }}
                placeholder="🔍 Search logs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /> Loading audit logs…</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No audit log entries found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Transaction</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.log_id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: '0.8rem' }}>#{l.log_id}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(l.timestamp)}
                        </td>
                        <td>
                          <span className={`badge badge-${actionColor(l.action)}`}>{l.action}</span>
                        </td>
                        <td>
                          {l.transaction_id ? (
                            <div>
                              <span className="badge badge-gray">Tx #{l.transaction_id}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 5 }}>Acct #{l.account_id}</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {l.first_name ? `${l.first_name} ${l.last_name}` : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>
                          {l.amount ? formatCurrency(l.amount) : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: 280 }}>
                          {l.remarks}
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