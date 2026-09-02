import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { computeTreeLayout } from '../lib/treeLayout';
import { computeUpcomingBirthdays } from '../lib/birthdays';

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [
          { data: contributions, error: e1 },
          { data: expenses, error: e2 },
          { data: members, error: e3 },
          { data: activity, error: e4 },
          { data: treeMembers, error: e5 },
          { data: relationships, error: e6 },
          { count: albumCount, error: e7 },
          { count: photoCount, error: e8 },
          { count: historyCount, error: e9 },
        ] = await Promise.all([
          supabase.from('contributions').select('amount'),
          supabase.from('expenses').select('amount'),
          supabase.from('members').select('id, status').eq('status', 'active'),
          supabase
            .from('activity_logs')
            .select('id, action, details, created_at, actor:profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(8),
          // Statistiques "Notre Maison" (arbre / album / histoire) : colonnes
          // minimales uniquement, pour rester léger sur le tableau de bord.
          supabase.from('family_members').select('id, birth_date, death_date'),
          supabase.from('family_relationships').select('person_id, related_person_id, relationship_type'),
          supabase.from('albums').select('id', { count: 'exact', head: true }),
          supabase.from('photos').select('id', { count: 'exact', head: true }),
          supabase.from('family_history_events').select('id', { count: 'exact', head: true }),
        ]);

        if (e1 || e2 || e3 || e4) throw e1 || e2 || e3 || e4;
        // e5-e9 sont traitées séparément : une erreur ici ne doit pas casser
        // le reste du tableau de bord (cotisations/dépenses restent utilisables).
        const familyStatsAvailable = !e5 && !e6 && !e7 && !e8 && !e9;

        const totalContributions = (contributions || []).reduce((sum, c) => sum + Number(c.amount), 0);
        const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

        let familyStats = null;
        if (familyStatsAvailable) {
          const { generations } = computeTreeLayout(treeMembers || [], relationships || []);
          const birthdays = computeUpcomingBirthdays(treeMembers || []);
          familyStats = {
            memberCount: (treeMembers || []).length,
            generations,
            albumCount: albumCount || 0,
            photoCount: photoCount || 0,
            historyCount: historyCount || 0,
            upcomingBirthdayCount: birthdays.today.length + birthdays.thisWeek.length + birthdays.thisMonth.length,
          };
        }

        if (mounted) {
          setState({
            loading: false,
            error: '',
            data: {
              totalContributions,
              totalExpenses,
              balance: totalContributions - totalExpenses,
              memberCount: (members || []).length,
              recentActivity: activity || [],
              familyStats,
            },
          });
        }
      } catch (err) {
        if (mounted) setState({ loading: false, error: toSafeMessage(err), data: null });
      }
    }

    load();

    // Realtime : toute nouvelle contribution/dépense/activité recharge les totaux.
    // RLS s'applique aussi aux évènements Realtime : seuls les changements de la
    // famille de l'utilisateur connecté sont reçus.
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppShell>
      <h1 className="page-title">Tableau de bord</h1>

      {state.loading && <InlineLoading label="Chargement du tableau de bord…" />}
      {state.error && <InlineError message={state.error} />}

      {state.data && (
        <>
          {state.data.familyStats && (
            <section className="section family-stats">
              <h2>🌳 Notre Maison</h2>
              <div className="family-stats__grid">
                <Link to="/tree" className="family-stat-card">
                  <span className="family-stat-card__icon">🌳</span>
                  <span className="family-stat-card__value">{state.data.familyStats.memberCount}</span>
                  <span className="family-stat-card__label">
                    membre{state.data.familyStats.memberCount > 1 ? 's' : ''} de l'arbre
                    {state.data.familyStats.generations > 0 && ` · ${state.data.familyStats.generations} génération${state.data.familyStats.generations > 1 ? 's' : ''}`}
                  </span>
                </Link>
                <Link to="/albums" className="family-stat-card">
                  <span className="family-stat-card__icon">📷</span>
                  <span className="family-stat-card__value">{state.data.familyStats.photoCount}</span>
                  <span className="family-stat-card__label">
                    photo{state.data.familyStats.photoCount > 1 ? 's' : ''} · {state.data.familyStats.albumCount} album{state.data.familyStats.albumCount > 1 ? 's' : ''}
                  </span>
                </Link>
                <Link to="/history" className="family-stat-card">
                  <span className="family-stat-card__icon">📜</span>
                  <span className="family-stat-card__value">{state.data.familyStats.historyCount}</span>
                  <span className="family-stat-card__label">souvenir{state.data.familyStats.historyCount > 1 ? 's' : ''} conservé{state.data.familyStats.historyCount > 1 ? 's' : ''}</span>
                </Link>
                <Link to="/calendar" className="family-stat-card">
                  <span className="family-stat-card__icon">🎂</span>
                  <span className="family-stat-card__value">{state.data.familyStats.upcomingBirthdayCount}</span>
                  <span className="family-stat-card__label">anniversaire{state.data.familyStats.upcomingBirthdayCount > 1 ? 's' : ''} ce mois-ci</span>
                </Link>
              </div>
            </section>
          )}

          <div className="stat-grid">
            <div className="stat-card">
              <p className="stat-card__label">Total des contributions</p>
              <p className="stat-card__value">{formatAmount(state.data.totalContributions)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Total des dépenses</p>
              <p className="stat-card__value">{formatAmount(state.data.totalExpenses)}</p>
            </div>
            <div className="stat-card stat-card--accent">
              <p className="stat-card__label">Solde</p>
              <p className="stat-card__value">{formatAmount(state.data.balance)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Membres actifs</p>
              <p className="stat-card__value">{state.data.memberCount}</p>
            </div>
          </div>

          <section className="section">
            <h2>Activité récente</h2>
            {state.data.recentActivity.length === 0 ? (
              <EmptyState title="Aucune activité pour l'instant" description="Les actions de la famille apparaîtront ici." />
            ) : (
              <ul className="activity-list">
                {state.data.recentActivity.map((item) => (
                  <li key={item.id} className="activity-list__item">
                    <span className="activity-list__actor">{item.actor?.full_name || 'Un membre'}</span>
                    <span className="activity-list__action">{translateAction(item.action)}</span>
                    <span className="activity-list__date">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

function translateAction(action) {
  const map = {
    family_created: 'a créé la famille',
    contribution_added: 'a ajouté une contribution',
    expense_added: 'a ajouté une dépense',
    member_deactivated: 'a désactivé un membre',
    member_reactivated: 'a réactivé un membre',
    join_request_approved: 'a accepté une demande d\'adhésion',
    join_request_rejected: 'a refusé une demande d\'adhésion',
    role_changed: 'a modifié un rôle',
  };
  return map[action] || action;
}
