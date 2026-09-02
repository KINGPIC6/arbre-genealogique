import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listSecurityLogs } from '../services/activityService';

const EVENT_LABEL = {
  unauthorized_join_review_attempt: "Tentative non autorisée de traiter une demande d'adhésion",
  privilege_escalation_attempt: 'Tentative de modification de rôle non autorisée',
};

export default function AdminSecurity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSecurityLogs(150);
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
      <h1 className="page-title">Administration — Sécurité</h1>
      <p className="page-lead">Journal des événements de sécurité de votre famille (accès réservé aux administrateurs).</p>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && rows.length === 0 && (
        <EmptyState title="Aucun événement de sécurité" description="C'est bon signe : rien d'anormal n'a été détecté." />
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Niveau</th><th>Événement</th><th>Acteur</th><th>Date</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Niveau"><span className={`badge badge--level-${r.level.toLowerCase()}`}>{r.level}</span></td>
                  <td data-label="Événement">{EVENT_LABEL[r.event_type] || r.event_type}</td>
                  <td data-label="Acteur">{r.actor?.full_name || '—'}</td>
                  <td data-label="Date">{new Date(r.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
