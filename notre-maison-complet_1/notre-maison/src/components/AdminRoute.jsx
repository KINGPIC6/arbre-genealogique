import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

// Rappel : cette vérification est un confort d'UX côté frontend.
// La véritable barrière de sécurité est la policy RLS côté base de données
// (is_admin() lu depuis la table profiles), qui protège les données
// quoi qu'il arrive côté client.
export default function AdminRoute({ children }) {
  const { session, initializing, profileLoading, isAdmin } = useAuth();

  if (initializing || profileLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
