import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Target, Plus, ArrowRight } from 'lucide-react';

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

  if (loading) return <div className="page-loader"><div className="coin-spinner"></div><div className="loader-text">Loading dashboard...</div></div>;

  return (
    <div>
      <Breadcrumbs trail={['Dashboard']} />
      <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="help-text" style={{ marginBottom: 24 }}>Here's where your money stood this {data.month}.</p>

      <div className="stats-grid">
        <div className="panel"><div className="tab">This month</div><div className="help-text" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={14} /> Balance</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: data.balance >= 0 ? 'var(--mint)' : 'var(--coral)' }}>{data.balance.toFixed(2)}</div></div>
        <div className="panel"><div className="help-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} color="var(--mint)" /> Income</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--mint)' }}>+{data.income.toFixed(2)}</div></div>
        <div className="panel"><div className="help-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingDown size={14} color="var(--coral)" /> Expense</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--coral)' }}>-{data.expense.toFixed(2)}</div></div>
        <div className="panel"><div className="help-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={14} /> Top category</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>{data.top_category ? data.top_category.name : '—'}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to="/transactions?add=income" className="btn"><Plus size={16} /> Add income</Link>
        <Link to="/transactions?add=expense" className="btn secondary"><Plus size={16} /> Add expense</Link>
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="tab">Budget vs actual</div>
          <div style={{ marginTop: 14 }}>
            {data.budget_vs_actual.length === 0 && <p className="help-text">No budgets set. <Link to="/budgets" style={{ color: 'var(--gold-dark)' }}>Set one up</Link>.</p>}
            {data.budget_vs_actual.map((b) => {
              const pct = b.limit_amount > 0 ? Math.min(100, Math.round((b.actual / b.limit_amount) * 100)) : 0;
              const over = Number(b.actual) > Number(b.limit_amount);
              return (
                <div key={b.category} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{b.category}</span>
                    <span style={{ color: over ? 'var(--coral)' : 'var(--ink-soft)' }}>{Number(b.actual).toFixed(0)} / {Number(b.limit_amount).toFixed(0)}</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: over ? 'var(--coral)' : 'var(--gold)' }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="tab">💡 Top tips</div>
          <div style={{ marginTop: 14 }}>
            {tips.length === 0 && <p className="help-text">No tips yet.</p>}
            {tips.map((t) => (<div key={t.tip_id} style={{ marginBottom: 14, fontSize: 13.5, padding: 12, background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>{t.tip_text}</div>))}
            <Link to="/insights" style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>View all insights <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <div className="tab">Recent activity</div>
        <div className="table-responsive" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {data.recent_transactions.map((t) => (
                <tr key={t.transaction_id}>
                  <td>{t.date}</td><td>{t.category_name}</td><td>{t.description || '—'}</td>
                  <td style={{ color: t.type === 'income' ? 'var(--mint)' : 'var(--coral)', fontWeight: 600 }}>{t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)}</td>
                </tr>
              ))}
              {data.recent_transactions.length === 0 && <tr><td colSpan={4} className="help-text">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}