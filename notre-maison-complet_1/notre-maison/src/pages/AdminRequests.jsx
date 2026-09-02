import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listJoinRequests, reviewJoinRequest } from '../services/joinRequestsService';

export default function AdminRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

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

  async function handleReview(id, approve) {
    setBusyId(id);
    setError('');
    try {
      await reviewJoinRequest(id, approve);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = rows.filter((r) => r.status === 'pending');
  const processed = rows.filter((r) => r.status !== 'pending');

  return (
    <AppShell>
      <h1 className="page-title">Administration — Demandes d'adhésion</h1>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && (
        <>
          <section className="section">
            <h2>En attente</h2>
            {pending.length === 0 ? (
              <EmptyState title="Aucune demande en attente" />
            ) : (
              <ul className="request-list">
                {pending.map((r) => (
                  <li key={r.id} className="request-list__item">
                    <span>{r.full_name}</span>
                    <span className="request-list__date">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <div className="request-list__actions">
                      <button
                        className="btn btn--primary btn--sm"
                        disabled={busyId === r.id}
                        onClick={() => handleReview(r.id, true)}
                      >
                        Accepter
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        disabled={busyId === r.id}
                        onClick={() => handleReview(r.id, false)}
                      >
                        Refuser
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section">
            <h2>Historique</h2>
            {processed.length === 0 ? (
              <EmptyState title="Aucune demande traitée pour l'instant" />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Nom</th><th>Statut</th><th>Traitée le</th></tr>
                  </thead>
                  <tbody>
                    {processed.map((r) => (
                      <tr key={r.id}>
                        <td data-label="Nom">{r.full_name}</td>
                        <td data-label="Statut"><span className={`badge badge--${r.status}`}>{r.status === 'approved' ? 'Acceptée' : 'Refusée'}</span></td>
                        <td data-label="Traitée le">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('fr-FR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
