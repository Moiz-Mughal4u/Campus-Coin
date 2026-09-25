const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard -> everything the personalized dashboard needs in one call
router.get('/', authRequired, async (req, res) => {
  const month = new Date().toISOString().slice(0, 7);

  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expense
     FROM transactions WHERE user_id = ? AND DATE_FORMAT(date,'%Y-%m') = ?`,
    [req.user.user_id, month]
  );

  const [topCategory] = await pool.query(
    `SELECT c.name, SUM(t.amount) AS total FROM transactions t JOIN categories c ON c.category_id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND DATE_FORMAT(t.date,'%Y-%m') = ?
     GROUP BY c.name ORDER BY total DESC LIMIT 1`,
    [req.user.user_id, month]
  );

  const [budgetVsActual] = await pool.query(
    `SELECT c.name AS category, b.limit_amount,
            COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.user_id = b.user_id AND t.category_id = b.category_id
                      AND t.type='expense' AND DATE_FORMAT(t.date,'%Y-%m') = b.month), 0) AS actual
     FROM budgets b JOIN categories c ON c.category_id = b.category_id
     WHERE b.user_id = ? AND b.month = ?`,
    [req.user.user_id, month]
  );

  const [recent] = await pool.query(
    `SELECT t.*, c.name AS category_name FROM transactions t JOIN categories c ON c.category_id = t.category_id
     WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 5`,
    [req.user.user_id]
  );

  res.json({
    month,
    balance: Number(totals.income) - Number(totals.expense),
    income: Number(totals.income),
    expense: Number(totals.expense),
    top_category: topCategory[0] || null,
    budget_vs_actual: budgetVsActual,
    recent_transactions: recent,
  });
});

module.exports = router;
