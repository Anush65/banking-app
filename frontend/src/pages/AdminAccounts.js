import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';

function CreateAccountModal({ onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [form, setForm] = useState({ customer_id: '', branch_id: '', account_type_id: '', initial_balance: '' });
  const [minBalance, setMinBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/customers'),
      api.get('/api/admin/branches'),
      api.get('/api/admin/account-types'),
    ]).then(([c, b, at]) => {
      setCustomers(c.data);
      setBranches(b.data);
      setAccountTypes(at.data);
    });
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'account_type_id') {
      const at = accountTypes.find(t => t.account_type_id === parseInt(v));
      setMinBalance(at ? parseFloat(at.minimum_balance) : 0);
    }
  };

  const handleSubmit = async () => {
    if (!form.customer_id || !form.branch_id || !form.account_type_id)
      return setError('All fields except initial balance are required.');
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/admin/accounts', {
        ...form,
        customer_id: parseInt(form.customer_id),
        branch_id: parseInt(form.branch_id),
        account_type_id: parseInt(form.account_type_id),
        initial_balance: parseFloat(form.initial_balance) || 0,
      });
      onSuccess(`Account #${res.data.account_id} created successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>💳 Create New Account</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-control" value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>
                  #{c.customer_id} — {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Branch *</label>
            <select className="form-control" value={form.branch_id} onChange={e => set('branch_id', e.target.value)}>
              <option value="">Select branch…</option>
              {branches.map(b => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}, {b.city} ({b.ifsc_code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Account Type *</label>
            <select className="form-control" value={form.account_type_id} onChange={e => set('account_type_id', e.target.value)}>
              <option value="">Select type…</option>
              {accountTypes.map(at => (
                <option key={at.account_type_id} value={at.account_type_id}>
                  {at.type_name} (Min: ₹{at.minimum_balance})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Balance (₹)</label>
            <input
              className="form-control"
              type="number" min={minBalance} step="0.01"
              placeholder={`Minimum: ₹${minBalance}`}
              value={form.initial_balance}
              onChange={e => set('initial_balance', e.target.value)}
            />
            {minBalance > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 5 }}>
                Minimum required balance: {formatCurrency(minBalance)}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : '✓ Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = () => {
    setLoading(true);
    api.get('/api/admin/accounts')
      .then(res => setAccounts(res.data))
      .catch(() => toast('Failed to load accounts.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = accounts.filter(a =>
    `${a.first_name} ${a.last_name} ${a.account_id} ${a.type_name} ${a.branch_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (msg) => {
    toast(msg, 'success');
    setShowModal(false);
    fetchAccounts();
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Accounts</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>💳 Create Account</button>
        </div>

        <div className="page-body">
          <div className="card">
            <div className="card-header">
              <h3>All Accounts ({filtered.length})</h3>
              <input
                className="form-control"
                style={{ width: 260 }}
                placeholder="🔍 Search accounts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /> Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <p>No accounts found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Acct ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Branch</th>
                      <th>Balance</th>
                      <th>Min Balance</th>
                      <th>Opened</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.account_id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>#{a.account_id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.first_name} {a.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Cust #{a.customer_id}</div>
                        </td>
                        <td><span className="badge badge-purple">{a.type_name}</span></td>
                        <td>
                          <div>{a.branch_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{a.city}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatCurrency(a.balance)}</td>
                        <td style={{ color: 'var(--muted)' }}>{formatCurrency(a.minimum_balance)}</td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{formatDate(a.opened_date)}</td>
                        <td>
                          <span className={`badge badge-${a.status === 'active' ? 'success' : a.status === 'frozen' ? 'info' : 'warning'}`}>
                            {a.status}
                          </span>
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

      {showModal && <CreateAccountModal onClose={() => setShowModal(false)} onSuccess={handleCreated} />}
      <ToastContainer />
    </div>
  );
}