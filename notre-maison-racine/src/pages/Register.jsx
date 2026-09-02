import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../services/authService';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
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
      const data = await signUp({ email, password, fullName });
      if (data.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="brand-mark" aria-hidden="true">⌂</span>
          <h1>Vérifiez vos e-mails</h1>
          <p className="auth-card__subtitle">
            Un e-mail de confirmation vous a été envoyé. Confirmez votre adresse pour activer votre compte.
          </p>
          <Link to="/login" className="btn btn--primary">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="brand-mark" aria-hidden="true">⌂</span>
        <h1>Créer un compte</h1>
        <p className="auth-card__subtitle">Rejoignez ou créez l'espace de votre famille.</p>

        <label htmlFor="fullName">Nom complet</label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        <div className="auth-card__links">
          <Link to="/login">J'ai déjà un compte</Link>
        </div>
      </form>
    </div>
  );
}
