import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function requestReset(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      // No email server is configured in this project, so the token is
      // returned directly (and logged server-side) purely for local demo purposes.
      if (res.data.dev_reset_token) setToken(res.data.dev_reset_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await api.post('/auth/reset-password', { token, new_password: newPassword });
      setMessage(res.data.message + ' You can now log in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div className="panel" style={{ width: 380 }}>
        <h2>Reset your password</h2>
        <form onSubmit={requestReset} style={{ marginBottom: 22 }}>
          <div className="field">
            <label>Account email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn secondary" type="submit">Send reset link</button>
        </form>

        <form onSubmit={resetPassword}>
          <div className="field">
            <label>Reset token</label>
            <input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the token you received" />
          </div>
          <div className="field">
            <label>New password</label>
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }}>Set new password</button>
        </form>

        {message && <p className="help-text" style={{ marginTop: 12 }}>{message}</p>}
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <p style={{ marginTop: 18, fontSize: 13.5 }}><Link to="/login" style={{ color: 'var(--gold-dark)' }}>Back to login</Link></p>
      </div>
    </div>
  );
}
