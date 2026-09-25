const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets?month=YYYY-MM -> budgets with real-time consumption
router.get('/', authRequired, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const [budgets] = await pool.query(
    `SELECT b.*, c.name AS category_name FROM budgets b
     JOIN categories c ON c.category_id = b.category_id
     WHERE b.user_id = ? AND b.month = ?`,
    [req.user.user_id, month]
  );

  const [spent] = await pool.query(
    `SELECT category_id, COALESCE(SUM(amount),0) AS spent FROM transactions
     WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?
     GROUP BY category_id`,
    [req.user.user_id, month]
  );
  const spentMap = Object.fromEntries(spent.map((s) => [s.category_id, Number(s.spent)]));

  const result = budgets.map((b) => {
    const spentAmt = spentMap[b.category_id] || 0;
    const pct = b.limit_amount > 0 ? Math.round((spentAmt / b.limit_amount) * 100) : 0;
    return {
      ...b,
      spent: spentAmt,
      percent_used: pct,
      status: pct >= 100 ? 'exceeded' : pct >= 80 ? 'near_limit' : 'ok',
    };
  });

  res.json(result);
});

// POST /api/budgets
router.post('/', authRequired, async (req, res) => {
  const { category_id, month, limit_amount } = req.body;
  if (!category_id || !month || !limit_amount) return res.status(400).json({ error: 'category_id, month and limit_amount are required' });

  await pool.query(
    `INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)`,
    [req.user.user_id, category_id, month, limit_amount]
  );
  res.status(201).json({ message: 'Budget saved' });
});

// ==========================================
// NEW: PUT /api/budgets/:id -> Edit a budget
// ==========================================
router.put('/:id', authRequired, async (req, res) => {
  const { category_id, month, limit_amount } = req.body;
  if (!category_id || !month || !limit_amount) {
    return res.status(400).json({ error: 'category_id, month and limit_amount are required' });
  }

  // 1. Verify the budget belongs to the logged-in user
  const [rows] = await pool.query(
    'SELECT * FROM budgets WHERE budget_id = ? AND user_id = ?',
    [req.params.id, req.user.user_id]
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Budget not found or unauthorized' });
  }

  // 2. Update the budget in the database
  await pool.query(
    'UPDATE budgets SET category_id = ?, month = ?, limit_amount = ? WHERE budget_id = ?',
    [category_id, month, limit_amount, req.params.id]
  );

  res.json({ message: 'Budget updated successfully' });
});

// DELETE /api/budgets/:id
router.delete('/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM budgets WHERE budget_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Budget not found' });
  await pool.query('DELETE FROM budgets WHERE budget_id = ?', [req.params.id]);
  res.json({ message: 'Budget deleted' });
});

// GET /api/budgets/alerts?month=YYYY-MM -> categories near or over budget (for in-app notifications)
router.get('/alerts', authRequired, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [rows] = await pool.query(
    `SELECT b.category_id, c.name AS category_name, b.limit_amount,
            COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.user_id = b.user_id AND t.category_id = b.category_id
                      AND t.type='expense' AND DATE_FORMAT(t.date,'%Y-%m') = b.month), 0) AS spent
     FROM budgets b JOIN categories c ON c.category_id = b.category_id
     WHERE b.user_id = ? AND b.month = ?`,
    [req.user.user_id, month]
  );
  const alerts = rows
    .map((r) => ({ ...r, percent_used: r.limit_amount > 0 ? Math.round((r.spent / r.limit_amount) * 100) : 0 }))
    .filter((r) => r.percent_used >= 80);
  res.json(alerts);
});

module.exports = router;