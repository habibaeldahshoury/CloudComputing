const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const controller = require('../controllers/reminders');
const router = express.Router();
router.post('/send-due', requireAuth, requireRole('organizer'),
controller.sendDueReminders);
module.exports = router;

const bookingService = require('../services/bookingService');
const queue = require('../services/queueService');
// POST /api/reminders/send-due (organizer)
exports.sendDue = async (req, res, next) => {
try {
const due = await bookingService.findDueReminders();
let queued = 0;
for (const job of due) {
await bookingService.addReminder(job.bookingId);
await queue.sendJob({ type: 'reminder', ...job });
queued++;
}
res.json({ data: { queued } });
} catch (err) { next(err); }
};
const controller = require('../controllers/reminders');
const { requireAuth, requireRole } = require('../middleware/auth');
router.post('/send-due', requireAuth, requireRole('organizer'),
controller.sendDue);
module.exports = router;