const path = require('path');
const fs = require('fs');

// Load .env from possible locations (so it works from any cwd)
const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

const mysql = require('mysql2/promise');

const host = process.env.MYSQL_HOST || 'localhost';
const port = Number(process.env.MYSQL_PORT) || 3306;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE || 'cricket_live';

if (!user || password === undefined) {
  throw new Error(
    'MySQL credentials missing. Set MYSQL_USER and MYSQL_PASSWORD in backend/.env (copy from .env.example). ' +
    'Current MYSQL_USER=' + (user || '(empty)')
  );
}

const pool = mysql.createPool({
  host,
  port,
  user,
  password: password || '',
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

module.exports = { pool };
