import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
  getHistoryEvent,
  deleteHistoryEvent,
  addEventMember,
  removeEventMember,
  listFamilyPhotosForPicker,
  attachPhotoToEvent,
  detachPhotoFromEvent,
} from '../../services/historyService';
import MemberPhoto from '../genealogy/MemberPhoto';
import AlbumPhoto from '../albums/AlbumPhoto';

function formatEventDate(event) {
  if (event.event_date) {
    return new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (event.approx_year) return `vers ${event.approx_year}`;
  return 'Date inconnue';
}

export default function EventDetailModal({ eventId, familyId, userId, isAdmin, members, onClose, onEdit, onDeleted }) {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [pickerMemberId, setPickerMemberId] = useState('');
  const [pickerPhotoId, setPickerPhotoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEscapeKey(onClose);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [e, photos] = await Promise.all([getHistoryEvent(eventId), listFamilyPhotosForPicker()]);
      setEvent(e);
      setAvailablePhotos(photos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const membersById = new Map(members.map((m) => [m.id, m]));
  const canManage = event && (isAdmin || event.created_by === userId);

  async function handleAddMember() {
    if (!pickerMemberId) return;
    try {
      await addEventMember(familyId, eventId, pickerMemberId);
      setPickerMemberId('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(memberId) {
    try {
      await removeEventMember(eventId, memberId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAttachPhoto() {
    if (!pickerPhotoId) return;
    try {
      await attachPhotoToEvent(familyId, eventId, userId, pickerPhotoId);
      setPickerPhotoId('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDetachPhoto(linkId) {
    try {
      await detachPhotoFromEvent(linkId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteEvent() {
    if (!window.confirm(`Supprimer "${event.title}" de l'histoire familiale ?`)) return;
    try {
      await deleteHistoryEvent(event.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  }

  const taggedIds = new Set((event?.event_members || []).map((m) => m.family_member_id));
  const availableMembers = members.filter((m) => !taggedIds.has(m.id));

  const linkedPhotoIds = new Set((event?.event_photos || []).map((p) => p.photo_id));
  const pickablePhotos = availablePhotos.filter((p) => !linkedPhotoIds.has(p.id));

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Détail du souvenir">
      <div className="modal-card modal-card--wide">
        <button type="button" className="member-panel__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {loading && <p className="inline-state inline-state--loading">Chargement…</p>}
        {error && (
          <p className="inline-state inline-state--error" role="alert">
            {error}
          </p>
        )}

        {!loading && event && (
          <>
            <h2>{event.title}</h2>
            <p className="modal-sub">
              {formatEventDate(event)}
              {event.location ? ` · ${event.location}` : ''}
            </p>
            {event.description && <p className="history-event__description">{event.description}</p>}

            <section>
              <h3>Personnes concernées</h3>
              <ul className="tag-list">
                {(event.event_members || []).map((em) => {
                  const m = membersById.get(em.family_member_id);
                  if (!m) return null;
                  return (
                    <li key={em.family_member_id} className="tag-chip">
                      <button type="button" className="tag-chip__name" onClick={() => navigate(`/tree?focus=${m.id}`)} title="Voir dans l'arbre">
                        <MemberPhoto member={m} size={20} />
                        {m.first_name} {m.last_name}
                      </button>
                      <button type="button" onClick={() => handleRemoveMember(m.id)} aria-label="Retirer">
                        ×
                      </button>
                    </li>
                  );
                })}
                {(event.event_members || []).length === 0 && <li className="tag-list__empty">Personne n'est encore associé.</li>}
              </ul>
              {availableMembers.length > 0 && (
                <div className="form-row">
                  <select value={pickerMemberId} onChange={(e) => setPickerMemberId(e.target.value)} aria-label="Ajouter une personne">
                    <option value="">Ajouter une personne…</option>
                    {availableMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn--sm btn--soft" onClick={handleAddMember} disabled={!pickerMemberId}>
                    Ajouter
                  </button>
                </div>
              )}
            </section>

            <section>
              <h3>Photos associées</h3>
              {(event.event_photos || []).length > 0 ? (
                <div className="history-photo-grid">
                  {event.event_photos.map((ep) => (
                    <div key={ep.id} className="history-photo-grid__cell">
                      <AlbumPhoto path={ep.photo?.storage_path} alt={ep.photo?.caption || event.title} />
                      {(ep.created_by === userId || isAdmin) && (
                        <button type="button" className="history-photo-grid__remove" onClick={() => handleDetachPhoto(ep.id)} aria-label="Détacher cette photo">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tag-list__empty">Aucune photo associée pour l'instant.</p>
              )}
              {pickablePhotos.length > 0 ? (
                <div className="form-row">
                  <select value={pickerPhotoId} onChange={(e) => setPickerPhotoId(e.target.value)} aria-label="Associer une photo existante">
                    <option value="">Associer une photo existante…</option>
                    {pickablePhotos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.caption || 'Photo sans légende'}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn--sm btn--soft" onClick={handleAttachPhoto} disabled={!pickerPhotoId}>
                    Associer
                  </button>
                </div>
              ) : (
                <p className="modal-sub">
                  Pas encore de photo dans vos albums à associer. Importez d'abord des photos depuis{' '}
                  <button type="button" className="link-btn" onClick={() => navigate('/albums')}>
                    l'album photo
                  </button>
                  .
                </p>
              )}
            </section>

            {canManage && (
              <div className="modal-actions modal-actions--spread">
                <button type="button" className="btn btn--danger btn--sm" onClick={handleDeleteEvent}>
                  Supprimer
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(event)}>
                  Modifier
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
