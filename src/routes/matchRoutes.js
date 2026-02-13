const express = require('express');
const matchController = require('../controllers/matchController');
const ballController = require('../controllers/ballController');
const scoreboardController = require('../controllers/scoreboardController');
const { requireUmpire, optionalAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, matchController.list);
router.post('/', requireUmpire, matchController.create);
router.get('/:matchId/scoreboard', scoreboardController.getScoreboard);
router.get('/:matchId/balls', ballController.listBalls);
router.post('/:matchId/balls', requireUmpire, ballController.addBall);
router.post('/:matchId/balls/undo', requireUmpire, ballController.undoLastBall);
router.get('/:matchId/players', matchController.getPlayers);
router.post('/:matchId/players', requireUmpire, matchController.addPlayer);
router.get('/:id', matchController.getById);
router.patch('/:id', requireUmpire, matchController.updateStatus);

module.exports = router;
