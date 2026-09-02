import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

export function validateContribution({ amount, memberId, date }) {
  const errors = {};
  const numAmount = Number(amount);
  if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) {
    errors.amount = 'Le montant doit être un nombre positif.';
  }
  if (!memberId) {
    errors.memberId = 'Sélectionnez un membre.';
  }
  if (!date) {
    errors.date = 'La date est obligatoire.';
  } else if (new Date(date) > new Date()) {
    errors.date = 'La date ne peut pas être dans le futur.';
  }
  return errors;
}

export async function listContributions() {
  const { data, error } = await supabase
    .from('contributions')
    .select('id, amount, contribution_date, description, status, created_at, member:members(id, profile:profiles(full_name))')
    .order('contribution_date', { ascending: false });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

export async function addContribution({ amount, memberId, date, description }) {
  const errors = validateContribution({ amount, memberId, date });
  if (Object.keys(errors).length > 0) {
    const err = new Error('Données invalides.');
    err.fieldErrors = errors;
    throw err;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('contributions').insert({
    amount: Number(amount),
    member_id: memberId,
    contribution_date: date,
    description: description || null,
    created_by: user.id,
  });
  if (error) throw new Error(toSafeMessage(error));
}
