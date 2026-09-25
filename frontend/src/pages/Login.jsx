import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <form onSubmit={handleSubmit} className="panel" style={{ width: 360 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🪙 Campus Coin</div>
        <p className="help-text" style={{ marginBottom: 20 }}>Track your allowance, spending and savings.</p>

        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

        <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </button>

        <p style={{ marginTop: 16, fontSize: 13.5 }}>
          New here? <Link to="/register" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Create a student account</Link>
        </p>
        <p style={{ marginTop: 6, fontSize: 13.5 }}>
          <Link to="/forgot-password" style={{ color: 'var(--slate)' }}>Forgot password?</Link>
        </p>
        <p className="help-text" style={{ marginTop: 18, fontSize: 12 }}>
          Admin demo login: admin@campuscoin.app / Admin@123
        </p>
      </form>
    </div>
  );
}
