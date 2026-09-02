import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';
import {
  listFamilyMembers,
  listFamilyRelationships,
  deleteFamilyMember,
  subscribeToTreeChanges,
} from '../services/genealogyService';
import { getAncestorIds, getDescendantIds } from '../lib/treeLayout';
import TreeCanvas from '../components/genealogy/TreeCanvas';
import TreeSearch from '../components/genealogy/TreeSearch';
import MemberDetailPanel from '../components/genealogy/MemberDetailPanel';
import AddMemberModal from '../components/genealogy/AddMemberModal';
import EditMemberModal from '../components/genealogy/EditMemberModal';

export default function Tree() {
  const { profile, user, isAdmin } = useAuth();
  const familyId = profile?.family_id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [highlightIds, setHighlightIds] = useState(null);
  const [focusSignal, setFocusSignal] = useState(null);

  const [addModal, setAddModal] = useState(null); // { action, referenceMember } | null
  const [editModal, setEditModal] = useState(false);

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const selectedMember = selectedId ? membersById.get(selectedId) : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, r] = await Promise.all([listFamilyMembers(), listFamilyRelationships()]);
      setMembers(m);
      setRelationships(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Retour depuis une photo taguée (/tree?focus=<id>) : sélectionne et
  // recentre automatiquement sur ce membre une fois les données chargées.
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || members.length === 0) return;
    if (!membersById.has(focusId)) return;
    setSelectedId(focusId);
    setFocusSignal({ id: focusId, nonce: Date.now() });
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, searchParams]);

  // Temps réel : toute modification par un autre membre de la famille
  // rafraîchit automatiquement l'arbre (§33 du cahier des charges).
  useEffect(() => {
    if (!familyId) return undefined;
    const unsubscribe = subscribeToTreeChanges(familyId, () => load());
    return unsubscribe;
  }, [familyId, load]);

  function handleSelect(id) {
    setSelectedId(id);
    setHighlightIds(null);
  }

  function handleAddRelative(action) {
    setAddModal({ action, referenceMember: selectedMember });
  }

  function handleShowAscendants() {
    if (!selectedMember) return;
    setHighlightIds(getAncestorIds(selectedMember.id, relationships));
  }

  function handleShowDescendants() {
    if (!selectedMember) return;
    setHighlightIds(getDescendantIds(selectedMember.id, relationships));
  }

  async function handleDelete() {
    if (!selectedMember) return;
    const fullName = `${selectedMember.first_name} ${selectedMember.last_name || ''}`.trim();
    if (!window.confirm(`Supprimer ${fullName} de l'arbre ? Cette action est irréversible.`)) return;
    try {
      await deleteFamilyMember(selectedMember.id);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!familyId) {
    return (
      <AppShell>
        <InlineError message="Vous devez appartenir à une famille pour accéder à l'arbre." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="tree-page-header">
        <div>
          <h1 className="page-title">🌳 Notre arbre généalogique</h1>
          <p className="page-lead">
            {members.length > 0
              ? `${members.length} membre${members.length > 1 ? 's' : ''} enregistré${members.length > 1 ? 's' : ''}.`
              : 'Commencez par ajouter le premier membre de votre arbre.'}
          </p>
        </div>
        <div className="tree-page-header__actions">
          <TreeSearch
            members={members}
            onSelect={(id) => {
              setSelectedId(id);
              setHighlightIds(null);
              setFocusSignal({ id, nonce: Date.now() });
            }}
          />
          <button type="button" className="btn btn--primary" onClick={() => setAddModal({ action: 'root', referenceMember: null })}>
            + Ajouter un membre
          </button>
        </div>
      </div>

      {loading && <InlineLoading />}
      {error && <InlineError message={error} />}

      {!loading && !error && (
        <div className="tree-layout">
          <TreeCanvas
            members={members}
            relationships={relationships}
            selectedId={selectedId}
            highlightIds={highlightIds}
            onSelect={handleSelect}
            focusSignal={focusSignal}
          />

          {selectedMember && (
            <MemberDetailPanel
              member={selectedMember}
              relationships={relationships}
              membersById={membersById}
              isAdmin={isAdmin}
              onClose={() => setSelectedId(null)}
              onAddRelative={handleAddRelative}
              onEdit={() => setEditModal(true)}
              onDelete={handleDelete}
              onShowAscendants={handleShowAscendants}
              onShowDescendants={handleShowDescendants}
            />
          )}
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <EmptyState
          title="Aucun membre pour l'instant"
          description="Ajoutez le premier membre pour commencer à construire votre arbre."
        />
      )}

      {addModal && (
        <AddMemberModal
          action={addModal.action}
          referenceMember={addModal.referenceMember}
          familyId={familyId}
          userId={user?.id}
          otherMembers={members}
          onClose={() => setAddModal(null)}
          onCreated={async (newId) => {
            setAddModal(null);
            await load();
            setSelectedId(newId);
          }}
        />
      )}

      {editModal && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          familyId={familyId}
          onClose={() => setEditModal(false)}
          onSaved={async () => {
            setEditModal(false);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}
