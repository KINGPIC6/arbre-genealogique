import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';
import { validateImageFile, invalidateMediaUrl } from '../lib/mediaUrl';

// ---------- Albums ----------

export async function listAlbums() {
  const { data, error } = await supabase
    .from('albums')
    .select('id, title, description, cover_photo_path, created_at, created_by')
    .order('created_at', { ascending: false });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function getAlbum(albumId) {
  const { data, error } = await supabase
    .from('albums')
    .select('id, title, description, cover_photo_path, created_at, created_by')
    .eq('id', albumId)
    .single();
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function createAlbum(familyId, userId, { title, description }) {
  const { data, error } = await supabase
    .from('albums')
    .insert({ family_id: familyId, created_by: userId, title, description: description || null })
    .select('id')
    .single();
  if (error) throw new Error(toSafeMessage(error));
  return data.id;
}

export async function updateAlbum(albumId, { title, description }) {
  const { error } = await supabase.from('albums').update({ title, description: description || null }).eq('id', albumId);
  if (error) throw new Error(toSafeMessage(error));
}

export async function deleteAlbum(albumId) {
  const { error } = await supabase.from('albums').delete().eq('id', albumId);
  if (error) throw new Error(toSafeMessage(error));
}

export async function setAlbumCover(albumId, coverPhotoPath) {
  const { error } = await supabase.from('albums').update({ cover_photo_path: coverPhotoPath }).eq('id', albumId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Photos ----------

export async function listAlbumPhotos(albumId) {
  const { data, error } = await supabase
    .from('photos')
    .select('id, storage_path, caption, taken_at, uploaded_by, created_at')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

function albumPhotoStoragePath(familyId, albumId, photoId, ext) {
  return `family/${familyId}/albums/${albumId}/${photoId}.${ext}`;
}

/** Téléverse un fichier puis crée la ligne `photos` correspondante. */
export async function uploadAlbumPhoto(familyId, albumId, userId, file, caption) {
  const ext = validateImageFile(file);

  const { data: inserted, error: insertError } = await supabase
    .from('photos')
    .insert({ family_id: familyId, album_id: albumId, uploaded_by: userId, storage_path: '', caption: caption || null })
    .select('id')
    .single();
  if (insertError) throw new Error(toSafeMessage(insertError));

  const path = albumPhotoStoragePath(familyId, albumId, inserted.id, ext);
  const { error: uploadError } = await supabase.storage
    .from('family-media')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    await supabase.from('photos').delete().eq('id', inserted.id);
    throw new Error(toSafeMessage(uploadError));
  }

  const { error: updateError } = await supabase.from('photos').update({ storage_path: path }).eq('id', inserted.id);
  if (updateError) throw new Error(toSafeMessage(updateError));

  return { id: inserted.id, storage_path: path };
}

export async function deletePhoto(photoId) {
  const { error } = await supabase.from('photos').delete().eq('id', photoId);
  if (error) throw new Error(toSafeMessage(error));
}

export function invalidatePhotoUrl(path) {
  invalidateMediaUrl(path);
}

// ---------- Tags (qui apparaît sur la photo) ----------

export async function listPhotoTags(photoId) {
  const { data, error } = await supabase
    .from('photo_tags')
    .select('id, family_member_id')
    .eq('photo_id', photoId);
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function tagMemberOnPhoto(familyId, photoId, familyMemberId, userId) {
  const { error } = await supabase
    .from('photo_tags')
    .insert({ family_id: familyId, photo_id: photoId, family_member_id: familyMemberId, tagged_by: userId });
  if (error) throw new Error(toSafeMessage(error));
}

export async function untagMemberFromPhoto(tagId) {
  const { error } = await supabase.from('photo_tags').delete().eq('id', tagId);
  if (error) throw new Error(toSafeMessage(error));
}

/** Photos où une personne donnée apparaît (affichées sur sa fiche membre). */
export async function listPhotosForMember(familyMemberId) {
  const { data, error } = await supabase
    .from('photo_tags')
    .select('photo:photos(id, storage_path, caption, album_id)')
    .eq('family_member_id', familyMemberId);
  if (error) throw new Error(toSafeMessage(error));
  return data.map((row) => row.photo).filter(Boolean);
}

// ---------- Commentaires ----------

export async function listPhotoComments(photoId) {
  const { data, error } = await supabase
    .from('photo_comments')
    .select('id, content, created_at, author_id, author:profiles(full_name)')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function addPhotoComment(familyId, photoId, userId, content) {
  const { error } = await supabase
    .from('photo_comments')
    .insert({ family_id: familyId, photo_id: photoId, author_id: userId, content });
  if (error) throw new Error(toSafeMessage(error));
}

export async function deletePhotoComment(commentId) {
  const { error } = await supabase.from('photo_comments').delete().eq('id', commentId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Temps réel ----------

export function subscribeToAlbumsChanges(familyId, onChange) {
  const channel = supabase
    .channel(`albums-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'albums', filter: `family_id=eq.${familyId}` }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToAlbumPhotosChanges(albumId, onChange) {
  const channel = supabase
    .channel(`album-photos-${albumId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos', filter: `album_id=eq.${albumId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_comments' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
