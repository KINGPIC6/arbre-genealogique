import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, family_id, full_name, role, is_active, created_at')
    .eq('id', user.id)
    .single();
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function createFamily(familyName) {
  const { data, error } = await supabase.rpc('create_family', { p_family_name: familyName });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function requestJoinFamily(familyId) {
  const { data, error } = await supabase.rpc('request_join_family', { p_family_id: familyId });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function getGroupInfo(familyId) {
  const { data, error } = await supabase
    .from('group_info')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function updateGroupInfo(familyId, description) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('group_info')
    .upsert({ family_id: familyId, description, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) throw new Error(toSafeMessage(error));
}
