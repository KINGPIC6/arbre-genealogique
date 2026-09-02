import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import { listAlbums, subscribeToAlbumsChanges } from '../services/albumsService';
import AlbumCard from '../components/albums/AlbumCard';
import AlbumFormModal from '../components/albums/AlbumFormModal';

export default function Albums() {
  const { profile, user } = useAuth();
  const familyId = profile?.family_id;

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAlbums(await listAlbums());
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
    return subscribeToAlbumsChanges(familyId, () => load());
  }, [familyId, load]);

  if (!familyId) {
    return (
      <AppShell>
        <InlineError message="Vous devez appartenir à une famille pour accéder aux albums." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="tree-page-header">
        <div>
          <h1 className="page-title">📷 Album photo</h1>
          <p className="page-lead">Les souvenirs et photos de la famille, organisés par album.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
          + Nouvel album
        </button>
      </div>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && !error && albums.length === 0 && (
        <EmptyState title="Aucun album pour l'instant" description="Créez votre premier album pour commencer à partager vos souvenirs." />
      )}

      {!loading && !error && albums.length > 0 && (
        <div className="album-grid">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      )}

      {showCreate && (
        <AlbumFormModal
          familyId={familyId}
          userId={user?.id}
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}
