const { pool } = require('../config/database');

async function list(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name FROM player ORDER BY name');
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const [r] = await pool.query('INSERT INTO player (name) VALUES (?)', [req.body.name]);
    const [rows] = await pool.query('SELECT id, name FROM player WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name FROM player WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Player not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, getById };
