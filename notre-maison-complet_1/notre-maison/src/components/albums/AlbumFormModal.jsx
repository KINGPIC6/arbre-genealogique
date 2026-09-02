import { useState } from 'react';
import { createAlbum, updateAlbum } from '../../services/albumsService';
import { useEscapeKey } from '../../hooks/useEscapeKey';

/**
 * Formulaire d'album, utilisé pour la création (album=null) et la
 * modification (album fourni) afin d'éviter un composant en double.
 */
export default function AlbumFormModal({ familyId, userId, album, onClose, onSaved }) {
  const isEdit = !!album;
  const [title, setTitle] = useState(album?.title || '');
  const [description, setDescription] = useState(album?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre de l'album est obligatoire.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateAlbum(album.id, { title: title.trim(), description: description.trim() });
        onSaved(album.id);
      } else {
        const id = await createAlbum(familyId, userId, { title: title.trim(), description: description.trim() });
        onSaved(id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? "Modifier l'album" : 'Nouvel album'}>
      <div className="modal-card">
        <h2>{isEdit ? "✏️ Modifier l'album" : '📷 Nouvel album'}</h2>
        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            Titre *
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Réunion familiale 2026" required />
          </label>
          <label>
            Description
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : "Créer l'album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
