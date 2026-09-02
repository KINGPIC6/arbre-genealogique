import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { InlineLoading, InlineError } from '../components/StateViews';
import { getGroupInfo, updateGroupInfo } from '../services/familyService';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { profile, isAdmin } = useAuth();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.family_id) return;
    setLoading(true);
    setError('');
    try {
      const info = await getGroupInfo(profile.family_id);
      setDescription(info?.description || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateGroupInfo(profile.family_id, description);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <h1 className="page-title">Paramètres</h1>

      <section className="section">
        <h2>Description de la famille</h2>
        {loading && <InlineLoading />}
        {!loading && (
          <form className="inline-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="description">Note visible par tous les membres</label>
              <textarea
                id="description"
                rows={4}
                disabled={!isAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <InlineError message={error} />}
            {saved && <p className="form-success">Enregistré.</p>}
            {isAdmin && (
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            )}
            {!isAdmin && <p className="page-lead">Seul un administrateur peut modifier cette note.</p>}
          </form>
        )}
      </section>
    </AppShell>
  );
}
