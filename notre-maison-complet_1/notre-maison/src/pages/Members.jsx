import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listMembers } from '../services/membersService';
import { useAuth } from '../hooks/useAuth';

export default function Members() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listMembers();
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <h1 className="page-title">Membres</h1>
      <p className="page-lead">
        Liste des membres de votre famille.
        {isAdmin && ' Pour gérer les statuts et rôles, rendez-vous dans Administration → Membres.'}
      </p>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && rows.length === 0 && (
        <EmptyState title="Aucun membre" description="Invitez des membres à rejoindre votre famille." />
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Membre depuis</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td data-label="Nom">{m.profile?.full_name || '—'}</td>
                  <td data-label="Rôle"><span className={`badge badge--${(m.profile?.role || '').toLowerCase()}`}>{m.profile?.role}</span></td>
                  <td data-label="Statut"><span className={`badge badge--${m.status}`}>{m.status === 'active' ? 'Actif' : 'Inactif'}</span></td>
                  <td data-label="Membre depuis">{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
