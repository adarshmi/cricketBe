const matchService = require('../services/matchService');

async function list(req, res, next) {
  try {
    const status = req.query.status;
    const createdByUserId = req.user?.id ?? null;
    const matches = await matchService.listMatches(status, createdByUserId);
    res.json(matches);
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const match = await matchService.getMatchById(Number(req.params.id));
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const body = { ...req.body, created_by_user_id: req.user?.id ?? null };
    const id = await matchService.createMatch(body);
    const match = await matchService.getMatchById(id);
    res.status(201).json(match);
  } catch (e) {
    next(e);
  }
}

async function updateStatus(req, res, next) {
  try {
    const match = await matchService.updateMatchStatus(Number(req.params.id), req.body.status);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (e) {
    next(e);
  }
}

async function getPlayers(req, res, next) {
  try {
    const players = await matchService.getMatchPlayers(Number(req.params.matchId));
    res.json(players);
  } catch (e) {
    next(e);
  }
}

async function addPlayer(req, res, next) {
  try {
    const { matchId } = req.params;
    const { playerId, teamSide, battingOrder } = req.body;
    await matchService.addMatchPlayer(Number(matchId), playerId, teamSide, battingOrder);
    const players = await matchService.getMatchPlayers(Number(matchId));
    res.status(201).json(players);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create, updateStatus, getPlayers, addPlayer };
