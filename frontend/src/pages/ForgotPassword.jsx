import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { KeyRound, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function requestReset(e) {
    e.preventDefault(); setError(''); setMessage('');
    try { const res = await api.post('/auth/forgot-password', { email }); setMessage(res.data.message); if (res.data.dev_reset_token) setToken(res.data.dev_reset_token); }
    catch (err) { setError(err.response?.data?.error || 'Something went wrong'); }
  }
  async function resetPassword(e) {
    e.preventDefault(); setError(''); setMessage('');
    try { const res = await api.post('/auth/reset-password', { token, new_password: newPassword }); setMessage(res.data.message + ' You can now log in.'); }
    catch (err) { setError(err.response?.data?.error || 'Reset failed'); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 20 }}>
      <div className="panel" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KeyRound size={24} color="var(--gold)" /> Reset password</h2>
        <form onSubmit={requestReset} style={{ marginBottom: 24 }}>
          <div className="field"><label><Mail size={14} style={{ display: 'inline', marginRight: 4 }} />Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn secondary" type="submit" style={{ width: '100%' }}>Send reset link</button>
        </form>
        <form onSubmit={resetPassword}>
          <div className="field"><label>Reset token</label><input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" /></div>
          <div className="field"><label>New password</label><input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <button className="btn" type="submit" style={{ width: '100%' }}>Set new password</button>
        </form>
        {message && <p className="help-text" style={{ marginTop: 14, padding: 10, background: 'var(--mint-bg)', borderRadius: 'var(--radius)', color: 'var(--mint)' }}>{message}</p>}
        {error && <p className="error-text" style={{ marginTop: 14, padding: 10, background: 'var(--coral-bg)', borderRadius: 'var(--radius)' }}>{error}</p>}
        <p style={{ marginTop: 20, fontSize: 13.5 }}><Link to="/login" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>← Back to login</Link></p>
      </div>
    </div>
  );
}