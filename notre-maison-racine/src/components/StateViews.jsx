export function InlineLoading({ label = 'Chargement…' }) {
  return <p className="inline-state inline-state--loading">{label}</p>;
}

export function InlineError({ message }) {
  return (
    <p className="inline-state inline-state--error" role="alert">
      {message}
    </p>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
    </div>
  );
}
