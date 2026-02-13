const ballService = require('../services/ballService');
const { emitScoreboardUpdate, emitBallAdded, emitBallUndone } = require('../sockets/socketHandler');

async function addBall(req, res, next) {
  try {
    const matchId = Number(req.params.matchId);
    const payload = {
      runsBatter: req.body.runsBatter ?? req.body.runs_batter,
      runsExtra: req.body.runsExtra ?? req.body.runs_extra,
      extraType: req.body.extraType ?? req.body.extra_type,
      strikerId: req.body.strikerId ?? req.body.striker_id,
      nonStrikerId: req.body.nonStrikerId ?? req.body.non_striker_id,
      bowlerId: req.body.bowlerId ?? req.body.bowler_id,
      wicketType: req.body.wicketType ?? req.body.wicket_type,
      dismissedPlayerId: req.body.dismissedPlayerId ?? req.body.dismissed_player_id,
      nextStrikerId: req.body.nextStrikerId ?? req.body.next_striker_id,
      nextNonStrikerId: req.body.nextNonStrikerId ?? req.body.next_non_striker_id,
    };
    const { ball, scoreboard } = await ballService.addBall(matchId, payload);
    emitScoreboardUpdate(matchId, scoreboard);
    emitBallAdded(matchId, ball, scoreboard);
    res.status(201).json({ ball, scoreboard });
  } catch (e) {
    next(e);
  }
}

async function undoLastBall(req, res, next) {
  try {
    const matchId = Number(req.params.matchId);
    const { scoreboard } = await ballService.undoLastBall(matchId);
    emitScoreboardUpdate(matchId, scoreboard);
    emitBallUndone(matchId, scoreboard);
    res.json({ scoreboard });
  } catch (e) {
    if (e.message === 'No ball to undo') return res.status(400).json({ error: e.message });
    next(e);
  }
}

async function listBalls(req, res, next) {
  try {
    const { pool } = require('../config/database');
    const matchId = Number(req.params.matchId);
    const [rows] = await pool.query(
      'SELECT * FROM ball WHERE match_id = ? ORDER BY id ASC',
      [matchId]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

module.exports = { addBall, undoLastBall, listBalls };
