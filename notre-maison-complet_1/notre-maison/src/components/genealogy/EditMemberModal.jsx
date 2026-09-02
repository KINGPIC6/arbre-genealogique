import { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { updateFamilyMember, uploadMemberPhoto } from '../../services/genealogyService';

export default function EditMemberModal({ member, familyId, onClose, onSaved }) {
  useEscapeKey(onClose);
  const [firstName, setFirstName] = useState(member.first_name || '');
  const [lastName, setLastName] = useState(member.last_name || '');
  const [birthDate, setBirthDate] = useState(member.birth_date || '');
  const [deathDate, setDeathDate] = useState(member.death_date || '');
  const [birthPlace, setBirthPlace] = useState(member.birth_place || '');
  const [bio, setBio] = useState(member.bio || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Le prénom est obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let photoPath;
      if (photoFile) {
        photoPath = await uploadMemberPhoto(familyId, member.id, photoFile);
      }
      await updateFamilyMember(member.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        deathDate,
        birthPlace: birthPlace.trim(),
        bio: bio.trim(),
        ...(photoPath ? { photoPath } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Modifier le membre">
      <div className="modal-card">
        <h2>Modifier {member.first_name}</h2>
        <form onSubmit={handleSubmit} className="stack-form">
          <div className="form-row form-row--split">
            <label>
              Prénom *
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Nom
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>

          <label>
            Nouvelle photo
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </label>

          <div className="form-row form-row--split">
            <label>
              Date de naissance
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <label>
              Date de décès
              <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
            </label>
          </div>

          <label>
            Lieu de naissance
            <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
          </label>

          <label>
            Biographie
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
