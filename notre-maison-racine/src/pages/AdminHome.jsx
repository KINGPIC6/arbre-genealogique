import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';

const SECTIONS = [
  { to: '/admin/members', title: 'Membres', description: "Gérer les statuts et rôles des membres de la famille." },
  { to: '/admin/requests', title: "Demandes d'adhésion", description: 'Accepter ou refuser les demandes en attente.' },
  { to: '/admin/security', title: 'Sécurité', description: 'Consulter le journal des événements de sécurité.' },
];

export default function AdminHome() {
  return (
    <AppShell>
      <h1 className="page-title">Administration</h1>
      <p className="page-lead">Ces actions sont réservées aux administrateurs de la famille.</p>

      <div className="admin-grid">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="admin-card">
            <h2>{s.title}</h2>
            <p>{s.description}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
