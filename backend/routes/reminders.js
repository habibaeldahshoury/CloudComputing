const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const controller = require('../controllers/reminders');
const router = express.Router();
router.post('/send-due', requireAuth, requireRole('organizer'),
controller.sendDueReminders);
module.exports = router;