import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', limit_amount: '' });
  const [alerts, setAlerts] = useState([]);

  function load() {
    api.get(`/budgets?month=${month}`).then((res) => setBudgets(res.data));
    api.get(`/budgets/alerts?month=${month}`).then((res) => setAlerts(res.data));
  }

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.filter((c) => c.type === 'expense')));
  }, []);

  useEffect(load, [month]);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post('/budgets', { ...form, month });
    setForm({ category_id: '', limit_amount: '' });
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/budgets/${id}`);
    load();
  }

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Budgets']} />
      <h1>Budget goals</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>Set a monthly cap per category and watch it fill up in real time.</p>

      <div className="field" style={{ width: 180, marginBottom: 20 }}>
        <label>Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {alerts.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--coral)', marginBottom: 20 }}>
          <div className="tab" style={{ background: 'var(--coral)', color: '#fff' }}>Alerts</div>
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {alerts.map((a) => (
              <li key={a.category_id} style={{ fontSize: 14 }}>
                {a.category_name} is at {a.percent_used}% of its budget ({Number(a.spent).toFixed(0)} / {Number(a.limit_amount).toFixed(0)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} className="panel" style={{ width: 300 }}>
          <div className="tab">Set a budget</div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Category</label>
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Monthly limit</label>
            <input type="number" min="0" step="0.01" required value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} />
          </div>
          <button className="btn" style={{ width: '100%' }}>Save budget</button>
        </form>

        <div className="panel" style={{ flex: '1 1 400px' }}>
          <div className="tab">This month</div>
          <div style={{ marginTop: 14 }}>
            {budgets.length === 0 && <p className="help-text">No budgets set for {month} yet.</p>}
            {budgets.map((b) => (
              <div key={b.budget_id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{b.category_name}</strong>
                  <span className={`pill ${b.status === 'exceeded' ? 'coral' : b.status === 'near_limit' ? 'coral' : 'mint'}`}>
                    {b.percent_used}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, b.percent_used)}%`, background: b.status === 'ok' ? 'var(--mint)' : 'var(--coral)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="help-text">{Number(b.spent).toFixed(2)} of {Number(b.limit_amount).toFixed(2)}</span>
                  <button className="btn small danger" onClick={() => handleDelete(b.budget_id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
