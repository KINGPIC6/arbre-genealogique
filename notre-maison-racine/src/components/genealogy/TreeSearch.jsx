import { useMemo, useState } from 'react';

export default function TreeSearch({ members, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => `${m.first_name} ${m.last_name || ''}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, members]);

  return (
    <div className="tree-search">
      <input
        type="search"
        placeholder="🔎 Rechercher un membre"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Rechercher un membre de la famille"
      />
      {open && results.length > 0 && (
        <ul className="tree-search__results">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m.id);
                  setQuery(`${m.first_name} ${m.last_name || ''}`.trim());
                  setOpen(false);
                }}
              >
                {m.first_name} {m.last_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
