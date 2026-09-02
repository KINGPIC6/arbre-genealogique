import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';
import { getSignedMediaUrl, invalidateMediaUrl, validateImageFile } from '../lib/mediaUrl';

export async function listFamilyMembers() {
  const { data, error } = await supabase
    .from('family_members')
    .select('id, first_name, last_name, birth_date, death_date, birth_place, bio, photo_path, linked_profile_id, created_by, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function listFamilyRelationships() {
  const { data, error } = await supabase
    .from('family_relationships')
    .select('id, person_id, related_person_id, relationship_type');
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function createFamilyMember(familyId, userId, fields) {
  const { data, error } = await supabase
    .from('family_members')
    .insert({
      family_id: familyId,
      created_by: userId,
      first_name: fields.firstName,
      last_name: fields.lastName || null,
      birth_date: fields.birthDate || null,
      death_date: fields.deathDate || null,
      birth_place: fields.birthPlace || null,
      bio: fields.bio || null,
      photo_path: fields.photoPath || null,
    })
    .select('id')
    .single();
  if (error) throw new Error(toSafeMessage(error));
  return data.id;
}

export async function updateFamilyMember(memberId, fields) {
  const { error } = await supabase
    .from('family_members')
    .update({
      first_name: fields.firstName,
      last_name: fields.lastName || null,
      birth_date: fields.birthDate || null,
      death_date: fields.deathDate || null,
      birth_place: fields.birthPlace || null,
      bio: fields.bio || null,
      ...(fields.photoPath !== undefined ? { photo_path: fields.photoPath } : {}),
    })
    .eq('id', memberId);
  if (error) throw new Error(toSafeMessage(error));
}

export async function deleteFamilyMember(memberId) {
  const { error } = await supabase.from('family_members').delete().eq('id', memberId);
  if (error) throw new Error(toSafeMessage(error));
}

/**
 * Crée une relation entre deux membres déjà existants, vue depuis la
 * personne existante (existingId) sur laquelle l'action a été lancée.
 *
 * action :
 *  - 'add_parent' : newId devient un PARENT de existingId
 *  - 'add_child'  : newId devient un ENFANT de existingId
 *  - 'add_spouse' : newId devient le/la CONJOINT(E) de existingId (symétrique)
 */
export async function createRelationship(familyId, userId, action, existingId, newId) {
  let person_id;
  let related_person_id;
  let relationship_type;

  if (action === 'add_parent') {
    person_id = newId;
    related_person_id = existingId;
    relationship_type = 'PARENT_OF';
  } else if (action === 'add_child') {
    person_id = existingId;
    related_person_id = newId;
    relationship_type = 'PARENT_OF';
  } else if (action === 'add_spouse') {
    person_id = existingId;
    related_person_id = newId;
    relationship_type = 'SPOUSE_OF';
  } else {
    throw new Error('Type de relation inconnu.');
  }

  const { error } = await supabase.from('family_relationships').insert({
    family_id: familyId,
    created_by: userId,
    person_id,
    related_person_id,
    relationship_type,
  });
  if (error) throw new Error(toSafeMessage(error));
}

/** Ajoute un second parent à un enfant déjà existant (ex : "deuxième parent"). */
export async function addSecondParent(familyId, userId, parentId, childId) {
  const { error } = await supabase.from('family_relationships').insert({
    family_id: familyId,
    created_by: userId,
    person_id: parentId,
    related_person_id: childId,
    relationship_type: 'PARENT_OF',
  });
  if (error) throw new Error(toSafeMessage(error));
}

export async function deleteRelationship(relationshipId) {
  const { error } = await supabase.from('family_relationships').delete().eq('id', relationshipId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Photos (Supabase Storage, bucket privé "family-media") ----------

export function memberPhotoStoragePath(familyId, memberId, fileExt) {
  return `family/${familyId}/members/${memberId}/photo.${fileExt}`;
}

export async function uploadMemberPhoto(familyId, memberId, file) {
  const ext = validateImageFile(file);
  const path = memberPhotoStoragePath(familyId, memberId, ext);
  const { error } = await supabase.storage
    .from('family-media')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(toSafeMessage(error));
  invalidateMediaUrl(path);
  return path;
}

export async function getSignedPhotoUrl(path) {
  return getSignedMediaUrl(path);
}

// ---------- Temps réel ----------

export function subscribeToTreeChanges(familyId, onChange) {
  const channel = supabase
    .channel(`tree-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_relationships', filter: `family_id=eq.${familyId}` }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
