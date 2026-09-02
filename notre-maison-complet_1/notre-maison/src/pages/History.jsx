import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import { listHistoryEvents, subscribeToHistoryChanges } from '../services/historyService';
import { listFamilyMembers } from '../services/genealogyService';
import EventCard from '../components/history/EventCard';
import EventFormModal from '../components/history/EventFormModal';
import EventDetailModal from '../components/history/EventDetailModal';

export default function History() {
  const { profile, user, isAdmin } = useAuth();
  const familyId = profile?.family_id;

  const [withDate, setWithDate] = useState([]);
  const [withoutDate, setWithoutDate] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [formModal, setFormModal] = useState(null); // { mode: 'create' } | { mode: 'edit', event }
  const [openEventId, setOpenEventId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ withDate: wd, withoutDate: wo }, m] = await Promise.all([listHistoryEvents(), listFamilyMembers()]);
      setWithDate(wd);
      setWithoutDate(wo);
      setMembers(m);
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
    return subscribeToHistoryChanges(familyId, () => load());
  }, [familyId, load]);

  const filter = useCallback(
    (list) => {
      const q = query.trim().toLowerCase();
      if (!q) return list;
      return list.filter((e) =>
        [e.title, e.description, e.location].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      );
    },
    [query]
  );

  const filteredWithDate = useMemo(() => filter(withDate), [withDate, filter]);
  const filteredWithoutDate = useMemo(() => filter(withoutDate), [withoutDate, filter]);
  const totalCount = withDate.length + withoutDate.length;
  const filteredCount = filteredWithDate.length + filteredWithoutDate.length;

  if (!familyId) {
    return (
      <AppShell>
        <InlineError message="Vous devez appartenir à une famille pour accéder à l'histoire familiale." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="tree-page-header">
        <div>
          <h1 className="page-title">📜 Notre histoire</h1>
          <p className="page-lead">
            {totalCount > 0
              ? `${totalCount} souvenir${totalCount > 1 ? 's' : ''} conservé${totalCount > 1 ? 's' : ''}.`
              : "Conservez ici les souvenirs, récits et évènements marquants de votre famille."}
          </p>
        </div>
        <div className="tree-page-header__actions">
          {totalCount > 0 && (
            <input
              type="search"
              className="history-search"
              placeholder="🔎 Rechercher un souvenir"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Rechercher dans l'histoire familiale"
            />
          )}
          <button type="button" className="btn btn--primary" onClick={() => setFormModal({ mode: 'create' })}>
            + Ajouter un souvenir
          </button>
        </div>
      </div>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && !error && totalCount === 0 && (
        <EmptyState
          title="Aucun souvenir pour l'instant"
          description="Ajoutez le premier évènement de votre histoire familiale : une naissance, un mariage, un déménagement, une fête…"
        />
      )}

      {!loading && !error && totalCount > 0 && filteredCount === 0 && (
        <EmptyState title="Aucun résultat" description="Essayez un autre mot-clé." />
      )}

      {!loading && !error && filteredWithDate.length > 0 && (
        <div className="history-timeline">
          <div className="history-timeline__line" aria-hidden="true" />
          {filteredWithDate.map((event) => (
            <EventCard key={event.id} event={event} onOpen={setOpenEventId} />
          ))}
        </div>
      )}

      {!loading && !error && filteredWithoutDate.length > 0 && (
        <div className="history-undated">
          <h2 className="history-undated__title">Dates inconnues</h2>
          <div className="history-undated__grid">
            {filteredWithoutDate.map((event) => (
              <EventCard key={event.id} event={event} onOpen={setOpenEventId} />
            ))}
          </div>
        </div>
      )}

      {formModal && (
        <EventFormModal
          familyId={familyId}
          userId={user?.id}
          event={formModal.mode === 'edit' ? formModal.event : null}
          onClose={() => setFormModal(null)}
          onSaved={async (id) => {
            setFormModal(null);
            await load();
            setOpenEventId(id);
          }}
        />
      )}

      {openEventId && (
        <EventDetailModal
          eventId={openEventId}
          familyId={familyId}
          userId={user?.id}
          isAdmin={isAdmin}
          members={members}
          onClose={() => setOpenEventId(null)}
          onEdit={(event) => {
            setOpenEventId(null);
            setFormModal({ mode: 'edit', event });
          }}
          onDeleted={async () => {
            setOpenEventId(null);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}
