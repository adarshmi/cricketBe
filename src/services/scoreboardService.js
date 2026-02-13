/**
 * Scoreboard is derived from ball table only.
 * Batting/bowling stats computed from ball-by-ball data.
 */
const { pool } = require('../config/database');

/**
 * Get full scoreboard for current innings of a match.
 * Assumes single innings for simplicity; can extend to multi-innings via innings table.
 */
async function getScoreboard(matchId) {
  const [matchRows] = await pool.query(
    'SELECT id, name, team_a_id, team_b_id, status FROM `match` WHERE id = ?',
    [matchId]
  );
  if (!matchRows.length) return null;
  const match = matchRows[0];

  const [balls] = await pool.query(
    `SELECT id, over_number, ball_in_over, is_legal_delivery, runs_batter, runs_extra, extra_type,
            striker_id, non_striker_id, bowler_id, wicket_type, dismissed_player_id,
            next_striker_id, next_non_striker_id
     FROM ball WHERE match_id = ? ORDER BY id ASC`,
    [matchId]
  );

  let currentStrikerId = null;
  let currentNonStrikerId = null;
  if (balls.length > 0) {
    const last = balls[balls.length - 1];
    currentStrikerId = last.next_striker_id ?? last.striker_id;
    currentNonStrikerId = last.next_non_striker_id ?? last.non_striker_id;
  } else {
    const [mp] = await pool.query(
      `SELECT player_id FROM match_player WHERE match_id = ? AND team_side = 'A' ORDER BY batting_order ASC LIMIT 2`,
      [matchId]
    );
    if (mp.length >= 2) {
      currentStrikerId = mp[0].player_id;
      currentNonStrikerId = mp[1].player_id;
    }
  }

  const [playerRows] = await pool.query(
    'SELECT id, name FROM player WHERE id IN (SELECT DISTINCT player_id FROM match_player WHERE match_id = ?)',
    [matchId]
  );
  const playerMap = Object.fromEntries(playerRows.map((p) => [p.id, p]));

  const batting = {}; // playerId -> { runs, balls, fours, sixes }
  const bowling = {}; // playerId -> { runs, wickets, legalBalls }
  let totalRuns = 0;
  let totalExtras = 0;
  let totalWickets = 0;
  let legalBallsInInnings = 0;

  for (const b of balls) {
    const runsFromBall = (b.runs_batter || 0) + (b.runs_extra || 0);
    totalRuns += runsFromBall;
    totalExtras += b.runs_extra || 0;

    if (b.is_legal_delivery) legalBallsInInnings += 1;

    // Batting: striker gets runs_batter and ball faced only if legal
    if (!batting[b.striker_id]) batting[b.striker_id] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    batting[b.striker_id].runs += b.runs_batter || 0;
    if (b.is_legal_delivery) batting[b.striker_id].balls += 1;
    if (b.runs_batter === 4) batting[b.striker_id].fours += 1;
    if (b.runs_batter === 6) batting[b.striker_id].sixes += 1;

    // Bowling
    if (!bowling[b.bowler_id]) bowling[b.bowler_id] = { runs: 0, wickets: 0, legalBalls: 0 };
    bowling[b.bowler_id].runs += runsFromBall;
    if (b.is_legal_delivery) bowling[b.bowler_id].legalBalls += 1;
    if (b.wicket_type) {
      totalWickets += 1;
      bowling[b.bowler_id].wickets += 1;
    }
  }

  const oversFormatted = formatOvers(legalBallsInInnings);

  const batsmenList = Object.entries(batting).map(([playerId, s]) => {
    const p = playerMap[Number(playerId)];
    const strikeRate = s.balls === 0 ? '0.00' : ((s.runs / s.balls) * 100).toFixed(2);
    return {
      playerId: Number(playerId),
      name: p ? p.name : `Player ${playerId}`,
      runs: s.runs,
      balls: s.balls,
      fours: s.fours,
      sixes: s.sixes,
      strikeRate,
    };
  });

  const bowlersList = Object.entries(bowling).map(([playerId, s]) => {
    const p = playerMap[Number(playerId)];
    return {
      playerId: Number(playerId),
      name: p ? p.name : `Player ${playerId}`,
      overs: formatOvers(s.legalBalls),
      runs: s.runs,
      wickets: s.wickets,
    };
  });

  return {
    matchId: match.id,
    matchName: match.name,
    innings: {
      totalRuns,
      totalWickets,
      totalOvers: oversFormatted,
      extras: totalExtras,
    },
    batsmen: batsmenList,
    bowlers: bowlersList,
    currentStrikerId,
    currentNonStrikerId,
  };
}

function formatOvers(legalBalls) {
  const fullOvers = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;
  return ballsInOver === 0 ? `${fullOvers}.0` : `${fullOvers}.${ballsInOver}`;
}

module.exports = { getScoreboard, formatOvers };
