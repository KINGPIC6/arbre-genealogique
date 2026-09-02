import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError, EmptyState } from '../components/StateViews';
import { listContributions, addContribution } from '../services/contributionsService';
import { listMembers } from '../services/membersService';
import { supabase } from '../lib/supabaseClient';

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

export default function Contributions() {
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', memberId: '', date: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m] = await Promise.all([listContributions(), listMembers()]);
      setRows(c);
      setMembers(m.filter((x) => x.status === 'active'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('contributions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await addContribution(form);
      setForm({ amount: '', memberId: '', date: '', description: '' });
      await load();
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Contributions</h1>

      <section className="section">
        <h2>Ajouter une contribution</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__row">
            <div className="field">
              <label htmlFor="memberId">Membre</label>
              <select
                id="memberId"
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              >
                <option value="">Sélectionner…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.profile?.full_name}</option>
                ))}
              </select>
              {fieldErrors.memberId && <p className="field-error">{fieldErrors.memberId}</p>}
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

          {error && <InlineError message={error} />}

          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Ajout…' : 'Ajouter la contribution'}
          </button>
        </form>
      </section>

      <section className="section">
        <h2>Historique</h2>
        {loading && <InlineLoading />}
        {!loading && rows.length === 0 && (
          <EmptyState title="Aucune contribution enregistrée" description="Ajoutez la première contribution ci-dessus." />
        )}
        {!loading && rows.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Membre</th>
                  <th>Montant</th>
                  <th>Description</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{new Date(r.contribution_date).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Membre">{r.member?.profile?.full_name || '—'}</td>
                    <td data-label="Montant">{formatAmount(r.amount)}</td>
                    <td data-label="Description">{r.description || '—'}</td>
                    <td data-label="Statut"><span className={`badge badge--${r.status}`}>{r.status}</span></td>
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
