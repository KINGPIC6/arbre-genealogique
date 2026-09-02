import MemberPhoto from './MemberPhoto';

function relatedNames(ids, membersById) {
  return ids
    .map((id) => membersById.get(id))
    .filter(Boolean)
    .map((m) => `${m.first_name} ${m.last_name || ''}`.trim());
}

export default function MemberDetailPanel({
  member,
  relationships,
  membersById,
  isAdmin,
  onClose,
  onAddRelative,
  onEdit,
  onDelete,
  onShowAscendants,
  onShowDescendants,
}) {
  if (!member) return null;

  const parents = relationships
    .filter((r) => r.relationship_type === 'PARENT_OF' && r.related_person_id === member.id)
    .map((r) => r.person_id);
  const children = relationships
    .filter((r) => r.relationship_type === 'PARENT_OF' && r.person_id === member.id)
    .map((r) => r.related_person_id);
  const spouses = relationships
    .filter((r) => r.relationship_type === 'SPOUSE_OF' && (r.person_id === member.id || r.related_person_id === member.id))
    .map((r) => (r.person_id === member.id ? r.related_person_id : r.person_id));
  const siblingSet = new Set();
  for (const parentId of parents) {
    for (const r of relationships) {
      if (r.relationship_type === 'PARENT_OF' && r.person_id === parentId && r.related_person_id !== member.id) {
        siblingSet.add(r.related_person_id);
      }
    }
  }

  return (
    <aside className="member-panel" aria-label="Fiche du membre sélectionné">
      <button type="button" className="member-panel__close" onClick={onClose} aria-label="Fermer la fiche">
        ×
      </button>

      <div className="member-panel__header">
        <MemberPhoto member={member} size={96} />
        <h2>
          {member.first_name} {member.last_name}
        </h2>
        <p className="member-panel__dates">
          {member.birth_date ? `Né(e) le ${member.birth_date}` : 'Date de naissance inconnue'}
          {member.birth_place ? ` à ${member.birth_place}` : ''}
          {member.death_date ? ` · Décédé(e) le ${member.death_date}` : ''}
        </p>
      </div>

      {member.bio && <p className="member-panel__bio">{member.bio}</p>}

      <dl className="member-panel__relations">
        <dt>Parents</dt>
        <dd>{relatedNames(parents, membersById).join(', ') || '—'}</dd>
        <dt>Conjoint(e)</dt>
        <dd>{relatedNames(spouses, membersById).join(', ') || '—'}</dd>
        <dt>Enfants</dt>
        <dd>{relatedNames(children, membersById).join(', ') || '—'}</dd>
        <dt>Frères / sœurs</dt>
        <dd>{relatedNames(Array.from(siblingSet), membersById).join(', ') || '—'}</dd>
      </dl>

      <div className="member-panel__actions">
        <button type="button" className="btn btn--soft" onClick={() => onAddRelative('add_parent')}>
          + Ajouter un parent
        </button>
        <button type="button" className="btn btn--soft" onClick={() => onAddRelative('add_spouse')}>
          + Ajouter un conjoint
        </button>
        <button type="button" className="btn btn--soft" onClick={() => onAddRelative('add_child')}>
          + Ajouter un enfant
        </button>
      </div>

      <div className="member-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onShowAscendants}>
          Voir les ascendants
        </button>
        <button type="button" className="btn btn--ghost" onClick={onShowDescendants}>
          Voir les descendants
        </button>
      </div>

      <div className="member-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onEdit}>
          Modifier
        </button>
        {isAdmin && (
          <button type="button" className="btn btn--danger" onClick={onDelete}>
            Supprimer
          </button>
        )}
      </div>
    </aside>
  );
}
