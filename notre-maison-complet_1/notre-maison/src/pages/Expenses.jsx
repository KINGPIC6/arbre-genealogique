import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listExpenses, addExpense, getReceiptUrl } from '../services/expensesService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

export default function Expenses() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listExpenses();
      setRows(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setError('');
    setSubmitting(true);
    try {
      await addExpense({ ...form, receiptFile, familyId: profile?.family_id });
      setForm({ amount: '', category: '', date: '', description: '' });
      setReceiptFile(null);
      await load();
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewReceipt(path) {
    try {
      const url = await getReceiptUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Dépenses</h1>

      <section className="section">
        <h2>Ajouter une dépense</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__row">
            <div className="field">
              <label htmlFor="category">Catégorie</label>
              <input
                id="category"
                type="text"
                placeholder="Ex. Alimentation, Santé, Logement"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              {fieldErrors.category && <p className="field-error">{fieldErrors.category}</p>}
            </div>

            <div className="field">
              <label htmlFor="amount">Montant</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              {fieldErrors.amount && <p className="field-error">{fieldErrors.amount}</p>}
            </div>

            <div className="field">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description (facultatif)</label>
            <input
              id="description"
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="receipt">Justificatif (facultatif — JPEG, PNG ou PDF, 5 Mo max)</label>
            <input
              id="receipt"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
          </div>

          {error && <InlineError message={error} />}

          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Ajout…' : 'Ajouter la dépense'}
          </button>
        </form>
      </section>

      <section className="section">
        <h2>Historique</h2>
        {loading && <InlineLoading />}
        {!loading && rows.length === 0 && (
          <EmptyState title="Aucune dépense enregistrée" description="Ajoutez la première dépense ci-dessus." />
        )}
        {!loading && rows.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th>Justificatif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{new Date(r.expense_date).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Catégorie">{r.category}</td>
                    <td data-label="Montant">{formatAmount(r.amount)}</td>
                    <td data-label="Description">{r.description || '—'}</td>
                    <td data-label="Justificatif">
                      {r.receipt_path ? (
                        <button className="link-btn" onClick={() => handleViewReceipt(r.receipt_path)}>
                          Voir
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
