import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';

function AddCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '',
    username: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email)
      return setError('First name, last name, and email are required.');
    setLoading(true); setError('');
    try {
      await api.post('/api/admin/customers', form);
      onSuccess('Customer created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>➕ Add New Customer</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-control" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-control" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ borderTop: '1px solid var(--cream-2)', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Login Credentials (Optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                <input className="form-control" value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : '✓ Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/api/admin/customers')
      .then(res => setCustomers(res.data))
      .catch(() => toast('Failed to load customers.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (msg) => {
    toast(msg, 'success');
    setShowModal(false);
    fetchCustomers();
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Customers</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Customer</button>
        </div>

        <div className="page-body">
          <div className="card">
            <div className="card-header">
              <h3>All Customers ({filtered.length})</h3>
              <input
                className="form-control"
                style={{ width: 260 }}
                placeholder="🔍 Search by name, email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /> Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p>No customers found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Username</th>
                      <th>Accounts</th>
                      <th>Total Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.customer_id}>
                        <td style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>#{c.customer_id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.address?.substring(0, 40)}{c.address?.length > 40 ? '…' : ''}</div>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{c.email}</td>
                        <td style={{ color: 'var(--muted)' }}>{c.phone || '—'}</td>
                        <td>
                          {c.username
                            ? <span className="badge badge-info">{c.username}</span>
                            : <span className="badge badge-gray">No login</span>
                          }
                        </td>
                        <td><span className="badge badge-purple">{c.account_count}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatCurrency(c.total_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onSuccess={handleCreated} />}
      <ToastContainer />
    </div>
  );
}