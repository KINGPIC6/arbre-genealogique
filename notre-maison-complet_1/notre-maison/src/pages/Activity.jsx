import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listActivity } from '../services/activityService';
import { supabase } from '../lib/supabaseClient';

const ACTION_LABEL = {
  family_created: 'a créé la famille',
  contribution_added: 'a ajouté une contribution',
  expense_added: 'a ajouté une dépense',
  member_deactivated: 'a désactivé un membre',
  member_reactivated: 'a réactivé un membre',
  join_request_approved: "a accepté une demande d'adhésion",
  join_request_rejected: "a refusé une demande d'adhésion",
  role_changed: 'a modifié un rôle',
};

export default function Activity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listActivity(100);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('activity-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <AppShell>
      <h1 className="page-title">Activité</h1>
      <p className="page-lead">Historique des actions importantes de votre famille.</p>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && rows.length === 0 && (
        <EmptyState title="Aucune activité" description="Les actions de la famille apparaîtront ici." />
      )}

      {!loading && rows.length > 0 && (
        <ul className="activity-list activity-list--full">
          {rows.map((item) => (
            <li key={item.id} className="activity-list__item">
              <span className="activity-list__actor">{item.actor?.full_name || 'Un membre'}</span>
              <span className="activity-list__action">{ACTION_LABEL[item.action] || item.action}</span>
              <span className="activity-list__date">
                {new Date(item.created_at).toLocaleString('fr-FR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
