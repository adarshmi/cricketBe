const scoreboardService = require('../services/scoreboardService');

async function getScoreboard(req, res, next) {
  try {
    const matchId = Number(req.params.matchId);
    const scoreboard = await scoreboardService.getScoreboard(matchId);
    if (!scoreboard) return res.status(404).json({ error: 'Match not found' });
    res.json(scoreboard);
  } catch (e) {
    next(e);
  }
}

module.exports = { getScoreboard };
