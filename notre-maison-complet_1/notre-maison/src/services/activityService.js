import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

export async function listActivity(limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, action, details, created_at, actor:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function listSecurityLogs(limit = 100) {
  const { data, error } = await supabase
    .from('security_logs')
    .select('id, event_type, level, details, created_at, actor:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(toSafeMessage(error));
  return data;
}
