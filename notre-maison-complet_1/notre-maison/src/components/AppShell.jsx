import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';

const FAMILY_NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/tree', label: '🌳 Arbre généalogique' },
  { to: '/albums', label: '📷 Album photo' },
  { to: '/history', label: '📜 Notre histoire' },
  { to: '/calendar', label: '🎂 Anniversaires' },
];

const FINANCE_NAV_ITEMS = [
  { to: '/contributions', label: 'Contributions' },
  { to: '/expenses', label: 'Dépenses' },
  { to: '/members', label: 'Membres' },
  { to: '/join-requests', label: 'Demandes' },
  { to: '/activity', label: 'Activité' },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Administration' },
];

export default function AppShell({ children }) {
  const { profile, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const items = isAdmin ? [...FINANCE_NAV_ITEMS, ...ADMIN_ITEMS] : FINANCE_NAV_ITEMS;

  function renderLinks(list) {
    return list.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        {item.label}
      </NavLink>
    ));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="brand-mark" aria-hidden="true">⌂</span>
          <div>
            <p className="brand-title">Notre maison</p>
            <p className="brand-subtitle">Espace familial</p>
          </div>
        </div>

        <button
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="sr-only">Ouvrir le menu</span>
          <span className="nav-toggle__bar" />
          <span className="nav-toggle__bar" />
          <span className="nav-toggle__bar" />
        </button>

        <nav id="primary-nav" className={`app-nav ${menuOpen ? 'app-nav--open' : ''}`}>
          {renderLinks(FAMILY_NAV_ITEMS)}
          <span className="app-nav__divider" aria-hidden="true" />
          {renderLinks(items)}
          <NavLink to="/profile" className="app-nav__link" onClick={() => setMenuOpen(false)}>
            {profile?.full_name || 'Profil'}
          </NavLink>
          <button className="app-nav__signout" onClick={handleSignOut}>
            Se déconnecter
          </button>
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
