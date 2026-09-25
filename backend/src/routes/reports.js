const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/category-wise?month=YYYY-MM
router.get('/category-wise', authRequired, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [rows] = await pool.query(
    `SELECT c.category_id, c.name, t.type, COALESCE(SUM(t.amount),0) AS total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.category_id AND t.user_id = ? AND DATE_FORMAT(t.date,'%Y-%m') = ?
     WHERE c.is_default = TRUE OR c.user_id = ?
     GROUP BY c.category_id, t.type
     HAVING total > 0
     ORDER BY total DESC`,
    [req.user.user_id, month, req.user.user_id]
  );
  res.json({ month, breakdown: rows });
});

// GET /api/reports/income-vs-expense  -> last 6 months
router.get('/income-vs-expense', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(date, '%Y-%m') AS month,
            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month ASC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// GET /api/reports/summary?range=daily|weekly&month=YYYY-MM
router.get('/summary', authRequired, async (req, res) => {
  const range = req.query.range === 'weekly' ? 'weekly' : 'daily';
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const groupExpr = range === 'weekly' ? "YEARWEEK(date, 3)" : "date";
  const labelExpr = range === 'weekly' ? "CONCAT('Week of ', DATE_SUB(date, INTERVAL WEEKDAY(date) DAY))" : "date";

  const [rows] = await pool.query(
    `SELECT MIN(${labelExpr}) AS label,
            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = ? AND DATE_FORMAT(date,'%Y-%m') = ?
     GROUP BY ${groupExpr} ORDER BY MIN(date) ASC`,
    [req.user.user_id, month]
  );
  res.json({ range, month, rows });
});

// GET /api/reports/export.pdf?month=YYYY-MM  -> downloadable PDF of the monthly report
router.get('/export.pdf', authRequired, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [breakdown] = await pool.query(
    `SELECT c.name, t.type, COALESCE(SUM(t.amount),0) AS total
     FROM transactions t JOIN categories c ON c.category_id = t.category_id
     WHERE t.user_id = ? AND DATE_FORMAT(t.date,'%Y-%m') = ?
     GROUP BY c.name, t.type ORDER BY total DESC`,
    [req.user.user_id, month]
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="campus-coin-report-${month}.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text('Campus Coin — Monthly Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Student: ${req.user.name}`);
  doc.text(`Month: ${month}`);
  doc.moveDown();

  let income = 0, expense = 0;
  doc.fontSize(14).text('Category Breakdown');
  doc.moveDown(0.5);
  breakdown.forEach((row) => {
    if (row.type === 'income') income += Number(row.total); else expense += Number(row.total);
    doc.fontSize(11).text(`${row.type === 'income' ? '[Income] ' : '[Expense] '}${row.name}: ${Number(row.total).toFixed(2)}`);
  });

  doc.moveDown();
  doc.fontSize(13).text(`Total Income: ${income.toFixed(2)}`);
  doc.text(`Total Expense: ${expense.toFixed(2)}`);
  doc.text(`Net Balance: ${(income - expense).toFixed(2)}`);
  doc.end();
});

module.exports = router;
