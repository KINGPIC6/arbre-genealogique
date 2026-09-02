import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

export async function listJoinRequests() {
  const { data, error } = await supabase
    .from('join_requests')
    .select('id, full_name, status, created_at, reviewed_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function reviewJoinRequest(requestId, approve) {
  const { data, error } = await supabase.rpc('review_join_request', {
    p_request_id: requestId,
    p_approve: approve,
  });
  if (error) throw new Error(toSafeMessage(error));
  if (data === false) throw new Error(toSafeMessage(new Error('Action non autorisée ou demande introuvable')));
}
