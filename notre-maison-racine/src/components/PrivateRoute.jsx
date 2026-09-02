import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function PrivateRoute({ children }) {
  const { session, initializing } = useAuth();

  if (initializing) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
