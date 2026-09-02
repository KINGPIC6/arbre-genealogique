import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ email, password });
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
        <h1>Connexion</h1>
        <p className="auth-card__subtitle">Retrouvez votre espace familial.</p>

        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <div className="auth-card__links">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
          <Link to="/register">Créer un compte</Link>
        </div>
      </form>
    </div>
  );
}
