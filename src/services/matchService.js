const { pool } = require('../config/database');

async function listMatches(status, createdByUserId) {
  let sql = 'SELECT id, name, team_a_id, team_b_id, venue, match_date, status, created_by_user_id, created_at FROM `match`';
  const params = [];
  const conditions = [];
  if (createdByUserId != null) {
    conditions.push('created_by_user_id = ?');
    params.push(createdByUserId);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY match_date DESC, id DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getMatchById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, team_a_id, team_b_id, venue, match_date, status FROM `match` WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function createMatch(data) {
  const [r] = await pool.query(
    'INSERT INTO `match` (name, team_a_id, team_b_id, venue, match_date, status, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      data.name || 'Match',
      data.team_a_id ?? data.teamAId ?? null,
      data.team_b_id ?? data.teamBId ?? null,
      data.venue || null,
      data.match_date || data.matchDate || null,
      data.status || 'scheduled',
      data.created_by_user_id ?? data.createdByUserId ?? null,
    ]
  );
  return r.insertId;
}

async function updateMatchStatus(id, status) {
  await pool.query('UPDATE `match` SET status = ? WHERE id = ?', [status, id]);
  return getMatchById(id);
}

async function getMatchPlayers(matchId) {
  const [rows] = await pool.query(
    `SELECT mp.id, mp.match_id, mp.player_id, mp.team_side, mp.batting_order, p.name as player_name
     FROM match_player mp JOIN player p ON p.id = mp.player_id
     WHERE mp.match_id = ? ORDER BY mp.team_side, mp.batting_order`,
    [matchId]
  );
  return rows;
}

async function addMatchPlayer(matchId, playerId, teamSide, battingOrder) {
  await pool.query(
    'INSERT INTO match_player (match_id, player_id, team_side, batting_order) VALUES (?, ?, ?, ?)',
    [matchId, playerId, teamSide, battingOrder]
  );
}

module.exports = {
  listMatches,
  getMatchById,
  createMatch,
  updateMatchStatus,
  getMatchPlayers,
  addMatchPlayer,
};
