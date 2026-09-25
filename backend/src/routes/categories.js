const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories -> default/global categories + this user's own categories
router.get('/', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE is_default = TRUE OR user_id = ? ORDER BY type, name',
    [req.user.user_id]
  );
  res.json(rows);
});

// POST /api/categories -> create a personal category ("Manage Own Categories")
router.post('/', authRequired, async (req, res) => {
  const { name, type } = req.body;
  if (!name || !['income', 'expense'].includes(type)) return res.status(400).json({ error: 'name and a valid type (income/expense) are required' });
  const [result] = await pool.query(
    'INSERT INTO categories (user_id, name, type, is_default) VALUES (?, ?, ?, FALSE)',
    [req.user.user_id, name, type]
  );
  res.status(201).json({ category_id: result.insertId, name, type, is_default: false });
});

// PUT /api/categories/:id -> edit a personal category (defaults are read-only for students)
router.put('/:id', authRequired, async (req, res) => {
  const { name } = req.body;
  const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Category not found or not editable' });
  await pool.query('UPDATE categories SET name = ? WHERE category_id = ?', [name, req.params.id]);
  res.json({ message: 'Category updated' });
});

// DELETE /api/categories/:id
router.delete('/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  if (!rows.length) return res.status(404).json({ error: 'Category not found or not deletable' });
  await pool.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
