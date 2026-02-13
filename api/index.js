/**
 * Vercel serverless entry: run Express app after DB tables are ready.
 * Socket.io does not work on Vercel; only REST API (and Swagger) work.
 */
let appPromise = null;

function getApp() {
  if (!appPromise) {
    const { pool } = require('../src/config/database');
    const { ensureTables } = require('../src/config/ensureTables');
    appPromise = ensureTables(pool).then(() => require('../src/app'));
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Vercel function error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
