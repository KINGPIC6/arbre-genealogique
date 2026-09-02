import { supabase } from '../lib/supabaseClient';
import { toSafeMessage } from '../utils/errors';

const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5 Mo, aligné sur la limite du bucket

export function validateExpense({ amount, category, date }) {
  const errors = {};
  const numAmount = Number(amount);
  if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) {
    errors.amount = 'Le montant doit être un nombre positif.';
  }
  if (!category || !category.trim()) {
    errors.category = 'La catégorie est obligatoire.';
  }
  if (!date) {
    errors.date = 'La date est obligatoire.';
  } else if (new Date(date) > new Date()) {
    errors.date = 'La date ne peut pas être dans le futur.';
  }
  return errors;
}

export async function listExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, category, expense_date, description, receipt_path, created_at')
    .order('expense_date', { ascending: false });
  if (error) throw new Error(toSafeMessage(error));
  return data;
}

function safeFileName(originalName) {
  const ext = (originalName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = crypto.randomUUID();
  return `${random}.${ext}`;
}

export async function uploadReceipt(familyId, file) {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    throw new Error('Format de fichier non autorisé (JPEG, PNG ou PDF uniquement).');
  }
  if (file.size > MAX_RECEIPT_SIZE) {
    throw new Error('Le fichier dépasse la taille maximale autorisée (5 Mo).');
  }
  const path = `${familyId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: false });
  if (error) throw new Error(toSafeMessage(error));
  return path;
}

export async function addExpense({ amount, category, date, description, receiptFile, familyId }) {
  const errors = validateExpense({ amount, category, date });
  if (Object.keys(errors).length > 0) {
    const err = new Error('Données invalides.');
    err.fieldErrors = errors;
    throw err;
  }
  const { data: { user } } = await supabase.auth.getUser();

  let receiptPath = null;
  if (receiptFile) {
    receiptPath = await uploadReceipt(familyId, receiptFile);
  }

  const { error } = await supabase.from('expenses').insert({
    amount: Number(amount),
    category: category.trim(),
    expense_date: date,
    description: description || null,
    receipt_path: receiptPath,
    created_by: user.id,
  });
  if (error) throw new Error(toSafeMessage(error));
}

export async function getReceiptUrl(path) {
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60);
  if (error) throw new Error(toSafeMessage(error));
  return data.signedUrl;
}
