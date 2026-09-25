import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', academic_year: '', monthly_allowance_baseline: '', monthly_savings_goal: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field) { return (e) => setForm({ ...form, [field]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await api.post('/auth/register', form); login(res.data.token, res.data.user); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 20 }}>
      <form onSubmit={handleSubmit} className="panel" style={{ width: '100%', maxWidth: 440 }}>
        <div className="tab">New account</div>
        <h2 style={{ marginTop: 8, marginBottom: 20 }}>Set up Campus Coin</h2>
        <div className="field"><label>Full name</label><input required value={form.name} onChange={update('name')} /></div>
        <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={update('email')} /></div>
        <div className="field"><label>Password (min 6 chars)</label><input type="password" required minLength={6} value={form.password} onChange={update('password')} /></div>
        <div className="field"><label>Academic year (optional)</label><input value={form.academic_year} onChange={update('academic_year')} placeholder="e.g. Sophomore" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div className="field"><label>Monthly allowance</label><input type="number" min="0" value={form.monthly_allowance_baseline} onChange={update('monthly_allowance_baseline')} /></div>
          <div className="field"><label>Savings goal</label><input type="number" min="0" value={form.monthly_savings_goal} onChange={update('monthly_savings_goal')} /></div>
        </div>
        {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading}><UserPlus size={16} /> {loading ? 'Creating…' : 'Create account'}</button>
        <p style={{ marginTop: 18, fontSize: 13.5 }}>Already have an account? <Link to="/login" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Log in</Link></p>
      </form>
    </div>
  );
}