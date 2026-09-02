import AlbumPhoto from '../albums/AlbumPhoto';

function formatEventDate(event) {
  if (event.event_date) {
    return new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (event.approx_year) return `vers ${event.approx_year}`;
  return 'Date inconnue';
}

export default function EventCard({ event, onOpen }) {
  const memberCount = event.event_members?.length || 0;
  const photoCount = event.event_photos?.length || 0;
  const firstPhoto = event.event_photos?.[0]?.photo;

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(event.id);
    }
  }

  return (
    <div
      className="history-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(event.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="history-card__marker" aria-hidden="true" />
      <div className="history-card__body">
        <span className="history-card__date">{formatEventDate(event)}</span>
        <h3>{event.title}</h3>
        {event.location && <p className="history-card__location">📍 {event.location}</p>}
        {event.description && <p className="history-card__excerpt">{event.description}</p>}
        <p className="history-card__meta">
          {memberCount > 0 && `${memberCount} personne${memberCount > 1 ? 's' : ''}`}
          {memberCount > 0 && photoCount > 0 && ' · '}
          {photoCount > 0 && `${photoCount} photo${photoCount > 1 ? 's' : ''}`}
        </p>
      </div>
      {firstPhoto?.storage_path && (
        <div className="history-card__thumb">
          <AlbumPhoto path={firstPhoto.storage_path} alt="" />
        </div>
      )}
    </div>
  );
}
