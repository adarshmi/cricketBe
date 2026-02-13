const authService = require('../services/authService');

function requireUmpire(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  const payload = authService.verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

/** Sets req.user if valid Bearer token present; does not 401 if missing/invalid. */
function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return next();
  const payload = authService.verifyToken(token);
  if (payload) req.user = payload;
  next();
}

module.exports = { requireUmpire, optionalAuth };
