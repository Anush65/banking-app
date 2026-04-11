import React, { useState } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';

function ModalBase({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── DEPOSIT MODAL ────────────────────────────────────── */
export function DepositModal({ account, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid positive amount.');
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/deposit', { account_id: account.account_id, amount: amt });
      onSuccess(res.data.message, res.data.new_balance);
    } catch (err) {
      setError(err.response?.data?.error || 'Deposit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="💰 Deposit Funds" onClose={onClose}>
      <div className="modal-body">
        <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account #{account.account_id}</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'DM Serif Display, serif', color: 'var(--navy)', marginTop: 4 }}>{formatCurrency(account.balance)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{account.type_name} · {account.branch_name}</div>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input
            className="form-control"
            type="number" min="1" step="0.01"
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {[500, 1000, 5000, 10000].map(q => (
            <button key={q} className="btn btn-outline btn-sm" onClick={() => setAmount(String(q))}>+₹{q.toLocaleString()}</button>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing…' : '✓ Deposit'}
        </button>
      </div>
    </ModalBase>
  );
}

/* ── WITHDRAW MODAL ───────────────────────────────────── */
export function WithdrawModal({ account, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const available = Math.max(0, parseFloat(account.balance) - parseFloat(account.minimum_balance));

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid positive amount.');
    if (amt > available) return setError(`Maximum withdrawable amount is ${formatCurrency(available)}.`);
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/withdraw', { account_id: account.account_id, amount: amt });
      onSuccess(res.data.message, res.data.new_balance);
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="🏧 Withdraw Funds" onClose={onClose}>
      <div className="modal-body">
        <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account #{account.account_id}</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'DM Serif Display, serif', color: 'var(--navy)', marginTop: 4 }}>{formatCurrency(account.balance)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            Available to withdraw: <strong style={{ color: 'var(--success)' }}>{formatCurrency(available)}</strong>
            {parseFloat(account.minimum_balance) > 0 && ` (min. balance: ${formatCurrency(account.minimum_balance)})`}
          </div>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input
            className="form-control"
            type="number" min="1" step="0.01" max={available}
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setAmount(String(available))}>
          Withdraw Max ({formatCurrency(available)})
        </button>
      </div>
      <div className="modal-footer">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing…' : '↑ Withdraw'}
        </button>
      </div>
    </ModalBase>
  );
}

/* ── TRANSFER MODAL ───────────────────────────────────── */
export function TransferModal({ account, allAccounts, onClose, onSuccess }) {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const available = Math.max(0, parseFloat(account.balance) - parseFloat(account.minimum_balance));
  const otherAccounts = allAccounts.filter(a => a.account_id !== account.account_id);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!toAccount) return setError('Select a destination account.');
    if (!amt || amt <= 0) return setError('Enter a valid positive amount.');
    if (amt > available) return setError(`Insufficient balance. Available: ${formatCurrency(available)}`);
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/transfer', {
        from_account_id: account.account_id,
        to_account_id: parseInt(toAccount),
        amount: amt,
      });
      onSuccess(res.data.message, res.data.sender_new_balance);
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase title="↔️ Transfer Funds" onClose={onClose}>
      <div className="modal-body">
        <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From: Account #{account.account_id}</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'DM Serif Display, serif', color: 'var(--navy)', marginTop: 4 }}>{formatCurrency(account.balance)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            Available: <strong style={{ color: 'var(--success)' }}>{formatCurrency(available)}</strong>
          </div>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <div className="form-group">
          <label className="form-label">To Account</label>
          <input
            className="form-control"
            type="number"
            placeholder="Enter destination account ID"
            value={toAccount}
            onChange={e => setToAccount(e.target.value)}
          />
          {otherAccounts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 6 }}>Your other accounts:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {otherAccounts.map(a => (
                  <button key={a.account_id} className="btn btn-outline btn-sm"
                    onClick={() => setToAccount(String(a.account_id))}>
                    #{a.account_id} ({a.type_name})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input
            className="form-control"
            type="number" min="1" step="0.01"
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing…' : '→ Transfer'}
        </button>
      </div>
    </ModalBase>
  );
}