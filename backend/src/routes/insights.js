const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { buildInsights } = require('../utils/insights');

const router = express.Router();

// GET /api/insights?month=YYYY-MM -> generates (if needed) and returns the monthly AI-style insight
router.get('/', authRequired, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const [existing] = await pool.query('SELECT * FROM insights WHERE user_id = ? AND month = ?', [req.user.user_id, month]);
  if (existing.length) return res.json(existing[0]);

  const [rows] = await pool.query(
    `SELECT t.category_id AS category_id, c.name AS name, DATE_FORMAT(t.date,'%Y-%m') AS month, SUM(t.amount) AS total
     FROM transactions t JOIN categories c ON c.category_id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= DATE_SUB(?, INTERVAL 6 MONTH)
     GROUP BY t.category_id, c.name, month`,
    [req.user.user_id, `${month}-01`]
  );

  const { narrative, tips } = buildInsights(rows, month);
  const tipText = tips[0]?.text || 'No notable spending changes this month — nice and steady!';

  const [result] = await pool.query(
    'INSERT INTO insights (user_id, month, summary_text, tip_text) VALUES (?, ?, ?, ?)',
    [req.user.user_id, month, narrative, tipText]
  );
  res.json({ insight_id: result.insertId, user_id: req.user.user_id, month, summary_text: narrative, tip_text: tipText, is_bookmarked: false });
});

// GET /api/insights/history -> all past months' summaries
router.get('/history', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM insights WHERE user_id = ? ORDER BY month DESC', [req.user.user_id]);
  res.json(rows);
});

// PUT /api/insights/:id/bookmark
router.put('/:id/bookmark', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM insights WHERE insight_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Insight not found' });
  const newVal = !rows[0].is_bookmarked;
  await pool.query('UPDATE insights SET is_bookmarked = ? WHERE insight_id = ?', [newVal, req.params.id]);
  res.json({ is_bookmarked: newVal });
});

module.exports = router;
