import { useEffect, useState } from 'react';
import { getSignedMediaUrl } from '../../lib/mediaUrl';

export default function AlbumPhoto({ path, alt = '', className = '', onClick }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return undefined;
    }
    getSignedMediaUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <button type="button" className={`album-photo ${className}`} onClick={onClick} disabled={!onClick}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <span className="album-photo__placeholder" aria-hidden="true" />
      )}
    </button>
  );
}
