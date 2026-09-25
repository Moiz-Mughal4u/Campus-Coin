import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/tips')])
      .then(([d, t]) => { setData(d.data); setTips(t.data.slice(0, 3)); })
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div>Loading dashboard…</div>;

  return (
    <div>
      <Breadcrumbs trail={['Dashboard']} />
      <h1>{greeting}, {user?.name?.split(' ')[0]}</h1>
      <p className="help-text" style={{ marginBottom: 24 }}>Here's where your money stood this {data.month}.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="panel" style={{ flex: '1 1 200px' }}>
          <div className="tab">This month</div>
          <div className="help-text" style={{ marginTop: 8 }}>Balance</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: data.balance >= 0 ? 'var(--mint)' : 'var(--coral)' }}>
            {data.balance.toFixed(2)}
          </div>
        </div>
        <div className="panel" style={{ flex: '1 1 200px' }}>
          <div className="help-text">Income</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>{data.income.toFixed(2)}</div>
        </div>
        <div className="panel" style={{ flex: '1 1 200px' }}>
          <div className="help-text">Expense</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>{data.expense.toFixed(2)}</div>
        </div>
        <div className="panel" style={{ flex: '1 1 200px' }}>
          <div className="help-text">Top category</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>
            {data.top_category ? data.top_category.name : '—'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <Link to="/transactions?add=income" className="btn">+ Add income</Link>
        <Link to="/transactions?add=expense" className="btn secondary">+ Add expense</Link>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="panel" style={{ flex: '2 1 380px' }}>
          <div className="tab">Budget vs actual</div>
          <div style={{ marginTop: 10 }}>
            {data.budget_vs_actual.length === 0 && <p className="help-text">No budgets set for this month yet. <Link to="/budgets" style={{ color: 'var(--gold-dark)' }}>Set one up</Link>.</p>}
            {data.budget_vs_actual.map((b) => {
              const pct = b.limit_amount > 0 ? Math.min(100, Math.round((b.actual / b.limit_amount) * 100)) : 0;
              const over = Number(b.actual) > Number(b.limit_amount);
              return (
                <div key={b.category} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
                    <span>{b.category}</span>
                    <span>{Number(b.actual).toFixed(0)} / {Number(b.limit_amount).toFixed(0)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: over ? 'var(--coral)' : 'var(--gold)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel" style={{ flex: '1 1 260px' }}>
          <div className="tab">Top tips</div>
          <div style={{ marginTop: 10 }}>
            {tips.length === 0 && <p className="help-text">No tips yet — add a few transactions and check back.</p>}
            {tips.map((t) => (
              <div key={t.tip_id} style={{ marginBottom: 12, fontSize: 13.5, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                {t.tip_text}
              </div>
            ))}
            <Link to="/insights" style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 600 }}>View all insights →</Link>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="tab">Recent activity</div>
        <table style={{ marginTop: 10 }}>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            {data.recent_transactions.map((t) => (
              <tr key={t.transaction_id}>
                <td>{t.date}</td>
                <td>{t.category_name}</td>
                <td>{t.description || '—'}</td>
                <td style={{ color: t.type === 'income' ? 'var(--mint)' : 'var(--coral)' }}>
                  {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)}
                </td>
              </tr>
            ))}
            {data.recent_transactions.length === 0 && <tr><td colSpan={4} className="help-text">No transactions logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
