import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminCustomers from './pages/AdminCustomers';
import AdminAccounts from './pages/AdminAccounts';
import AdminTransactions from './pages/AdminTransactions';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminBranches from './pages/AdminBranches';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /> Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /> Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />} />

      <Route path="/dashboard" element={
        <PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>
      } />

      <Route path="/admin" element={
        <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
      } />
      <Route path="/admin/customers" element={
        <PrivateRoute role="admin"><AdminCustomers /></PrivateRoute>
      } />
      <Route path="/admin/accounts" element={
        <PrivateRoute role="admin"><AdminAccounts /></PrivateRoute>
      } />
      <Route path="/admin/transactions" element={
        <PrivateRoute role="admin"><AdminTransactions /></PrivateRoute>
      } />
      <Route path="/admin/audit-logs" element={
        <PrivateRoute role="admin"><AdminAuditLogs /></PrivateRoute>
      } />
      <Route path="/admin/branches" element={
        <PrivateRoute role="admin"><AdminBranches /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}