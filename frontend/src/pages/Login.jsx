import Logo from '../components/Logo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await api.post('/auth/login', { email, password }); login(res.data.token, res.data.user); navigate(res.data.user.role === 'admin' ? '/admin' : '/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 20 }}>
      <form onSubmit={handleSubmit} className="panel" style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ marginBottom: 6 }}><Logo size={44} /></div>  
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" /></div>
        <div className="field"><label>Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
        {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading}><LogIn size={16} /> {loading ? 'Signing in…' : 'Log in'}</button>
        <p style={{ marginTop: 18, fontSize: 13.5 }}>New here? <Link to="/register" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Create account</Link></p>
        <p style={{ marginTop: 8, fontSize: 13.5 }}><Link to="/forgot-password" style={{ color: 'var(--slate)' }}>Forgot password?</Link></p>
      </form>
    </div>
  );
}