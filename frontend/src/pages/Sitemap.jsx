import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { Map, User, Layout, Shield } from 'lucide-react';

const STUDENT_MAP = [
  { section: 'Account', icon: User, pages: [['/login', 'Log in'], ['/register', 'Register'], ['/forgot-password', 'Forgot password']] },
  { section: 'Student area', icon: Layout, pages: [['/', 'Dashboard'], ['/transactions', 'Transactions'], ['/budgets', 'Budgets'], ['/reports', 'Reports'], ['/categories', 'Categories'], ['/insights', 'Insights & Tips']] },
];
const ADMIN_MAP = [{ section: 'Admin area', icon: Shield, pages: [['/admin', 'Admin overview']] }];

export default function Sitemap() {
  const { user } = useAuth();
  const map = user?.role === 'admin' ? ADMIN_MAP : STUDENT_MAP;

  return (
    <div>
      <Breadcrumbs trail={[user?.role === 'admin' ? 'Admin Overview' : 'Dashboard', 'Sitemap']} />
      <h1><Map size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Sitemap</h1>
      <p className="help-text" style={{ marginBottom: 24 }}>How Campus Coin is organized.</p>
      {map.map((group) => {
        const Icon = group.icon;
        return (
          <div className="panel" key={group.section} style={{ marginBottom: 18 }}>
            <div className="tab" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {group.section}</div>
            <ul style={{ marginTop: 14, paddingLeft: 0, listStyle: 'none' }}>
              {group.pages.map(([path, label]) => (
                <li key={path} style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                  <Link to={path} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{label}</Link>
                  <span className="help-text"> — {path}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}