import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);

  function handleCopyFamilyId() {
    if (!profile?.family_id) return;
    navigator.clipboard.writeText(profile.family_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <AppShell>
      <h1 className="page-title">Profil</h1>

      <section className="section">
        <div className="profile-card">
          <div className="profile-card__row">
            <span className="profile-card__label">Nom complet</span>
            <span className="profile-card__value">{profile?.full_name}</span>
          </div>
          <div className="profile-card__row">
            <span className="profile-card__label">Adresse e-mail</span>
            <span className="profile-card__value">{user?.email}</span>
          </div>
          <div className="profile-card__row">
            <span className="profile-card__label">Rôle</span>
            <span className="profile-card__value">
              <span className={`badge badge--${(profile?.role || '').toLowerCase()}`}>{profile?.role}</span>
            </span>
          </div>
          <div className="profile-card__row">
            <span className="profile-card__label">Statut</span>
            <span className="profile-card__value">{profile?.is_active ? 'Actif' : 'Inactif'}</span>
          </div>
          {profile?.role === 'ADMIN' && profile?.family_id && (
            <div className="profile-card__row">
              <span className="profile-card__label">Identifiant famille (à partager pour inviter)</span>
              <span className="profile-card__value">
                <code className="family-code">{profile.family_id}</code>
                <button className="link-btn" onClick={handleCopyFamilyId} type="button">
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </span>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
