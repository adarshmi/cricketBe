const express = require('express');
const playerController = require('../controllers/playerController');
const { requireUmpire } = require('../middleware/auth');

const router = express.Router();
router.get('/', playerController.list);
router.post('/', requireUmpire, playerController.create);
router.get('/:id', playerController.getById);
module.exports = router;
