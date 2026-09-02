import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

export async function listMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, status, created_at, profile:profiles(id, full_name, role, is_active)')
    .order('created_at', { ascending: true });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function setMemberStatus(memberId, status) {
  const { error } = await supabase.from('members').update({ status }).eq('id', memberId);
  if (error) throw new Error(toSafeMessage(error));
}

export async function changeRole(profileId, newRole) {
  const { data, error } = await supabase.rpc('attempt_role_change', {
    p_target_profile_id: profileId,
    p_new_role: newRole,
  });
  if (error) throw new Error(toSafeMessage(error));
  if (data === false) throw new Error(toSafeMessage(new Error('Action non autorisée')));
}
