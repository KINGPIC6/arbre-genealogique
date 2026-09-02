import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

const EVENT_SELECT = `
  id, title, description, event_date, approx_year, location, created_by, created_at, updated_at,
  event_members:family_history_event_members ( family_member_id ),
  event_photos:family_history_event_photos ( id, photo_id, created_by, photo:photos ( id, storage_path, caption ) )
`;

/** Clé de tri chronologique commune aux dates exactes et aux années approximatives. */
export function eventSortKey(event) {
  if (event.event_date) return event.event_date;
  if (event.approx_year) return `${event.approx_year}-01-01`;
  return null; // évènements sans date connue : classés à part
}

export async function listHistoryEvents() {
  const { data, error } = await supabase.from('family_history_events').select(EVENT_SELECT);
  if (error) throw new Error(toSafeMessage(error));

  const withDate = [];
  const withoutDate = [];
  for (const e of data) {
    (eventSortKey(e) ? withDate : withoutDate).push(e);
  }
  withDate.sort((a, b) => (eventSortKey(a) < eventSortKey(b) ? -1 : 1));
  withoutDate.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return { withDate, withoutDate };
}

export async function getHistoryEvent(eventId) {
  const { data, error } = await supabase.from('family_history_events').select(EVENT_SELECT).eq('id', eventId).single();
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function createHistoryEvent(familyId, userId, fields) {
  const { data, error } = await supabase
    .from('family_history_events')
    .insert({
      family_id: familyId,
      created_by: userId,
      title: fields.title,
      description: fields.description || null,
      event_date: fields.eventDate || null,
      approx_year: fields.approxYear || null,
      location: fields.location || null,
    })
    .select('id')
    .single();
  if (error) throw new Error(toSafeMessage(error));
  return data.id;
}

export async function updateHistoryEvent(eventId, fields) {
  const { error } = await supabase
    .from('family_history_events')
    .update({
      title: fields.title,
      description: fields.description || null,
      event_date: fields.eventDate || null,
      approx_year: fields.approxYear || null,
      location: fields.location || null,
    })
    .eq('id', eventId);
  if (error) throw new Error(toSafeMessage(error));
}

export async function deleteHistoryEvent(eventId) {
  const { error } = await supabase.from('family_history_events').delete().eq('id', eventId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Personnes concernées (réutilise family_members) ----------

export async function addEventMember(familyId, eventId, familyMemberId) {
  const { error } = await supabase
    .from('family_history_event_members')
    .insert({ family_id: familyId, event_id: eventId, family_member_id: familyMemberId });
  if (error) throw new Error(toSafeMessage(error));
}

export async function removeEventMember(eventId, familyMemberId) {
  const { error } = await supabase
    .from('family_history_event_members')
    .delete()
    .eq('event_id', eventId)
    .eq('family_member_id', familyMemberId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Photos associées (réutilise la table photos / bucket family-media) ----------

/** Photos déjà existantes dans la famille (tous albums confondus), pour le sélecteur. */
export async function listFamilyPhotosForPicker() {
  const { data, error } = await supabase
    .from('photos')
    .select('id, storage_path, caption, album_id')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function attachPhotoToEvent(familyId, eventId, userId, photoId) {
  const { error } = await supabase
    .from('family_history_event_photos')
    .insert({ family_id: familyId, event_id: eventId, photo_id: photoId, created_by: userId });
  if (error) throw new Error(toSafeMessage(error));
}

export async function detachPhotoFromEvent(linkId) {
  const { error } = await supabase.from('family_history_event_photos').delete().eq('id', linkId);
  if (error) throw new Error(toSafeMessage(error));
}

// ---------- Temps réel ----------

export function subscribeToHistoryChanges(familyId, onChange) {
  const channel = supabase
    .channel(`history-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_history_events', filter: `family_id=eq.${familyId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_history_event_members', filter: `family_id=eq.${familyId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_history_event_photos', filter: `family_id=eq.${familyId}` }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
