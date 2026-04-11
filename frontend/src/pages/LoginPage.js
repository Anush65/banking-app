import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Please enter your credentials.');
    setLoading(true); setError('');
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u, p) => { setUsername(u); setPassword(p); setError(''); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">🏦</div>
          <h1>NexaBank</h1>
          <p>Secure Banking Portal</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in…' : '→ Sign In'}
          </button>
        </form>

        <div className="login-creds">
          <strong>Demo Credentials</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn btn-outline btn-sm" onClick={() => quickFill('admin', 'admin123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}>
              👑 Admin — admin / admin123
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => quickFill('customer1', 'pass123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}>
              👤 Customer 1 — customer1 / pass123 (Arjun Sharma)
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => quickFill('customer2', 'pass123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}>
              👤 Customer 2 — customer2 / pass123 (Priya Patel)
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => quickFill('customer3', 'pass123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}>
              👤 Customer 3 — customer3 / pass123 (Rahul Gupta)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}