import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/authService';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="brand-mark" aria-hidden="true">⌂</span>
        <h1>Nouveau mot de passe</h1>
        <label htmlFor="password">Nouveau mot de passe</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  );
}
