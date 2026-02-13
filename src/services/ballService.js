/**
 * Ball service: add ball and undo last ball.
 * Cricket rules:
 * - Runs and strike rotation: odd runs (1,3,5) or end of over → swap striker/non-striker. Otherwise automatic.
 * - Manual striker update by umpire ONLY in two cases: (1) Wicket – who is new striker (2) Retired hurt – next striker & non-striker.
 * - Wides/no-balls: not legal delivery; strike may still rotate on runs.
 */
const { pool } = require('../config/database');
const { getScoreboard } = require('./scoreboardService');

const LEGAL_BALLS_PER_OVER = 6;
const WIDE = 'wide';
const NO_BALL = 'no_ball';
const RETIRED_HURT = 'retired_hurt';

/**
 * Get current innings state for the NEXT ball (striker/non-striker from last ball's "next" state).
 */
async function getLastBallState(matchId) {
  const [rows] = await pool.query(
    `SELECT over_number, ball_in_over, is_legal_delivery, striker_id, non_striker_id, bowler_id,
            next_striker_id, next_non_striker_id
     FROM ball WHERE match_id = ? ORDER BY id DESC LIMIT 1`,
    [matchId]
  );
  if (!rows.length) {
    const [matchPlayers] = await pool.query(
      `SELECT player_id, batting_order FROM match_player WHERE match_id = ? AND team_side = 'A' ORDER BY batting_order ASC LIMIT 2`,
      [matchId]
    );
    const [bowlers] = await pool.query(
      `SELECT player_id FROM match_player WHERE match_id = ? AND team_side = 'B' ORDER BY batting_order ASC LIMIT 1`,
      [matchId]
    );
    return {
      overNumber: 0,
      ballInOver: 0,
      legalBallsInOver: 0,
      strikerId: matchPlayers[0]?.player_id ?? null,
      nonStrikerId: matchPlayers[1]?.player_id ?? null,
      bowlerId: bowlers[0]?.player_id ?? null,
    };
  }
  const b = rows[0];
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM ball WHERE match_id = ? AND id <= ? AND is_legal_delivery = 1`,
    [matchId, rows[0].id]
  );
  const totalLegalSoFar = countRows[0].c;
  const overNumber = Math.floor(totalLegalSoFar / LEGAL_BALLS_PER_OVER);
  const ballInOver = totalLegalSoFar % LEGAL_BALLS_PER_OVER;

  let strikerId = b.next_striker_id;
  let nonStrikerId = b.next_non_striker_id;
  if (strikerId == null || nonStrikerId == null) {
    strikerId = strikerId ?? b.striker_id;
    nonStrikerId = nonStrikerId ?? b.non_striker_id;
  }
  return {
    overNumber,
    ballInOver,
    legalBallsInOver: ballInOver,
    strikerId,
    nonStrikerId,
    bowlerId: b.bowler_id,
  };
}

/**
 * Compute next striker/non-striker by cricket rules: odd runs or end of over → swap.
 * Does NOT apply wicket/retired hurt; caller handles those (umpire can override).
 */
function nextStateByRules(current, payload) {
  const extraType = (payload.extraType || '').toLowerCase();
  const isWideOrNoBall = extraType === WIDE || extraType === NO_BALL;
  const isLegal = !isWideOrNoBall && extraType !== RETIRED_HURT;
  const runsBatter = Math.min(6, Math.max(0, payload.runsBatter || 0));
  const runsExtra = Math.max(0, payload.runsExtra || 0);
  const totalRun = runsBatter + runsExtra;
  const oddRuns = totalRun % 2 === 1;

  let nextLegalInOver = current.legalBallsInOver;
  let nextOverNumber = current.overNumber;
  if (isLegal) {
    nextLegalInOver += 1;
    if (nextLegalInOver >= LEGAL_BALLS_PER_OVER) {
      nextLegalInOver = 0;
      nextOverNumber += 1;
    }
  }

  let strikerId = current.strikerId;
  let nonStrikerId = current.nonStrikerId;
  const endOfOver = isLegal && nextLegalInOver === 0;
  // Odd runs (1,3,5): batsmen cross → swap once.
  // End of over: batsmen cross to opposite ends → swap again.
  // So last ball even (0,2,4,6): swap once → non-striker becomes striker for new over.
  // Last ball odd (1,3,5): swap for run, then swap for end of over → same striker for new over.
  if (oddRuns) [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  if (endOfOver) [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  return {
    overNumber: nextOverNumber,
    ballInOver: isLegal ? nextLegalInOver : current.ballInOver,
    isLegalDelivery: isLegal ? 1 : 0,
    strikerId,
    nonStrikerId,
  };
}

async function getNextBatsman(matchId, teamSide, excludeIds) {
  const [rows] = await pool.query(
    `SELECT player_id FROM match_player WHERE match_id = ? AND team_side = ? ORDER BY batting_order ASC`,
    [matchId, teamSide]
  );
  const excluded = new Set(excludeIds || []);
  for (const r of rows) {
    if (!excluded.has(r.player_id)) return r.player_id;
  }
  return null;
}

/**
 * Add one ball. Returns { ball, scoreboard }.
 * Strike rotation by cricket rules; umpire can set nextStrikerId/nextNonStrikerId only for wicket or retired hurt.
 */
async function addBall(matchId, payload) {
  const current = await getLastBallState(matchId);
  if (!current.strikerId || !current.nonStrikerId || !current.bowlerId) {
    throw new Error('Match lineup not set: striker, non-striker and bowler required.');
  }

  const extraType = (payload.extraType || '').toLowerCase();
  const isRetiredHurt = extraType === RETIRED_HURT;
  const isWideOrNoBall = extraType === WIDE || extraType === NO_BALL;
  const isLegal = !isWideOrNoBall && !isRetiredHurt;
  const runsBatter = Math.min(6, Math.max(0, payload.runsBatter ?? 0));
  const runsExtra = Math.max(0, payload.runsExtra ?? 0);
  const wicketType = payload.wicketType || null;
  const dismissedPlayerId = payload.dismissedPlayerId ?? null;
  const nextStrikerId = payload.nextStrikerId ? Number(payload.nextStrikerId) : null;
  const nextNonStrikerId = payload.nextNonStrikerId ? Number(payload.nextNonStrikerId) : null;

  if (wicketType && !dismissedPlayerId) throw new Error('dismissedPlayerId required when wicketType is set');
  if (isWideOrNoBall && wicketType) throw new Error('Wicket cannot be taken on a wide/no-ball in this flow');
  if (isRetiredHurt) {
    if (!nextStrikerId || !nextNonStrikerId) throw new Error('Retired hurt requires nextStrikerId and nextNonStrikerId (umpire must set who is on strike).');
    if (nextStrikerId === nextNonStrikerId) throw new Error('Striker and non-striker must be different.');
  }

  const byRules = nextStateByRules(current, {
    ...payload,
    runsBatter,
    runsExtra,
    extraType: isRetiredHurt ? '' : extraType,
  });

  let finalNextStrikerId = byRules.strikerId;
  let finalNextNonStrikerId = byRules.nonStrikerId;

  if (wicketType && dismissedPlayerId) {
    if (nextStrikerId != null && nextNonStrikerId != null) {
      finalNextStrikerId = nextStrikerId;
      finalNextNonStrikerId = nextNonStrikerId;
    } else {
      const [battingSide] = await pool.query(
        'SELECT team_side FROM match_player WHERE match_id = ? AND player_id = ? LIMIT 1',
        [matchId, current.strikerId]
      );
      const teamSide = battingSide[0]?.team_side || 'A';
      const alreadyBatting = [current.strikerId, current.nonStrikerId];
      const nextBatsman = await getNextBatsman(matchId, teamSide, [...alreadyBatting, dismissedPlayerId]);
      finalNextStrikerId = nextBatsman ?? byRules.strikerId;
      finalNextNonStrikerId = current.nonStrikerId;
    }
  } else if (isRetiredHurt) {
    finalNextStrikerId = nextStrikerId;
    finalNextNonStrikerId = nextNonStrikerId;
  }

  const [insertResult] = await pool.query(
    `INSERT INTO ball (
      match_id, over_number, ball_in_over, is_legal_delivery,
      runs_batter, runs_extra, extra_type,
      striker_id, non_striker_id, bowler_id,
      wicket_type, dismissed_player_id, next_striker_id, next_non_striker_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      matchId,
      current.overNumber,
      current.ballInOver + 1,
      isLegal ? 1 : 0,
      isRetiredHurt ? 0 : runsBatter,
      isRetiredHurt ? 0 : runsExtra,
      payload.extraType || null,
      current.strikerId,
      current.nonStrikerId,
      current.bowlerId,
      wicketType,
      dismissedPlayerId,
      finalNextStrikerId,
      finalNextNonStrikerId,
    ]
  );
  const ballId = insertResult.insertId;
  const [ballRows] = await pool.query('SELECT * FROM ball WHERE id = ?', [ballId]);
  const scoreboard = await getScoreboard(matchId);
  return { ball: ballRows[0], scoreboard };
}

async function undoLastBall(matchId) {
  const [rows] = await pool.query('SELECT id FROM ball WHERE match_id = ? ORDER BY id DESC LIMIT 1', [matchId]);
  if (!rows.length) throw new Error('No ball to undo');
  await pool.query('DELETE FROM ball WHERE id = ?', [rows[0].id]);
  const scoreboard = await getScoreboard(matchId);
  return { scoreboard };
}

module.exports = { addBall, undoLastBall, getLastBallState, getScoreboard };
