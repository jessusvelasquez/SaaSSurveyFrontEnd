import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';

const navItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/surveys/new', icon: '➕', label: 'Nueva Encuesta' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAttributes()
      .then(attrs => setEmail(attrs.email ?? null))
      .catch(err => console.error('Error fetching user attributes:', err));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📋</div>
          <div>
            <div className="sidebar-logo-text">SurveyOS</div>
            <div className="sidebar-logo-sub">Panel de Admin</div>
          </div>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto' }}>
          {email && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: '0.75rem',
              color: 'var(--color-text-subtle)',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: 'var(--space-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>USUARIO</div>
              {email}
            </div>
          )}
          <button className="nav-link" onClick={handleSignOut}>
            <span>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content animate-in">{children}</main>
    </div>
  );
}
