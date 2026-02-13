const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await authService.register(email.trim(), password, name?.trim());
    res.status(201).json(result);
  } catch (e) {
    if (e.message === 'Email already registered') return res.status(400).json({ error: e.message });
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await authService.login(email.trim(), password);
    res.json(result);
  } catch (e) {
    if (e.message === 'Invalid email or password') return res.status(401).json({ error: e.message });
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, me };
