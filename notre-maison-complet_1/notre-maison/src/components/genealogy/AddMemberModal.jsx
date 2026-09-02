import { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
  createFamilyMember,
  createRelationship,
  addSecondParent,
  uploadMemberPhoto,
  updateFamilyMember,
} from '../../services/genealogyService';

const ACTION_LABELS = {
  root: 'Ajouter le premier membre',
  add_parent: 'Ajouter un parent',
  add_child: 'Ajouter un enfant',
  add_spouse: "Ajouter un conjoint / une conjointe",
};

/**
 * props:
 *  - action: 'root' | 'add_parent' | 'add_child' | 'add_spouse'
 *  - referenceMember: la personne depuis laquelle l'action a été lancée (sauf pour 'root')
 *  - familyId, userId
 *  - otherMembers: liste des membres existants (pour le "deuxième parent")
 *  - onClose(), onCreated(newMemberId)
 */
export default function AddMemberModal({ action, referenceMember, familyId, userId, otherMembers, onClose, onCreated }) {
  useEscapeKey(onClose);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [secondParentId, setSecondParentId] = useState('');
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
      const newId = await createFamilyMember(familyId, userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        deathDate,
        birthPlace: birthPlace.trim(),
        bio: bio.trim(),
      });

      if (photoFile) {
        const path = await uploadMemberPhoto(familyId, newId, photoFile);
        await updateFamilyMember(newId, { photoPath: path });
      }

      if (action !== 'root' && referenceMember) {
        await createRelationship(familyId, userId, action, referenceMember.id, newId);
        if (action === 'add_child' && secondParentId) {
          await addSecondParent(familyId, userId, secondParentId, newId);
        }
      }

      onCreated(newId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={ACTION_LABELS[action]}>
      <div className="modal-card">
        <h2>{ACTION_LABELS[action]}</h2>
        {referenceMember && action !== 'root' && (
          <p className="modal-sub">
            {action === 'add_parent' && `Cette personne sera le parent de ${referenceMember.first_name}.`}
            {action === 'add_child' && `Cette personne sera l'enfant de ${referenceMember.first_name}.`}
            {action === 'add_spouse' && `Cette personne sera le/la conjoint(e) de ${referenceMember.first_name}.`}
          </p>
        )}

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
            Photo
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

          {action === 'add_child' && otherMembers?.length > 0 && (
            <label>
              Deuxième parent (facultatif)
              <select value={secondParentId} onChange={(e) => setSecondParentId(e.target.value)}>
                <option value="">— Aucun —</option>
                {otherMembers
                  .filter((m) => m.id !== referenceMember?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name || ''}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
