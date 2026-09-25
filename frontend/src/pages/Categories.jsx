import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [error, setError] = useState('');

  function load() {
    api.get('/categories').then((res) => setCategories(res.data));
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', form);
      setForm({ name: '', type: 'expense' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create category');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Existing transactions will keep it for their history.')) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete category');
    }
  }

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Categories']} />
      <h1>Categories</h1>
      <p className="help-text" style={{ marginBottom: 22 }}>Default categories are shared by every student. Add your own under "Manage Own Categories".</p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} className="panel" style={{ width: 300 }}>
          <div className="tab">Manage own categories</div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gym membership" />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" style={{ width: '100%' }}>Add category</button>
        </form>

        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="tab">Income</div>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {income.map((c) => (
                <li key={c.category_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{c.name}</span>
                  {c.is_default ? <span className="pill neutral">default</span> : <button className="btn small danger" onClick={() => handleDelete(c.category_id)}>Delete</button>}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <div className="tab">Expense</div>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {expense.map((c) => (
                <li key={c.category_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{c.name}</span>
                  {c.is_default ? <span className="pill neutral">default</span> : <button className="btn small danger" onClick={() => handleDelete(c.category_id)}>Delete</button>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
