import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STUDENT_LINKS = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/budgets', label: 'Budgets', icon: '▢' },
  { to: '/reports', label: 'Reports', icon: '▤' },
  { to: '/categories', label: 'Categories', icon: '◈' },
  { to: '/insights', label: 'Insights & Tips', icon: '✦' },
  { to: '/sitemap', label: 'Sitemap', icon: '⌘' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Overview', icon: '⌂' },
  { to: '/sitemap', label: 'Sitemap', icon: '⌘' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('cc_theme') || 'light');
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('cc_font') || 1));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${15 * fontScale}px`;
    localStorage.setItem('cc_font', fontScale);
  }, [fontScale]);

  const links = user?.role === 'admin' ? ADMIN_LINKS : STUDENT_LINKS;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--ink)', color: 'var(--paper)',
        padding: '22px 16px', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--gold)' }}>🪙</span> Campus Coin
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/' || l.to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 4, textDecoration: 'none',
                color: isActive ? 'var(--ink)' : 'var(--paper)',
                background: isActive ? 'var(--gold)' : 'transparent',
                fontWeight: isActive ? 700 : 500, fontSize: 14,
              })}
            >
              <span aria-hidden>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(250,247,240,0.15)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 8 }}>Signed in as<br /><strong style={{ opacity: 1 }}>{user?.name}</strong></div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button className="btn small secondary" style={{ borderColor: 'rgba(250,247,240,0.4)', color: 'var(--paper)' }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? '☾ Dark' : '☀ Light'}
            </button>
            <button className="btn small secondary" style={{ borderColor: 'rgba(250,247,240,0.4)', color: 'var(--paper)' }}
              onClick={() => setFontScale(fontScale >= 1.2 ? 0.9 : fontScale + 0.15)}>
              A{fontScale >= 1.1 ? '+' : ''}
            </button>
          </div>
          <button className="btn small" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px', maxWidth: 1080 }}>
        <Outlet />
      </main>
    </div>
  );
}
