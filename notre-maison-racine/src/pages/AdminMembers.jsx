import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listMembers, setMemberStatus, changeRole } from '../services/membersService';
import { useAuth } from '../hooks/useAuth';

export default function AdminMembers() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

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

  async function handleToggleStatus(member) {
    setBusyId(member.id);
    setError('');
    try {
      const nextStatus = member.status === 'active' ? 'inactive' : 'active';
      await setMemberStatus(member.id, nextStatus);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleRole(member) {
    if (member.profile?.id === profile?.id) {
      setError("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }
    setBusyId(member.id);
    setError('');
    try {
      const nextRole = member.profile?.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
      await changeRole(member.profile.id, nextRole);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Administration — Membres</h1>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && rows.length === 0 && (
        <EmptyState title="Aucun membre" description="Aucun membre à administrer pour le moment." />
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td data-label="Nom">{m.profile?.full_name || '—'}</td>
                  <td data-label="Rôle"><span className={`badge badge--${(m.profile?.role || '').toLowerCase()}`}>{m.profile?.role}</span></td>
                  <td data-label="Statut"><span className={`badge badge--${m.status}`}>{m.status === 'active' ? 'Actif' : 'Inactif'}</span></td>
                  <td data-label="Actions" className="table-actions">
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={busyId === m.id}
                      onClick={() => handleToggleStatus(m)}
                    >
                      {m.status === 'active' ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={busyId === m.id}
                      onClick={() => handleToggleRole(m)}
                    >
                      {m.profile?.role === 'ADMIN' ? 'Rétrograder en membre' : 'Promouvoir admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
