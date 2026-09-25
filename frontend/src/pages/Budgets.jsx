import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, AlertTriangle, Plus, Trash2, Edit2, X } from 'lucide-react';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function Budgets() {
  const { user } = useAuth(); // Get user to check their monthly allowance
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', limit_amount: '' });
  const [alerts, setAlerts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // NEW: State for the Warning Popup
  const [showWarning, setShowWarning] = useState(false);
  const [warningDetails, setWarningDetails] = useState({ total: 0, allowance: 0 });

  function load() { 
    api.get(`/budgets?month=${month}`).then((res) => setBudgets(res.data)); 
    api.get(`/budgets/alerts?month=${month}`).then((res) => setAlerts(res.data)); 
  }
  
  useEffect(() => { api.get('/categories').then((res) => setCategories(res.data.filter((c) => c.type === 'expense'))); }, []);
  useEffect(load, [month]);

  // The actual function that saves to the database
  async function saveBudget() {
    if (editingId) {
      await api.put(`/budgets/${editingId}`, { ...form, month });
    } else {
      await api.post('/budgets', { ...form, month });
    }
    setForm({ category_id: '', limit_amount: '' }); 
    setEditingId(null);
    setShowWarning(false);
    load(); 
  }

  // UPDATED: Intercepts the submit to check the math!
  async function handleSubmit(e) { 
    e.preventDefault(); 
    
    const newLimit = Number(form.limit_amount);
    const allowance = Number(user?.monthly_allowance_baseline) || 0;

    // Calculate what the NEW total budget will be
    const currentTotal = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
    const editingBudget = editingId ? budgets.find(b => b.budget_id === editingId) : null;
    const oldLimit = editingBudget ? Number(editingBudget.limit_amount) : 0;
    
    const projectedTotal = currentTotal - oldLimit + newLimit;

    // LOGIC CHECK: If they have an allowance set, and the new total exceeds it...
    if (allowance > 0 && projectedTotal > allowance) {
      setWarningDetails({ total: projectedTotal, allowance: allowance });
      setShowWarning(true); // Trigger the popup!
      return; // Stop the form from submitting
    }

    // If math is fine, just save it
    await saveBudget();
  }

  async function handleDelete(id) { 
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`); 
    load(); 
  }

  function startEdit(b) {
    setEditingId(b.budget_id);
    setForm({ category_id: b.category_id, limit_amount: b.limit_amount });
  }

  return (
    <div>
      <Breadcrumbs trail={['Dashboard', 'Budgets']} />
      <h1><Target size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Budget goals</h1>
      <p className="help-text" style={{ marginBottom: 20 }}>Set a monthly cap per category and watch it fill up.</p>
      
      <div className="field" style={{ width: 180, marginBottom: 20 }}>
        <label>Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {alerts.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--coral)', marginBottom: 20 }}>
          <div className="tab" style={{ background: 'var(--coral)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Alerts
          </div>
          <ul style={{ marginTop: 14, paddingLeft: 20 }}>
            {alerts.map((a) => (
              <li key={a.category_id} style={{ fontSize: 14, marginBottom: 6 }}>
                <strong>{a.category_name}</strong> at {a.percent_used}% ({Number(a.spent).toFixed(0)} / {Number(a.limit_amount).toFixed(0)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="content-grid">
        <form onSubmit={handleSubmit} className="panel">
          <div className="tab">{editingId ? 'Edit budget' : 'Set a budget'}</div>
          <div className="field" style={{ marginTop: 14 }}>
            <label>Category</label>
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Monthly limit</label>
            <input type="number" min="0" step="0.01" required value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} placeholder="0.00" />
          </div>
          <button className="btn" style={{ width: '100%' }}>
            <Plus size={16} /> {editingId ? 'Update budget' : 'Save budget'}
          </button>
          {editingId && (
            <button type="button" className="btn secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => { setEditingId(null); setForm({ category_id: '', limit_amount: '' }); }}>
              Cancel edit
            </button>
          )}
        </form>

        <div className="panel">
          <div className="tab">This month</div>
          <div style={{ marginTop: 16 }}>
            {budgets.length === 0 && <p className="help-text">No budgets set for {month} yet.</p>}
            {budgets.map((b) => (
              <div key={b.budget_id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{b.category_name}</strong>
                  <span className={`pill ${b.status === 'ok' ? 'mint' : 'coral'}`}>{b.percent_used}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, b.percent_used)}%`, background: b.status === 'ok' ? 'var(--mint)' : 'var(--coral)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                  <span className="help-text">{Number(b.spent).toFixed(2)} of {Number(b.limit_amount).toFixed(2)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn small secondary" onClick={() => startEdit(b)} style={{ padding: '4px 8px' }} title="Edit Budget"><Edit2 size={14} /></button>
                    <button className="btn small danger" onClick={() => handleDelete(b.budget_id)} style={{ padding: '4px 8px' }} title="Delete Budget"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* NEW: BEAUTIFUL WARNING POPUP / MODAL       */}
      {/* ========================================== */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
            }}
            onClick={() => setShowWarning(false)} // Close if clicking outside
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="panel"
              style={{ 
                width: '100%', maxWidth: 420, background: 'var(--paper)', 
                border: '2px solid var(--coral)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative', overflow: 'visible'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Floating Warning Icon */}
              <div style={{ 
                position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--coral)', color: '#fff', width: 48, height: 48, 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '4px solid var(--paper)'
              }}>
                <AlertTriangle size={24} />
              </div>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <h3 style={{ color: 'var(--coral)', marginBottom: 8, fontSize: 20 }}>Hold up! 🛑</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 20 }}>
                  Your total budgets for this month (<strong style={{ color: 'var(--ink)' }}>${warningDetails.total.toFixed(2)}</strong>) 
                  will exceed your monthly allowance (<strong style={{ color: 'var(--ink)' }}>${warningDetails.allowance.toFixed(2)}</strong>).
                </p>
                <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
                  Are you sure you want to over-budget? You can always adjust this later.
                </p>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn secondary" 
                    style={{ flex: 1 }} 
                    onClick={() => setShowWarning(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn danger" 
                    style={{ flex: 1 }} 
                    onClick={saveBudget}
                  >
                    Save Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}