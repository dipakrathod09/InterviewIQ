import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LoadingState } from '../ui';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingState label="Opening your workspace…" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
