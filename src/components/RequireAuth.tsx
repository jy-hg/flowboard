import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" className="sr-only">
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;

  return <>{children}</>;
}
