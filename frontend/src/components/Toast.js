import React, { useState, useCallback, useRef } from 'react';

let toastFn = null;

export function useToast() {
  return {
    toast: (msg, type = 'success') => toastFn && toastFn(msg, type),
  };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  toastFn = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type] || '🔔'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}