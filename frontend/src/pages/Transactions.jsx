import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';
import { Plus, Edit2, Trash2, Upload, Sparkles } from 'lucide-react';

const emptyForm = { category_id: '', amount: '', type: 'expense', description: '', date: new Date().toISOString().slice(0, 10), is_recurring: false };

export default function Transactions() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, type: params.get('add') === 'income' ? 'income' : 'expense' });
  const [suggestion, setSuggestion] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ type: '', category_id: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [importMsg, setImportMsg] = useState('');

  function loadTransactions(f = filters) {
    const q = new URLSearchParams();
    if (f.type) q.set('type', f.type);
    if (f.category_id) q.set('category_id', f.category_id);
    api.get(`/transactions?${q.toString()}`).then((res) => setTransactions(res.data));
  }
  useEffect(() => { api.get('/categories').then((res) => setCategories(res.data)); loadTransactions(); }, []);
  useEffect(() => {
    if (!form.description || form.description.length < 3) { setSuggestion(null); return; }
    const h = setTimeout(() => { api.post('/transactions/suggest-category', { description: form.description }).then((res) => setSuggestion(res.data.suggestion)); }, 400);
    return () => clearTimeout(h);
  }, [form.description]);

  const relevantCategories = categories.filter((c) => c.type === form.type);
  function update(field) { return (e) => setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (!form.category_id) { setError('Please choose a category.'); return; }
    try {
      const payload = { ...form, ai_suggested_category_id: suggestion?.category_id || null };
      if (editingId) await api.put(`/transactions/${editingId}`, payload);
      else await api.post('/transactions', payload);
      setForm({ ...emptyForm, type: form.type }); setSuggestion(null); setEditingId(null); loadTransactions();
    } catch (err) { setError(err.response?.data?.error || 'Could not save'); }
  }
  function startEdit(t) { setEditingId(t.transaction_id); setForm({ category_id: t.category_id, amount: t.amount, type: t.type, description: t.description || '', date: t.date, is_recurring: !!t.is_recurring }); }
  async function handleDelete(id) { if (!confirm('Delete this transaction?')) return; await api.delete(`/transactions/${id}`); loadTransactions(); }
  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const res = await api.post('/transactions/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setImportMsg(`Imported ${res.data.imported_count}, skipped ${res.data.skipped_count}.`); loadTransactions(); }
    catch (err) { setImportMsg(err.response?.data?.error || 'Import failed'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
  function applyFilters(next) { const m = { ...filters, ...next }; setFilters(m); loadTransactions(m); }

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Transactions']} />
      <h1>Transactions</h1>
      <p className="help-text" style={{ marginBottom: 22 }}>Log income and expenses, or import from CSV.</p>

      <div className="content-grid">
        <form onSubmit={handleSubmit} className="panel">
          <div className="tab">{editingId ? 'Edit entry' : 'Quick add'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 14 }}>
            <button type="button" className={`btn small ${form.type === 'expense' ? '' : 'secondary'}`} onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}>Expense</button>
            <button type="button" className={`btn small ${form.type === 'income' ? '' : 'secondary'}`} onClick={() => setForm({ ...form, type: 'income', category_id: '' })}>Income</button>
          </div>
          <div className="field"><label>Amount</label><input type="number" step="0.01" min="0" required value={form.amount} onChange={update('amount')} placeholder="0.00" /></div>
          <div className="field">
            <label>Description</label><input value={form.description} onChange={update('description')} placeholder="e.g. Campus Cafe lunch" />
            {suggestion && <button type="button" className="pill neutral" style={{ marginTop: 8, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setForm({ ...form, category_id: suggestion.category_id })}><Sparkles size={14} color="var(--gold)" /> AI: {suggestion.name}</button>}
          </div>
          <div className="field"><label>Category</label><select required value={form.category_id} onChange={update('category_id')}><option value="">Select…</option>{relevantCategories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Date</label><input type="date" required value={form.date} onChange={update('date')} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 16, cursor: 'pointer' }}><input type="checkbox" checked={form.is_recurring} onChange={update('is_recurring')} /> Recurring</label>
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn" type="submit" style={{ width: '100%' }}><Plus size={16} /> {editingId ? 'Save changes' : 'Add transaction'}</button>
          {editingId && <button type="button" className="btn secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel edit</button>}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 16 }}>
            <label className="help-text" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Upload size={14} /> Import CSV</label>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} style={{ fontSize: 13 }} />
            {importMsg && <p className="help-text" style={{ marginTop: 6, color: 'var(--mint)' }}>{importMsg}</p>}
          </div>
        </form>

        <div className="panel">
          <div className="tab">History</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14, flexWrap: 'wrap' }}>
            <select value={filters.type} onChange={(e) => applyFilters({ type: e.target.value })} style={{ flex: 1, minWidth: 120 }}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
            <select value={filters.category_id} onChange={(e) => applyFilters({ category_id: e.target.value })} style={{ flex: 1, minWidth: 120 }}><option value="">All categories</option>{categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select>
          </div>
          <div className="table-responsive">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.transaction_id}>
                    <td>{t.date}</td><td>{t.category_name}</td><td>{t.description || '—'}</td>
                    <td style={{ color: t.type === 'income' ? 'var(--mint)' : 'var(--coral)', fontWeight: 600 }}>{t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn small secondary" onClick={() => startEdit(t)} style={{ padding: '4px 8px' }}><Edit2 size={14} /></button>{' '}
                      <button className="btn small danger" onClick={() => handleDelete(t.transaction_id)} style={{ padding: '4px 8px' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={5} className="help-text">Nothing logged yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}