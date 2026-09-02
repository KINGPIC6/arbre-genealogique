import { useNavigate } from 'react-router-dom';
import AlbumPhoto from './AlbumPhoto';

export default function AlbumCard({ album }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="album-card" onClick={() => navigate(`/albums/${album.id}`)}>
      <div className="album-card__cover">
        {album.cover_photo_path ? (
          <AlbumPhoto path={album.cover_photo_path} alt={album.title} />
        ) : (
          <span className="album-card__cover-fallback" aria-hidden="true">📷</span>
        )}
      </div>
      <div className="album-card__body">
        <h3>{album.title}</h3>
        {album.description && <p>{album.description}</p>}
      </div>
    </button>
  );
}
