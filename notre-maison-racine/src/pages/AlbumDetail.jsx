import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import {
  getAlbum,
  listAlbumPhotos,
  deleteAlbum,
  setAlbumCover,
  subscribeToAlbumPhotosChanges,
} from '../services/albumsService';
import { listFamilyMembers } from '../services/genealogyService';
import AlbumPhoto from '../components/albums/AlbumPhoto';
import AlbumFormModal from '../components/albums/AlbumFormModal';
import PhotoUploadModal from '../components/albums/PhotoUploadModal';
import PhotoLightbox from '../components/albums/PhotoLightbox';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user, isAdmin } = useAuth();
  const familyId = profile?.family_id;

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [a, p, m] = await Promise.all([getAlbum(id), listAlbumPhotos(id), listFamilyMembers()]);
      setAlbum(a);
      setPhotos(p);
      setMembers(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeToAlbumPhotosChanges(id, () => load()), [id, load]);

  const canManageAlbum = isAdmin || album?.created_by === user?.id;

  async function handleDeleteAlbum() {
    if (!window.confirm(`Supprimer l'album "${album.title}" et toutes ses photos ?`)) return;
    try {
      await deleteAlbum(album.id);
      navigate('/albums');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetCover(path) {
    try {
      await setAlbumCover(album.id, path);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!familyId) {
    return (
      <AppShell>
        <InlineError message="Vous devez appartenir à une famille pour accéder aux albums." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button type="button" className="link-btn" onClick={() => navigate('/albums')}>
        ← Tous les albums
      </button>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && !error && album && (
        <>
          <div className="tree-page-header">
            <div>
              <h1 className="page-title">{album.title}</h1>
              {album.description && <p className="page-lead">{album.description}</p>}
            </div>
            <div className="tree-page-header__actions">
              <button type="button" className="btn btn--primary" onClick={() => setShowUpload(true)}>
                + Importer des photos
              </button>
              {canManageAlbum && (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowEdit(true)}>
                    Modifier
                  </button>
                  <button type="button" className="btn btn--danger" onClick={handleDeleteAlbum}>
                    Supprimer l'album
                  </button>
                </>
              )}
            </div>
          </div>

          {photos.length === 0 ? (
            <EmptyState title="Aucune photo pour l'instant" description="Importez vos premières photos dans cet album." />
          ) : (
            <div className="album-photo-grid">
              {photos.map((p, index) => (
                <div key={p.id} className="album-photo-grid__cell">
                  <AlbumPhoto path={p.storage_path} alt={p.caption || album.title} onClick={() => setLightboxIndex(index)} />
                  {canManageAlbum && p.storage_path !== album.cover_photo_path && (
                    <button type="button" className="album-photo-grid__cover-btn" onClick={() => handleSetCover(p.storage_path)}>
                      Définir comme couverture
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showEdit && album && (
        <AlbumFormModal
          familyId={familyId}
          userId={user?.id}
          album={album}
          onClose={() => setShowEdit(false)}
          onSaved={async () => {
            setShowEdit(false);
            await load();
          }}
        />
      )}

      {showUpload && (
        <PhotoUploadModal
          familyId={familyId}
          albumId={id}
          userId={user?.id}
          onClose={() => setShowUpload(false)}
          onUploaded={async () => {
            setShowUpload(false);
            await load();
          }}
        />
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <PhotoLightbox
          photo={photos[lightboxIndex]}
          familyId={familyId}
          userId={user?.id}
          isAdmin={isAdmin}
          members={members}
          onClose={() => setLightboxIndex(null)}
          onDeleted={async () => {
            setLightboxIndex(null);
            await load();
          }}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex((i) => i - 1) : undefined}
          onNext={lightboxIndex < photos.length - 1 ? () => setLightboxIndex((i) => i + 1) : undefined}
        />
      )}
    </AppShell>
  );
}
