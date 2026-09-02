import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="public-page">
      <div className="public-hero">
        <span className="brand-mark brand-mark--lg" aria-hidden="true">⌂</span>
        <h1>Notre maison</h1>
        <p className="public-hero__subtitle">Espace familial</p>
        <p className="public-hero__lead">
          Un lieu commun pour suivre les contributions, les dépenses et la vie de votre famille,
          en toute confiance.
        </p>
        <div className="public-hero__actions">
          <Link to="/login" className="btn btn--primary">Se connecter</Link>
          <Link to="/register" className="btn btn--ghost">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}
