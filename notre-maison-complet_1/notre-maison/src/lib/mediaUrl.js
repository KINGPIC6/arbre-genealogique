import { supabase } from './supabaseClient';

const TTL_SECONDS = 3600;
const cache = new Map(); // path -> { url, expiresAt }

export async function getSignedMediaUrl(path) {
  if (!path) return null;
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url;

  const { data, error } = await supabase.storage.from('family-media').createSignedUrl(path, TTL_SECONDS);
  if (error || !data) return null;
  cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  return data.signedUrl;
}

export function invalidateMediaUrl(path) {
  cache.delete(path);
}

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error('Format non pris en charge (JPG, PNG ou WEBP uniquement).');
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Le fichier dépasse la taille maximale autorisée (8 Mo).');
  }
  return ext;
}
