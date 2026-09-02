import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listJoinRequests } from '../services/joinRequestsService';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABEL = { pending: 'En attente', approved: 'Acceptée', rejected: 'Refusée' };

export default function JoinRequests() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listJoinRequests();
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
      <h1 className="page-title">Demandes d'adhésion</h1>
      <p className="page-lead">
        {isAdmin
          ? "Consultez l'historique des demandes. Pour les traiter, allez dans Administration → Demandes."
          : 'Votre demande apparaît ici tant qu\'elle n\'a pas été traitée par un administrateur.'}
      </p>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && rows.length === 0 && (
        <EmptyState title="Aucune demande" description="Aucune demande d'adhésion n'a été enregistrée." />
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Statut</th>
                <th>Envoyée le</th>
                <th>Traitée le</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Nom">{r.full_name}</td>
                  <td data-label="Statut"><span className={`badge badge--${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td data-label="Envoyée le">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  <td data-label="Traitée le">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
