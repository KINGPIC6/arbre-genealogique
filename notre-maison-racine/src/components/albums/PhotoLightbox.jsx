import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSignedMediaUrl } from '../../lib/mediaUrl';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
  listPhotoTags,
  tagMemberOnPhoto,
  untagMemberFromPhoto,
  listPhotoComments,
  addPhotoComment,
  deletePhotoComment,
  deletePhoto,
} from '../../services/albumsService';

export default function PhotoLightbox({ photo, familyId, userId, isAdmin, members, onClose, onDeleted, onPrev, onNext }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState(null);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [pickerMemberId, setPickerMemberId] = useState('');
  const [error, setError] = useState('');

  const membersById = new Map(members.map((m) => [m.id, m]));

  const load = useCallback(async () => {
    try {
      const [u, t, c] = await Promise.all([
        getSignedMediaUrl(photo.storage_path),
        listPhotoTags(photo.id),
        listPhotoComments(photo.id),
      ]);
      setUrl(u);
      setTags(t);
      setComments(c);
    } catch (err) {
      setError(err.message);
    }
  }, [photo.id, photo.storage_path]);

  useEffect(() => {
    load();
  }, [load]);

  useEscapeKey(onClose);

  useEffect(() => {
    function handleArrowKeys(e) {
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    }
    document.addEventListener('keydown', handleArrowKeys);
    return () => document.removeEventListener('keydown', handleArrowKeys);
  }, [onPrev, onNext]);

  async function handleTag() {
    if (!pickerMemberId) return;
    try {
      await tagMemberOnPhoto(familyId, photo.id, pickerMemberId, userId);
      setPickerMemberId('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUntag(tagId) {
    try {
      await untagMemberFromPhoto(tagId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addPhotoComment(familyId, photo.id, userId, newComment.trim());
      setNewComment('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deletePhotoComment(commentId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeletePhoto() {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await deletePhoto(photo.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  }

  const taggedMemberIds = new Set(tags.map((t) => t.family_member_id));
  const availableMembers = members.filter((m) => !taggedMemberIds.has(m.id));

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Photo">
      <div className="lightbox-card">
        <button type="button" className="lightbox-card__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        <div className="lightbox-card__image">
          {onPrev && (
            <button type="button" className="lightbox-card__nav lightbox-card__nav--prev" onClick={onPrev} aria-label="Photo précédente">
              ‹
            </button>
          )}
          {url ? <img src={url} alt={photo.caption || 'Photo de famille'} /> : <div className="lightbox-card__loading" />}
          {onNext && (
            <button type="button" className="lightbox-card__nav lightbox-card__nav--next" onClick={onNext} aria-label="Photo suivante">
              ›
            </button>
          )}
        </div>

        <div className="lightbox-card__panel">
          {photo.caption && <p className="lightbox-card__caption">{photo.caption}</p>}

          <section>
            <h3>Qui apparaît sur cette photo ?</h3>
            <ul className="tag-list">
              {tags.map((t) => (
                <li key={t.id} className="tag-chip">
                  <button
                    type="button"
                    className="tag-chip__name"
                    onClick={() => navigate(`/tree?focus=${t.family_member_id}`)}
                    title="Voir dans l'arbre"
                  >
                    {membersById.get(t.family_member_id)?.first_name || 'Membre'}{' '}
                    {membersById.get(t.family_member_id)?.last_name || ''}
                  </button>
                  <button type="button" onClick={() => handleUntag(t.id)} aria-label="Retirer">
                    ×
                  </button>
                </li>
              ))}
              {tags.length === 0 && <li className="tag-list__empty">Personne n'est encore tagué.</li>}
            </ul>
            {availableMembers.length > 0 && (
              <div className="form-row">
                <select value={pickerMemberId} onChange={(e) => setPickerMemberId(e.target.value)}>
                  <option value="">Sélectionner une personne…</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn--sm btn--soft" onClick={handleTag} disabled={!pickerMemberId}>
                  Taguer
                </button>
              </div>
            )}
          </section>

          <section>
            <h3>Commentaires</h3>
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-list__item">
                  <span className="comment-list__author">{c.author?.full_name || 'Membre'}</span>
                  <span className="comment-list__content">{c.content}</span>
                  {(c.author_id === userId || isAdmin) && (
                    <button type="button" className="link-btn" onClick={() => handleDeleteComment(c.id)}>
                      Supprimer
                    </button>
                  )}
                </li>
              ))}
              {comments.length === 0 && <li className="comment-list__empty">Aucun commentaire pour l'instant.</li>}
            </ul>
            <form onSubmit={handleAddComment} className="comment-form">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire…"
                maxLength={2000}
              />
              <button type="submit" className="btn btn--sm btn--primary">
                Envoyer
              </button>
            </form>
          </section>

          {error && <p className="form-error">{error}</p>}

          <button type="button" className="btn btn--danger btn--sm" onClick={handleDeletePhoto}>
            Supprimer la photo
          </button>
        </div>
      </div>
    </div>
  );
}
