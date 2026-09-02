import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ne jamais inventer de valeur : on signale clairement la configuration manquante.
  // eslint-disable-next-line no-console
  console.error(
    'Configuration Supabase manquante : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
