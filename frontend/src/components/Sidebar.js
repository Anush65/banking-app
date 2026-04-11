import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerNav = () => (
  <>
    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">🏠</span> Dashboard
    </NavLink>
  </>
);

const AdminNav = () => (
  <>
    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">📊</span> Overview
    </NavLink>
    <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">👥</span> Customers
    </NavLink>
    <NavLink to="/admin/accounts" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">💳</span> Accounts
    </NavLink>
    <NavLink to="/admin/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">💸</span> Transactions
    </NavLink>
    <NavLink to="/admin/audit-logs" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">📋</span> Audit Logs
    </NavLink>
    <NavLink to="/admin/branches" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">🏦</span> Branches
    </NavLink>
  </>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🏦 NexaBank</h2>
        <p>Banking System</p>
      </div>

      <nav className="sidebar-nav">
        {user?.role === 'admin' ? <AdminNav /> : <CustomerNav />}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="name">
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </div>
          <div className="role">{user?.role}</div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}