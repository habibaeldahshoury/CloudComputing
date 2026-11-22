const express = require('express');
const { limitAuth } = require('../middleware/rateLimit');
const { verifyTurnstile } = require('../middleware/turnstile');
const controller = require('../controllers/auth');
const router = express.Router();
router.post('/register', limitAuth, verifyTurnstile, controller.register);
router.post('/login', limitAuth, verifyTurnstile, controller.login);
module.exports = router;