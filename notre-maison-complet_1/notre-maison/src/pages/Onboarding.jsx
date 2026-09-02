import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFamily, requestJoinFamily } from '../services/familyService';
import { useAuth } from '../hooks/useAuth';

export default function Onboarding() {
  const [mode, setMode] = useState('create');
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createFamily(familyName);
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestJoinFamily(familyCode.trim());
      setRequested(true);
    } catch (err) {
      setError('Code famille invalide ou erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  }

  if (requested) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="brand-mark" aria-hidden="true">⌂</span>
          <h1>Demande envoyée</h1>
          <p className="auth-card__subtitle">
            Votre demande a été transmise à l'administrateur de la famille. Vous recevrez l'accès dès son
            acceptation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="brand-mark" aria-hidden="true">⌂</span>
        <h1>Bienvenue</h1>
        <p className="auth-card__subtitle">Créez l'espace de votre famille ou rejoignez-en un existant.</p>

        <div className="segmented">
          <button
            type="button"
            className={mode === 'create' ? 'segmented__btn segmented__btn--active' : 'segmented__btn'}
            onClick={() => setMode('create')}
          >
            Créer une famille
          </button>
          <button
            type="button"
            className={mode === 'join' ? 'segmented__btn segmented__btn--active' : 'segmented__btn'}
            onClick={() => setMode('join')}
          >
            Rejoindre une famille
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <label htmlFor="familyName">Nom de la famille</label>
            <input
              id="familyName"
              type="text"
              placeholder="Ex. Famille Kouassi"
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? 'Création…' : 'Créer notre espace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <label htmlFor="familyCode">Identifiant de la famille</label>
            <input
              id="familyCode"
              type="text"
              placeholder="Fourni par un administrateur"
              required
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
