import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import { listFamilyMembers, subscribeToTreeChanges } from '../services/genealogyService';
import { listHistoryEvents, subscribeToHistoryChanges } from '../services/historyService';
import { computeUpcomingBirthdays } from '../lib/birthdays';
import MemberPhoto from '../components/genealogy/MemberPhoto';
import EventDetailModal from '../components/history/EventDetailModal';

function formatNextDate(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function BirthdayRow({ entry, onOpenMember }) {
  const { member, nextOccurrence, turningAge, daysUntil } = entry;
  return (
    <li className="birthday-row">
      <button type="button" className="birthday-row__person" onClick={() => onOpenMember(member.id)}>
        <MemberPhoto member={member} size={44} />
        <span>
          <strong>
            {member.first_name} {member.last_name}
          </strong>
          <span className="birthday-row__sub">
            {daysUntil === 0 ? "Aujourd'hui" : formatNextDate(nextOccurrence)} · {turningAge} ans
          </span>
        </span>
      </button>
    </li>
  );
}

export default function Calendar() {
  const { profile, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const familyId = profile?.family_id;

  const [members, setMembers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEventId, setOpenEventId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, { withDate }] = await Promise.all([listFamilyMembers(), listHistoryEvents()]);
      setMembers(m);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setUpcomingEvents(withDate.filter((e) => e.event_date && new Date(e.event_date) >= today).slice(0, 20));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!familyId) return undefined;
    const unsubMembers = subscribeToTreeChanges(familyId, () => load());
    const unsubEvents = subscribeToHistoryChanges(familyId, () => load());
    return () => {
      unsubMembers();
      unsubEvents();
    };
  }, [familyId, load]);

  const birthdays = useMemo(() => computeUpcomingBirthdays(members), [members]);
  const totalBirthdays = birthdays.today.length + birthdays.thisWeek.length + birthdays.thisMonth.length;

  if (!familyId) {
    return (
      <AppShell>
        <InlineError message="Vous devez appartenir à une famille pour accéder au calendrier." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="page-title">🎂 Anniversaires &amp; calendrier</h1>
      <p className="page-lead">
        Les prochains anniversaires de la famille et les évènements à venir enregistrés dans{' '}
        <button type="button" className="link-btn" onClick={() => navigate('/history')}>
          Notre histoire
        </button>
        .
      </p>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && !error && (
        <div className="calendar-layout">
          <section className="calendar-section">
            <h2>🎂 Anniversaires à venir</h2>
            {totalBirthdays === 0 ? (
              <EmptyState
                title="Aucun anniversaire dans les 31 prochains jours"
                description="Les anniversaires apparaissent ici dès qu'une date de naissance est enregistrée pour un membre de l'arbre."
              />
            ) : (
              <>
                {birthdays.today.length > 0 && (
                  <div className="birthday-group">
                    <h3>Aujourd'hui</h3>
                    <ul className="birthday-list">
                      {birthdays.today.map((b) => (
                        <BirthdayRow key={b.member.id} entry={b} onOpenMember={(id) => navigate(`/tree?focus=${id}`)} />
                      ))}
                    </ul>
                  </div>
                )}
                {birthdays.thisWeek.length > 0 && (
                  <div className="birthday-group">
                    <h3>Cette semaine</h3>
                    <ul className="birthday-list">
                      {birthdays.thisWeek.map((b) => (
                        <BirthdayRow key={b.member.id} entry={b} onOpenMember={(id) => navigate(`/tree?focus=${id}`)} />
                      ))}
                    </ul>
                  </div>
                )}
                {birthdays.thisMonth.length > 0 && (
                  <div className="birthday-group">
                    <h3>Ce mois-ci</h3>
                    <ul className="birthday-list">
                      {birthdays.thisMonth.map((b) => (
                        <BirthdayRow key={b.member.id} entry={b} onOpenMember={(id) => navigate(`/tree?focus=${id}`)} />
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="calendar-section">
            <h2>📅 Évènements à venir</h2>
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="Aucun évènement à venir"
                description="Ajoutez une date future à un souvenir dans Notre histoire pour qu'il apparaisse ici (réunion, mariage, cérémonie…)."
              />
            ) : (
              <ul className="calendar-event-list">
                {upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="calendar-event-row" onClick={() => setOpenEventId(e.id)}>
                      <span className="calendar-event-row__date">
                        {new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="calendar-event-row__title">{e.title}</span>
                      {e.location && <span className="calendar-event-row__location">📍 {e.location}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {openEventId && (
        <EventDetailModal
          eventId={openEventId}
          familyId={familyId}
          userId={user?.id}
          isAdmin={isAdmin}
          members={members}
          onClose={() => setOpenEventId(null)}
          onEdit={() => navigate('/history')}
          onDeleted={async () => {
            setOpenEventId(null);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}
