import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';

const STUDENT_MAP = [
  { section: 'Account', pages: [['/login', 'Log in'], ['/register', 'Register'], ['/forgot-password', 'Forgot password']] },
  { section: 'Student area', pages: [['/', 'Dashboard'], ['/transactions', 'Transactions'], ['/budgets', 'Budgets'], ['/reports', 'Reports'], ['/categories', 'Categories'], ['/insights', 'Insights & Tips']] },
];
const ADMIN_MAP = [
  { section: 'Admin area', pages: [['/admin', 'Admin overview']] },
];

export default function Sitemap() {
  const { user } = useAuth();
  const map = user?.role === 'admin' ? ADMIN_MAP : STUDENT_MAP;

  return (
    <div>
      <Breadcrumbs trail={[user?.role === 'admin' ? 'Admin Overview' : 'Dashboard', 'Sitemap']} />
      <h1>Sitemap</h1>
      <p className="help-text" style={{ marginBottom: 22 }}>How Campus Coin is organized, so you always know where you are.</p>

      {map.map((group) => (
        <div className="panel" key={group.section} style={{ marginBottom: 16 }}>
          <div className="tab">{group.section}</div>
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {group.pages.map(([path, label]) => (
              <li key={path} style={{ marginBottom: 6 }}>
                <Link to={path} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{label}</Link>
                <span className="help-text"> — {path}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
