import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ToastContainer, { useToast } from '../components/Toast';
import { DepositModal, WithdrawModal, TransferModal } from '../components/BankingModals';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatDateTime, txTypeLabel, txTypeColor } from '../utils/format';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, account }

  const fetchData = useCallback(async () => {
    if (!user?.customer_id) return;
    try {
      const [accRes, txRes] = await Promise.all([
        api.get(`/api/customer/${user.customer_id}/accounts`),
        api.get(`/api/customer/${user.customer_id}/transactions?limit=20`),
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      toast('Failed to load account data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const openModal = (type, account) => setModal({ type, account });
  const closeModal = () => setModal(null);

  const handleOperationSuccess = (message, newBalance) => {
    toast(message, 'success');
    closeModal();
    fetchData();
  };

  const txTypeClass = (type) => {
    const map = { deposit: 'tx-deposit', withdrawal: 'tx-withdrawal', transfer_debit: 'tx-transfer-out', transfer_credit: 'tx-transfer-in' };
    return map[type] || '';
  };

  const isCredit = (type) => type === 'deposit' || type === 'transfer_credit';

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="loading-spinner"><div className="spinner" /> Loading your accounts…</div>
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1>Welcome back, {user?.first_name || user?.username} 👋</h1>
          <div style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="page-body">
          {/* Summary stats */}
          <div className="stats-grid">
            <div className="stat-card navy">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{formatCurrency(totalBalance)}</div>
              <div className="stat-label">Total Balance</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-value">{accounts.length}</div>
              <div className="stat-label">Active Accounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{transactions.length}</div>
              <div className="stat-label">Recent Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{transactions.filter(t => t.status === 'success').length}</div>
              <div className="stat-label">Successful Ops</div>
            </div>
          </div>

          {/* Account Cards */}
          <h2 className="section-title">Your Accounts</h2>
          {accounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏦</div>
              <p>No accounts found. Contact your branch to open an account.</p>
            </div>
          ) : (
            <div className="account-cards">
              {accounts.map(acc => (
                <div key={acc.account_id} className="account-card">
                  <span className="ac-status">
                    <span className={`badge badge-${acc.status === 'active' ? 'success' : 'warning'}`}>{acc.status}</span>
                  </span>
                  <div className="ac-type">{acc.type_name} Account</div>
                  <div className="ac-id">Account #{acc.account_id}</div>
                  <div className="ac-balance">{formatCurrency(acc.balance)}</div>
                  <div className="ac-branch">{acc.branch_name}, {acc.city}</div>
                  <div className="ac-branch" style={{ marginTop: 2 }}>IFSC: {acc.ifsc_code}</div>
                  {acc.status === 'active' && (
                    <div className="ac-actions">
                      <button className="btn" onClick={() => openModal('deposit', acc)}>💰 Deposit</button>
                      <button className="btn" onClick={() => openModal('withdraw', acc)}>🏧 Withdraw</button>
                      <button className="btn" onClick={() => openModal('transfer', acc)}>↔️ Transfer</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Transactions</h3>
              <span className="badge badge-info">{transactions.length} records</span>
            </div>
            <div className="table-wrap">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Tx ID</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.transaction_id}>
                        <td style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>#{tx.transaction_id}</td>
                        <td>
                          <span className="badge badge-gray">#{tx.account_id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 6 }}>{tx.account_type}</span>
                        </td>
                        <td>
                          <span style={{ color: txTypeColor(tx.transaction_type), fontWeight: 600, fontSize: '0.85rem' }}>
                            {txTypeLabel(tx.transaction_type)}
                          </span>
                        </td>
                        <td>
                          <span className={isCredit(tx.transaction_type) ? 'amount-positive' : 'amount-negative'}>
                            {isCredit(tx.transaction_type) ? '+' : '−'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{formatDateTime(tx.transaction_time)}</td>
                        <td>
                          <span className={`badge badge-${tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}`}>
                            {tx.status}
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

      {/* Modals */}
      {modal?.type === 'deposit' && (
        <DepositModal account={modal.account} onClose={closeModal} onSuccess={handleOperationSuccess} />
      )}
      {modal?.type === 'withdraw' && (
        <WithdrawModal account={modal.account} onClose={closeModal} onSuccess={handleOperationSuccess} />
      )}
      {modal?.type === 'transfer' && (
        <TransferModal account={modal.account} allAccounts={accounts} onClose={closeModal} onSuccess={handleOperationSuccess} />
      )}

      <ToastContainer />
    </div>
  );
}