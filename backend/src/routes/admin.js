const express = require('express');
const pool = require('../config/db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [[{ total_users }]] = await pool.query("SELECT COUNT(*) AS total_users FROM users WHERE role='student'");
  const [[{ total_transactions }]] = await pool.query('SELECT COUNT(*) AS total_transactions FROM transactions');
  const [[{ active_users }]] = await pool.query(
    "SELECT COUNT(DISTINCT user_id) AS active_users FROM transactions WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  );
  const [topCategories] = await pool.query(
    `SELECT c.name, COUNT(*) AS uses FROM transactions t JOIN categories c ON c.category_id = t.category_id
     GROUP BY c.name ORDER BY uses DESC LIMIT 5`
  );
  res.json({ total_users, total_transactions, active_users, top_categories: topCategories });
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT user_id, name, email, academic_year, is_disabled, created_at FROM users WHERE role='student' ORDER BY created_at DESC"
  );
  res.json(rows);
});

// PUT /api/admin/users/:id/toggle-disable
router.put('/users/:id/toggle-disable', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  await pool.query('UPDATE users SET is_disabled = NOT is_disabled WHERE user_id = ?', [req.params.id]);
  res.json({ message: 'User status updated' });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  await pool.query("DELETE FROM users WHERE user_id = ? AND role='student'", [req.params.id]);
  res.json({ message: 'User removed' });
});

// Default (global) category management
router.post('/categories', async (req, res) => {
  const { name, type } = req.body;
  const [result] = await pool.query('INSERT INTO categories (user_id, name, type, is_default) VALUES (NULL, ?, ?, TRUE)', [name, type]);
  res.status(201).json({ category_id: result.insertId });
});

router.delete('/categories/:id', async (req, res) => {
  await pool.query('DELETE FROM categories WHERE category_id = ? AND is_default = TRUE', [req.params.id]);
  res.json({ message: 'Default category removed' });
});

// Announcements / tip templates
router.get('/announcements', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/announcements', async (req, res) => {
  const { title, message } = req.body;
  const [result] = await pool.query('INSERT INTO announcements (title, message) VALUES (?, ?)', [title, message]);
  res.status(201).json({ announcement_id: result.insertId });
});

router.delete('/announcements/:id', async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE announcement_id = ?', [req.params.id]);
  res.json({ message: 'Announcement removed' });
});

module.exports = router;
