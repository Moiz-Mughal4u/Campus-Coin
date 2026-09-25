const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { suggestCategory } = require('../utils/aiCategorize');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/transactions?from=&to=&category_id=&type=
router.get('/', authRequired, async (req, res) => {
  const { from, to, category_id, type } = req.query;
  let sql = `SELECT t.*, c.name AS category_name FROM transactions t
             JOIN categories c ON c.category_id = t.category_id
             WHERE t.user_id = ?`;
  const params = [req.user.user_id];

  if (from) { sql += ' AND t.date >= ?'; params.push(from); }
  if (to) { sql += ' AND t.date <= ?'; params.push(to); }
  if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
  if (type) { sql += ' AND t.type = ?'; params.push(type); }
  sql += ' ORDER BY t.date DESC, t.transaction_id DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// POST /api/transactions/suggest-category  (AI-assist while typing, before saving)
router.post('/suggest-category', authRequired, async (req, res) => {
  const { description } = req.body;
  const [categories] = await pool.query('SELECT * FROM categories WHERE is_default = TRUE OR user_id = ?', [req.user.user_id]);
  const [past] = await pool.query(
    'SELECT description, category_id FROM transactions WHERE user_id = ? AND description IS NOT NULL ORDER BY transaction_id DESC LIMIT 100',
    [req.user.user_id]
  );
  const suggestion = suggestCategory(description, categories, past);
  res.json({ suggestion });
});

// POST /api/transactions
router.post('/', authRequired, async (req, res) => {
  const { category_id, amount, type, description, date, is_recurring, ai_suggested_category_id } = req.body;
  if (!category_id || !amount || !type || !date) return res.status(400).json({ error: 'category_id, amount, type and date are required' });

  const [result] = await pool.query(
    `INSERT INTO transactions (user_id, category_id, amount, type, description, ai_suggested_category_id, is_recurring, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.user_id, category_id, amount, type, description || null, ai_suggested_category_id || null, !!is_recurring, date]
  );
  res.status(201).json({ transaction_id: result.insertId });
});

// PUT /api/transactions/:id
router.put('/:id', authRequired, async (req, res) => {
  const { category_id, amount, type, description, date, is_recurring } = req.body;
  const [rows] = await pool.query('SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Transaction not found' });

  await pool.query(
    `UPDATE transactions SET category_id = ?, amount = ?, type = ?, description = ?, is_recurring = ?, date = ?
     WHERE transaction_id = ?`,
    [category_id, amount, type, description || null, !!is_recurring, date, req.params.id]
  );
  res.json({ message: 'Transaction updated' });
});

// DELETE /api/transactions/:id  (soft history is preserved via created_at trail; this removes the live record)
router.delete('/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Transaction not found' });
  await pool.query('DELETE FROM transactions WHERE transaction_id = ?', [req.params.id]);
  res.json({ message: 'Transaction deleted' });
});

// POST /api/transactions/import-csv  (multipart/form-data, field name "file")
// Expected CSV columns: date,type,category,amount,description
router.post('/import-csv', authRequired, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name "file")' });

  let records;
  try {
    records = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return res.status(400).json({ error: 'Could not parse CSV file: ' + e.message });
  }

  const [categories] = await pool.query('SELECT * FROM categories WHERE is_default = TRUE OR user_id = ?', [req.user.user_id]);
  const [past] = await pool.query('SELECT description, category_id FROM transactions WHERE user_id = ?', [req.user.user_id]);

  const imported = [];
  const skipped = [];

  for (const row of records) {
    const type = (row.type || '').toLowerCase();
    const amount = parseFloat(row.amount);
    if (!row.date || !amount || !['income', 'expense'].includes(type)) {
      skipped.push({ row, reason: 'missing/invalid date, amount or type' });
      continue;
    }

    let category = categories.find((c) => c.name.toLowerCase() === (row.category || '').toLowerCase() && c.type === type);
    let ai_suggested_category_id = null;
    if (!category) {
      const suggestion = suggestCategory(row.description, categories.filter((c) => c.type === type), past);
      if (suggestion) { category = categories.find((c) => c.category_id === suggestion.category_id); ai_suggested_category_id = suggestion.category_id; }
    }
    if (!category) {
      category = categories.find((c) => c.name === 'Miscellaneous' && c.type === 'expense') || categories.find((c) => c.type === type);
    }

    await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, ai_suggested_category_id, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, category.category_id, amount, type, row.description || null, ai_suggested_category_id, row.date]
    );
    imported.push(row);
  }

  res.json({ imported_count: imported.length, skipped_count: skipped.length, skipped });
});

module.exports = router;
