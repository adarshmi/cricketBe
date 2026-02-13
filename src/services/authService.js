const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket-umpire-secret-change-in-production';
const SALT_ROUNDS = 10;

async function register(email, password, name) {
  const [existing] = await pool.query('SELECT id FROM user WHERE email = ?', [email]);
  if (existing.length) throw new Error('Email already registered');
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [r] = await pool.query(
    'INSERT INTO user (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [email, password_hash, name || null, 'umpire']
  );
  const user = await getById(r.insertId);
  return { user, token: signToken(user) };
}

async function login(email, password) {
  const [rows] = await pool.query(
    'SELECT id, email, password_hash, name, role FROM user WHERE email = ?',
    [email]
  );
  if (!rows.length) throw new Error('Invalid email or password');
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid email or password');
  const { password_hash, ...safe } = user;
  return { user: safe, token: signToken(safe) };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function getById(id) {
  const [rows] = await pool.query(
    'SELECT id, email, name, role, created_at FROM user WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = { register, login, verifyToken, getById };
