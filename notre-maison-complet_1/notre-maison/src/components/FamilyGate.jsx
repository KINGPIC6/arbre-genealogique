import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

// Un utilisateur connecté mais sans famille ne doit voir aucune donnée privée
// tant qu'il n'a pas créé ou rejoint une famille.
export default function FamilyGate({ children }) {
  const { profileLoading, hasFamily } = useAuth();

  if (profileLoading) return <LoadingScreen />;
  if (!hasFamily) return <Navigate to="/onboarding" replace />;

  return children;
}
