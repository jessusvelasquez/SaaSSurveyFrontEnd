import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading');

  useEffect(() => {
    getCurrentUser()
      .then(() => setStatus('auth'))
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading')
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span>Verificando sesión...</span>
      </div>
    );

  if (status === 'unauth') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
