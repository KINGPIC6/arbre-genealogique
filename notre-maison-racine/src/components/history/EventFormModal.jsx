import { useState } from 'react';
import { createHistoryEvent, updateHistoryEvent } from '../../services/historyService';
import { useEscapeKey } from '../../hooks/useEscapeKey';

/** event=null → création, event fourni → édition (formulaire unique, pas de doublon). */
export default function EventFormModal({ familyId, userId, event, onClose, onSaved }) {
  const isEdit = !!event;
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [dateMode, setDateMode] = useState(event?.event_date ? 'exact' : 'approx');
  const [eventDate, setEventDate] = useState(event?.event_date || '');
  const [approxYear, setApproxYear] = useState(event?.approx_year ? String(event.approx_year) : '');
  const [location, setLocation] = useState(event?.location || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fields = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        eventDate: dateMode === 'exact' ? eventDate || null : null,
        approxYear: dateMode === 'approx' && approxYear ? Number(approxYear) : null,
      };
      if (isEdit) {
        await updateHistoryEvent(event.id, fields);
        onSaved(event.id);
      } else {
        const id = await createHistoryEvent(familyId, userId, fields);
        onSaved(id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? "Modifier l'évènement" : 'Nouvel évènement'}>
      <div className="modal-card">
        <h2>{isEdit ? '✏️ Modifier ce souvenir' : '📜 Ajouter un souvenir'}</h2>
        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            Titre *
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Le mariage de Jean et Marie" required />
          </label>

          <label>
            Récit / description
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <fieldset className="date-mode-fieldset">
            <legend>Date</legend>
            <div className="date-mode-toggle">
              <label className="radio-inline">
                <input type="radio" checked={dateMode === 'exact'} onChange={() => setDateMode('exact')} />
                Date précise
              </label>
              <label className="radio-inline">
                <input type="radio" checked={dateMode === 'approx'} onChange={() => setDateMode('approx')} />
                Année approximative
              </label>
            </div>
            {dateMode === 'exact' ? (
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} aria-label="Date précise" />
            ) : (
              <input
                type="number"
                inputMode="numeric"
                placeholder="Ex. 1978"
                value={approxYear}
                onChange={(e) => setApproxYear(e.target.value)}
                aria-label="Année approximative"
                min="1000"
                max={new Date().getFullYear() + 1}
              />
            )}
          </fieldset>

          <label>
            Lieu
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex. Abidjan, Côte d'Ivoire" />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
