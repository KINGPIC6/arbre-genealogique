import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import FamilyGate from './components/FamilyGate';
import LoadingScreen from './components/LoadingScreen';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Tree from './pages/Tree';
import Albums from './pages/Albums';
import AlbumDetail from './pages/AlbumDetail';
import History from './pages/History';
import Calendar from './pages/Calendar';
import Contributions from './pages/Contributions';
import Expenses from './pages/Expenses';
import Members from './pages/Members';
import JoinRequests from './pages/JoinRequests';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminHome from './pages/AdminHome';
import AdminMembers from './pages/AdminMembers';
import AdminRequests from './pages/AdminRequests';
import AdminSecurity from './pages/AdminSecurity';

function RootRedirect() {
  const { initializing, session } = useAuth();
  if (initializing) return <LoadingScreen />;
  return <Navigate to={session ? '/dashboard' : '/'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Onboarding : connecté, mais pas encore rattaché à une famille */}
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }
      />

      {/* Privées */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Dashboard />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/tree"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Tree />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/albums"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Albums />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/albums/:id"
        element={
          <PrivateRoute>
            <FamilyGate>
              <AlbumDetail />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <FamilyGate>
              <History />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Calendar />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/contributions"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Contributions />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Expenses />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/members"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Members />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/join-requests"
        element={
          <PrivateRoute>
            <FamilyGate>
              <JoinRequests />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Activity />
            </FamilyGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <FamilyGate>
              <Settings />
            </FamilyGate>
          </PrivateRoute>
        }
      />

      {/* Admin : la vraie barrière est côté base de données (RLS), ceci est un confort d'UX */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminHome />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <AdminRoute>
            <AdminMembers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <AdminRequests />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <AdminRoute>
            <AdminSecurity />
          </AdminRoute>
        }
      />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
