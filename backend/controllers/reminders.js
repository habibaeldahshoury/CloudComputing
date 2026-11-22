const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
// POST /api/reminders/send-due (organizer)
async function sendDueReminders(req, res, next) {
try {
const due = await bookingService.findDueReminders();
let sent = 0;
let failed = 0;
for (const item of due) {
try {
await emailService.sendReminderEmail(item);
await bookingService.markReminderSent(item.reminderId);
sent += 1;
} catch (error) {
console.error('Reminder failed:', error.message);
await bookingService.markReminderFailed(item.reminderId);
failed += 1;
}
}
res.status(200).json({ checked: due.length, sent, failed });
} catch (error) {
next(error);
}
}
module.exports = { sendDueReminders };