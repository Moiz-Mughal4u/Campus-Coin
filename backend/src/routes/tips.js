const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { buildInsights } = require('../utils/insights');

const router = express.Router();

async function computeTipsForUser(userId) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [rows] = await pool.query(
    `SELECT t.category_id, c.name, DATE_FORMAT(t.date,'%Y-%m') AS month, SUM(t.amount) AS total
     FROM transactions t JOIN categories c ON c.category_id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY t.category_id, c.name, month`,
    [userId]
  );
  const { tips } = buildInsights(rows, currentMonth);
  return tips;
}

// GET /api/tips -> top personalized saving tips ranked by potential savings
router.get('/', authRequired, async (req, res) => {
  const generated = await computeTipsForUser(req.user.user_id);

  for (const tip of generated.slice(0, 5)) {
    await pool.query(
      `INSERT INTO saved_tips (user_id, tip_text, category_id, potential_savings, status)
       SELECT ?, ?, ?, ?, 'active' FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM saved_tips WHERE user_id = ? AND tip_text = ? AND status <> 'dismissed')`,
      [req.user.user_id, tip.text, tip.category_id, tip.potential_savings, req.user.user_id, tip.text]
    );
  }

  const [saved] = await pool.query(
    `SELECT * FROM saved_tips WHERE user_id = ? AND status <> 'dismissed' ORDER BY status='pinned' DESC, potential_savings DESC LIMIT 10`,
    [req.user.user_id]
  );
  res.json(saved);
});

// PUT /api/tips/:id/pin | dismiss
router.put('/:id/:action(pin|dismiss)', authRequired, async (req, res) => {
  const status = req.params.action === 'pin' ? 'pinned' : 'dismissed';
  const [rows] = await pool.query('SELECT * FROM saved_tips WHERE tip_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Tip not found' });
  await pool.query('UPDATE saved_tips SET status = ? WHERE tip_id = ?', [status, req.params.id]);
  res.json({ message: `Tip ${status}` });
});

module.exports = router;
