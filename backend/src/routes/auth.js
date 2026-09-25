const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register  (students only; admin accounts are seeded directly in DB)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, academic_year, monthly_allowance_baseline, monthly_savings_goal } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, academic_year, monthly_allowance_baseline, monthly_savings_goal)
       VALUES (?, ?, ?, 'student', ?, ?, ?)`,
      [name, email, hash, academic_year || null, monthly_allowance_baseline || 0, monthly_savings_goal || 0]
    );

    const user = { user_id: result.insertId, role: 'student', name, email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login  (works for both students and the admin account)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    if (user.is_disabled) return res.status(403).json({ error: 'This account has been disabled by an administrator' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      token: signToken(user),
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        academic_year: user.academic_year,
        monthly_allowance_baseline: user.monthly_allowance_baseline,
        monthly_savings_goal: user.monthly_savings_goal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT user_id, name, email, role, academic_year, monthly_allowance_baseline, monthly_savings_goal FROM users WHERE user_id = ?',
    [req.user.user_id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// PUT /api/auth/profile
router.put('/profile', authRequired, async (req, res) => {
  const { name, academic_year, monthly_allowance_baseline, monthly_savings_goal } = req.body;
  await pool.query(
    `UPDATE users SET name = COALESCE(?, name), academic_year = ?, monthly_allowance_baseline = ?, monthly_savings_goal = ?
     WHERE user_id = ?`,
    [name, academic_year, monthly_allowance_baseline, monthly_savings_goal, req.user.user_id]
  );
  res.json({ message: 'Profile updated' });
});

// POST /api/auth/forgot-password
// Generates a reset token. In production this token would be emailed to the
// student; here (no email server configured) it is returned in the response
// and logged to the console so the flow can be demoed end-to-end.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const [rows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (!rows.length) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?', [token, expires, rows[0].user_id]);

  console.log(`[Campus Coin] Password reset token for ${email}: ${token}`);
  res.json({ message: 'If that email exists, a reset link has been sent.', dev_reset_token: token });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });

  const [rows] = await pool.query('SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
  if (!rows.length) return res.status(400).json({ error: 'Reset token is invalid or has expired' });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?', [hash, rows[0].user_id]);
  res.json({ message: 'Password has been reset. You can now log in.' });
});

module.exports = router;
