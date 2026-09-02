import { useEffect, useState } from 'react';
import { getSignedPhotoUrl } from '../../services/genealogyService';

function initials(member) {
  const a = (member.first_name || '').charAt(0);
  const b = (member.last_name || '').charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}

export default function MemberPhoto({ member, size = 56, className = '' }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!member?.photo_path) {
      setUrl(null);
      return undefined;
    }
    getSignedPhotoUrl(member.photo_path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [member?.photo_path]);

  if (url) {
    return (
      <img
        src={url}
        alt={`Photo de ${member.first_name} ${member.last_name || ''}`.trim()}
        className={`member-photo ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={`member-photo member-photo--fallback ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {initials(member)}
    </div>
  );
}
