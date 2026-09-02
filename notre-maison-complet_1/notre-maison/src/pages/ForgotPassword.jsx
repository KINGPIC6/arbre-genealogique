import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
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
        <h1>Mot de passe oublié</h1>
        <p className="auth-card__subtitle">
          Indiquez votre e-mail, nous vous enverrons un lien de réinitialisation.
        </p>

        {sent ? (
          <p className="form-success">
            Si un compte existe pour cette adresse, un e-mail vient d'être envoyé.
          </p>
        ) : (
          <>
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </>
        )}

        <div className="auth-card__links">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </form>
    </div>
  );
}
