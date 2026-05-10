import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';

const navItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/surveys/new', icon: '➕', label: 'Nueva Encuesta' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

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
