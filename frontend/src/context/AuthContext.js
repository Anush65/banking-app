import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('banking_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('banking_token');
      if (savedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const res = await api.get('/api/me');
          setUser(res.data);
          setToken(savedToken);
        } catch {
          localStorage.removeItem('banking_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/api/login', { username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('banking_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('banking_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};