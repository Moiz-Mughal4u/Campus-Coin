import Logo from './Logo';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ArrowUpDown, Wallet, BarChart3, Tags, Lightbulb, Map, Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import Loader from './Loader';

const STUDENT_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowUpDown },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/insights', label: 'Insights & Tips', icon: Lightbulb },
  { to: '/sitemap', label: 'Sitemap', icon: Map },
];
const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
  { to: '/sitemap', label: 'Sitemap', icon: Map },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('cc_theme') || 'light');
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('cc_font') || 1));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cc_theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.style.fontSize = `${15 * fontScale}px`; localStorage.setItem('cc_font', fontScale); }, [fontScale]);
  useEffect(() => {
    setIsNavigating(true); setIsMobileMenuOpen(false);
    const t = setTimeout(() => setIsNavigating(false), 350);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const links = user?.role === 'admin' ? ADMIN_LINKS : STUDENT_LINKS;

  const SidebarContent = () => (
    <>
      <div style={{ marginBottom: 32 }}>
        <Logo size={40} light={true} />
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.to === '/' || l.to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 'var(--radius)', textDecoration: 'none',
                color: isActive ? 'var(--ink)' : 'var(--paper)',
                background: isActive ? 'var(--gold)' : 'transparent',
                fontWeight: isActive ? 700 : 500, fontSize: 14, transition: 'all 0.2s ease'
              })}>
              <Icon size={18} strokeWidth={2} /> {l.label}
            </NavLink>
          );
        })}
      </nav>
      <div style={{ borderTop: '1px solid rgba(250,247,240,0.15)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
          <User size={16} />
          <div><div style={{ opacity: 0.7, fontSize: 11 }}>Signed in as</div><strong style={{ opacity: 1, color: 'var(--paper)' }}>{user?.name}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn small secondary" style={{ borderColor: 'rgba(250,247,240,0.3)', color: 'var(--paper)', flex: 1 }} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="btn small secondary" style={{ borderColor: 'rgba(250,247,240,0.3)', color: 'var(--paper)', flex: 1 }} onClick={() => setFontScale(fontScale >= 1.2 ? 0.9 : fontScale + 0.15)}>
            <span style={{ fontWeight: 700 }}>Aa</span>
          </button>
        </div>
        <button className="btn small" style={{ width: '100%', borderColor: 'var(--coral)', color: 'var(--coral)', background: 'transparent' }} onClick={() => { logout(); navigate('/login'); }}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)' }}>
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="mobile-header">
          <button className="btn small secondary" style={{ border: 'none', padding: 8 }} onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} color="var(--ink)" />
          </button>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, marginLeft: 12, color: 'var(--ink)' }}>Campus Coin</span>
        </header>
        <div className="responsive-container" style={{ position: 'relative', minHeight: '80vh' }}>
          <AnimatePresence mode="wait">
            {isNavigating ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Loader text="Loading page..." />
              </motion.div>
            ) : (
              <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}