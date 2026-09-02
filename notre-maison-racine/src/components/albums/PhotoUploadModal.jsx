import { useState } from 'react';
import { uploadAlbumPhoto } from '../../services/albumsService';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export default function PhotoUploadModal({ familyId, albumId, userId, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');

  useEscapeKey(() => {
    if (!uploading) onClose();
  });

  function handleFiles(fileList) {
    setFiles(Array.from(fileList));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) {
      setError('Choisissez au moins une photo.');
      return;
    }
    setUploading(true);
    setError('');
    setProgress({ done: 0, total: files.length });

    const failures = [];
    for (const file of files) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await uploadAlbumPhoto(familyId, albumId, userId, file, caption.trim() || null);
      } catch (err) {
        failures.push(`${file.name} : ${err.message}`);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    if (failures.length > 0) {
      setError(`Certaines photos n'ont pas pu être importées :\n${failures.join('\n')}`);
    } else {
      onUploaded();
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Importer des photos">
      <div className="modal-card">
        <h2>Importer des photos</h2>
        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            Photos (JPG, PNG ou WEBP — 8 Mo max chacune)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {files.length > 0 && <p className="modal-sub">{files.length} photo(s) sélectionnée(s)</p>}

          <label>
            Légende commune (facultatif)
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ex. Réunion de famille, juillet 2026" />
          </label>

          {uploading && (
            <p className="modal-sub">
              Import en cours… {progress.done}/{progress.total}
            </p>
          )}
          {error && <p className="form-error" style={{ whiteSpace: 'pre-line' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={uploading}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={uploading || files.length === 0}>
              {uploading ? 'Import…' : `Importer (${files.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
