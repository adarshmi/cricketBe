const express = require('express');
const authController = require('../controllers/authController');
const { requireUmpire } = require('../middleware/auth');

const router = express.Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireUmpire, authController.me);
module.exports = router;
